// Runs the Worker against an in-memory KV and a fake Gemini endpoint: `npm test`.
import assert from 'node:assert/strict';
import worker, { Env } from '../src/index';

const store = new Map<string, string>();
const kv = {
  get: async (k: string) => store.get(k) ?? null,
  put: async (k: string, v: string) => void store.set(k, v),
} as unknown as KVNamespace;

const calls: { url: string; body: any; headers: Record<string, string> }[] = [];
let geminiStatus = 200;
globalThis.fetch = (async (url: string, init: RequestInit) => {
  calls.push({ url, body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> });
  if (geminiStatus !== 200) return new Response(JSON.stringify({ error: { message: 'quota' } }), { status: geminiStatus });
  const diagnosis = {
    isCannabisPlant: true,
    photoQuality: 'buona',
    photoNote: '',
    overall: 'attenzione',
    summary: 'Clorosi internervale.',
    findings: [{ problemId: 'magnesio', name: 'Carenza di magnesio', confidence: 81.4, evidence: 'Nervature verdi' }],
    actions: ['Cal-Mag 1 ml/L'],
    followUp: 'Ricontrolla tra 5 giorni',
  };
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(diagnosis) }] } }] }), { status: 200 });
}) as typeof fetch;

const env: Env = { GEMINI_API_KEY: 'test-key', APP_TOKEN: 'tok', DAILY_LIMIT_PER_DEVICE: '2', GLOBAL_DAILY_LIMIT: '100', USAGE: kv };
const device = '3b241101-e2bb-4255-8caf-4136c566a962';
const req = (
  headers: Record<string, string>,
  body: unknown = { image: 'x'.repeat(2000), context: { stage: 'Fioritura', note: 'n'.repeat(1000) } },
) =>
  new Request('https://w.example/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const ok = { 'X-Device-Id': device, 'X-App-Token': 'tok' };

let r = await worker.fetch(req({ 'X-Device-Id': device }), env);
assert.equal(r.status, 401, 'missing app token is rejected');

r = await worker.fetch(req({ ...ok, 'X-Device-Id': 'nope' }), env);
assert.equal(r.status, 400, 'bad device id is rejected');

r = await worker.fetch(req(ok), env);
assert.equal(r.status, 200);
let b: any = await r.json();
assert.equal(b.diagnosis.findings[0].confidence, 81, 'confidence rounded');
assert.equal(b.remaining, 1);
assert.match(calls[0].url, /gemini-3\.5-flash-lite:generateContent$/, 'cheapest model first');
assert.equal(calls[0].headers['x-goog-api-key'], 'test-key', 'key sent as header, never in URL');
assert.equal(calls[0].body.contents[0].parts[0].inlineData.mimeType, 'image/jpeg');
assert.equal(calls[0].body.generationConfig.responseMimeType, 'application/json');
assert.ok(calls[0].body.contents[0].parts[1].text.length < 900, 'free-text note is capped');

r = await worker.fetch(req(ok), env);
assert.equal(r.status, 200);
r = await worker.fetch(req(ok), env);
assert.equal(r.status, 429, 'daily device limit enforced');
b = await r.json();
assert.equal(b.remaining, 0);

store.clear();
calls.length = 0;
geminiStatus = 429;
r = await worker.fetch(req(ok), env);
assert.equal(r.status, 503, 'upstream quota maps to 503');
assert.equal(calls.length, 2, 'falls back to the second model');
assert.equal(store.size, 0, 'failed analyses are not counted');

console.log('worker tests passed');
