/**
 * Grow Lab diagnosis proxy (Cloudflare Worker).
 * The Gemini key lives only here as a secret. The app sends a resized JPEG plus the plant context;
 * the Worker enforces a daily limit per device and a global daily cap, calls Gemini and returns the diagnosis.
 * Photos are not stored.
 */
import { DiagnosisContext, DiagnosisError, diagnoseWithGemini } from '../../src/lib/gemini';

export interface Env {
  GEMINI_API_KEY: string;
  APP_TOKEN?: string;
  DAILY_LIMIT_PER_DEVICE?: string;
  GLOBAL_DAILY_LIMIT?: string;
  USAGE: KVNamespace;
}

const MAX_IMAGE_CHARS = 6 * 1024 * 1024; // ~4.5 MB JPEG once decoded
const DEVICE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Device-Id, X-App-Token, X-App-Platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

const today = () => new Date().toISOString().slice(0, 10);

async function count(kv: KVNamespace, key: string) {
  return Number((await kv.get(key)) ?? 0);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method === 'GET' && url.pathname === '/health') return json(200, { ok: true });
    if (req.method !== 'POST' || url.pathname !== '/diagnose') return json(404, { error: 'Not found' });

    if (env.APP_TOKEN && req.headers.get('X-App-Token') !== env.APP_TOKEN) return json(401, { error: 'App non autorizzata' });
    const device = (req.headers.get('X-Device-Id') ?? '').toLowerCase();
    if (!DEVICE_RE.test(device)) return json(400, { error: 'Dispositivo non riconosciuto' });

    const perDevice = Number(env.DAILY_LIMIT_PER_DEVICE ?? 5);
    const global = Number(env.GLOBAL_DAILY_LIMIT ?? 400);
    const day = today();
    const deviceKey = `d:${day}:${device}`;
    const globalKey = `g:${day}`;
    const [used, usedGlobal] = await Promise.all([count(env.USAGE, deviceKey), count(env.USAGE, globalKey)]);
    if (used >= perDevice) return json(429, { error: `Hai usato le ${perDevice} analisi di oggi. Riprova domani.`, remaining: 0 });
    if (usedGlobal >= global) return json(429, { error: 'Il servizio ha raggiunto il limite di oggi. Riprova domani.', remaining: 0 });

    let body: { image?: unknown; context?: DiagnosisContext };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Richiesta non valida' });
    }
    if (typeof body.image !== 'string' || body.image.length < 1000) return json(400, { error: 'Foto mancante' });
    if (body.image.length > MAX_IMAGE_CHARS) return json(413, { error: 'Foto troppo grande' });

    try {
      const { result, model } = await diagnoseWithGemini(env.GEMINI_API_KEY, body.image, sanitize(body.context));
      // Count only successful analyses. KV is eventually consistent: limits are approximate by a request or two.
      await Promise.all([
        env.USAGE.put(deviceKey, String(used + 1), { expirationTtl: 60 * 60 * 48 }),
        env.USAGE.put(globalKey, String(usedGlobal + 1), { expirationTtl: 60 * 60 * 48 }),
      ]);
      return json(200, { diagnosis: result, model, remaining: perDevice - used - 1 });
    } catch (e) {
      if (e instanceof DiagnosisError) {
        if (e.kind === 'blocked') return json(422, { error: e.message });
        if (e.kind === 'quota') return json(503, { error: 'Servizio di analisi occupato, riprova tra poco.' });
        if (e.kind === 'key') return json(500, { error: 'Servizio non configurato correttamente.' });
      }
      console.error(e);
      return json(502, { error: 'Analisi non riuscita, riprova.' });
    }
  },
};

/** Keeps only the expected context fields and caps free text, so the endpoint cannot be used as a general-purpose prompt. */
function sanitize(c: DiagnosisContext | undefined): DiagnosisContext {
  if (!c || typeof c !== 'object') return {};
  const str = (v: unknown, max = 80) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const r = c.readings ?? {};
  return {
    cultivar: str(c.cultivar),
    types: Array.isArray(c.types)
      ? c.types
          .filter((t) => typeof t === 'string')
          .slice(0, 6)
          .map((t) => t.slice(0, 20))
      : undefined,
    stage: str(c.stage, 30),
    dayInStage: num(c.dayInStage),
    environment: c.environment === 'indoor' || c.environment === 'outdoor' ? c.environment : undefined,
    medium: str(c.medium, 40),
    readings: { temp: num(r.temp), rh: num(r.rh), vpd: num(r.vpd), ph: num(r.ph) ?? null, ec: num(r.ec) ?? null },
    note: str(c.note, 300),
  };
}
