import { PROBLEMS } from '../data/problems';

/**
 * Gemini request/response for the photo diagnosis. Shared by the Cloudflare Worker (production, key kept on the server)
 * and by the app's developer mode. Must stay free of React Native imports.
 */

export interface Finding {
  problemId: string; // id from PROBLEMS, or 'altro'
  name: string;
  confidence: number; // 0–100
  evidence: string;
}

export interface Diagnosis {
  isCannabisPlant: boolean;
  photoQuality: 'buona' | 'sufficiente' | 'scarsa';
  photoNote: string;
  overall: 'sana' | 'attenzione' | 'critica';
  summary: string;
  findings: Finding[];
  actions: string[];
  followUp: string;
}

export interface DiagnosisContext {
  cultivar?: string;
  types?: string[];
  stage?: string;
  dayInStage?: number;
  environment?: 'indoor' | 'outdoor';
  medium?: string;
  readings?: { temp?: number; rh?: number; vpd?: number; ph?: number | null; ec?: number | null };
  note?: string;
}

/** Models tried in order: Flash-Lite is the cheapest vision model; Flash is the fallback when it is busy. */
export const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const CATALOG = PROBLEMS.map((p) => `- ${p.id}: ${p.name} (${p.category}; dove: ${p.where}; sintomi: ${p.symptoms.join(' ')})`).join('\n');

export const SYSTEM = `Sei un agronomo esperto di coltivazione di cannabis. Analizzi foto di piante inviate da coltivatori tramite l'app Grow Lab e rispondi sempre in italiano.

Come lavorare:
- Descrivi solo ciò che è visibile nella foto. Se un segno non si vede, non inventarlo.
- Usa il contesto (genetica, fase, ambiente, misure) per distinguere cause simili: per esempio l'ingiallimento delle foglie basse in tarda fioritura è spesso normale, un pH fuori range causa carenze multiple, alcune genetiche hanno steli viola per natura, le bruciature da luce colpiscono le foglie in alto vicino alla lampada mentre quelle da nutrienti partono dalle punte.
- Distingui le carenze mobili (azoto, fosforo, potassio, magnesio: foglie vecchie in basso) da quelle immobili (calcio, ferro, zolfo, manganese, zinco: foglie giovani in alto).
- Collega ogni problema a un id del catalogo qui sotto. Usa "altro" solo se nessuna voce è adatta.
- La confidenza deve riflettere quanto la foto supporta la diagnosi: abbassala se la foto è sfocata, buia, troppo lontana o mostra solo una parte della pianta.
- Le azioni devono essere pratiche, ordinate per urgenza e coerenti con la fase (niente spray sulle cime in fioritura).
- Se la foto non ritrae una pianta di cannabis, imposta isCannabisPlant a false, lascia findings vuoto e spiega in summary cosa fotografare.

Catalogo dei problemi:
${CATALOG}`;

export const SCHEMA = {
  type: 'OBJECT',
  properties: {
    isCannabisPlant: { type: 'BOOLEAN' },
    photoQuality: { type: 'STRING', enum: ['buona', 'sufficiente', 'scarsa'] },
    photoNote: { type: 'STRING', description: 'Come fare una foto migliore; vuoto se la qualità è buona' },
    overall: { type: 'STRING', enum: ['sana', 'attenzione', 'critica'] },
    summary: { type: 'STRING', description: '2-3 frasi: cosa si vede e la causa più probabile' },
    findings: {
      type: 'ARRAY',
      maxItems: 4,
      items: {
        type: 'OBJECT',
        properties: {
          problemId: { type: 'STRING', enum: [...PROBLEMS.map((p) => p.id), 'altro'] },
          name: { type: 'STRING' },
          confidence: { type: 'INTEGER', minimum: 0, maximum: 100 },
          evidence: { type: 'STRING', description: 'I segni visibili nella foto che supportano la diagnosi' },
        },
        required: ['problemId', 'name', 'confidence', 'evidence'],
      },
    },
    actions: { type: 'ARRAY', items: { type: 'STRING' }, maxItems: 6 },
    followUp: { type: 'STRING', description: 'Cosa ricontrollare e quando' },
  },
  required: ['isCannabisPlant', 'photoQuality', 'photoNote', 'overall', 'summary', 'findings', 'actions', 'followUp'],
};

export class DiagnosisError extends Error {
  constructor(
    message: string,
    public kind: 'key' | 'quota' | 'network' | 'blocked' | 'other',
  ) {
    super(message);
  }
}

async function callModel(model: string, apiKey: string, imageBase64: string, context: DiagnosisContext, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
              { text: `Contesto della pianta (JSON):\n${JSON.stringify(context, null, 2)}\n\nAnalizza la foto e restituisci la diagnosi.` },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 },
      }),
    });
  } catch {
    throw new DiagnosisError('Connessione non riuscita. Controlla la rete e riprova.', 'network');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await res.json().catch(() => null);
  if (!res.ok) {
    const msg: string = body?.error?.message ?? `Errore ${res.status}`;
    if (res.status === 400 && /api key/i.test(msg))
      throw new DiagnosisError('Chiave API non valida: ricontrollala nelle impostazioni.', 'key');
    if (res.status === 401 || res.status === 403) throw new DiagnosisError('Chiave API non valida o non abilitata.', 'key');
    if (res.status === 429) throw new DiagnosisError('Troppe richieste al servizio di analisi. Riprova tra qualche minuto.', 'quota');
    if (res.status === 404 || res.status >= 500) throw new DiagnosisError(msg, 'other');
    throw new DiagnosisError(msg, 'other');
  }
  const candidate = body?.candidates?.[0];
  const text: string | undefined = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) {
    if (body?.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY')
      throw new DiagnosisError("Google non ha analizzato questa immagine. Prova un'inquadratura più ravvicinata delle foglie.", 'blocked');
    throw new DiagnosisError('Risposta vuota dal modello. Riprova.', 'other');
  }
  const parsed = JSON.parse(text) as Diagnosis;
  return {
    ...parsed,
    findings: (parsed.findings ?? [])
      .map((f) => ({ ...f, confidence: Math.max(0, Math.min(100, Math.round(f.confidence))) }))
      .sort((a, b) => b.confidence - a.confidence),
    actions: parsed.actions ?? [],
  };
}

/** Sends a JPEG (base64, no data: prefix) to Gemini and returns the diagnosis, trying the next model on quota or availability errors. */
export async function diagnoseWithGemini(
  apiKey: string,
  imageBase64: string,
  context: DiagnosisContext,
  signal?: AbortSignal,
): Promise<{ result: Diagnosis; model: string }> {
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      return { result: await callModel(model, apiKey.trim(), imageBase64, context, signal), model };
    } catch (e) {
      lastError = e;
      if (!(e instanceof DiagnosisError) || e.kind === 'key' || e.kind === 'network' || e.kind === 'blocked') throw e;
    }
  }
  throw lastError;
}
