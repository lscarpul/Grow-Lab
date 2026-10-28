import { Platform } from 'react-native';
import { Diagnosis, DiagnosisContext, DiagnosisError, diagnoseWithGemini } from './gemini';

export type { Diagnosis, DiagnosisContext, Finding } from './gemini';
export { DiagnosisError } from './gemini';

/**
 * Production: the app calls the Grow Lab Worker (EXPO_PUBLIC_DIAGNOSIS_URL), which holds the Gemini key and applies
 * a daily limit per device. Developer mode: a personal Gemini key typed in the app, for testing only.
 * With neither, the screen shows a clearly labelled example result.
 */
export const DIAGNOSIS_URL = process.env.EXPO_PUBLIC_DIAGNOSIS_URL?.replace(/\/$/, '') ?? '';
const APP_TOKEN = process.env.EXPO_PUBLIC_DIAGNOSIS_TOKEN ?? '';
export const KEY_URL = 'https://aistudio.google.com/apikey';

export type DiagnosisMode = 'server' | 'dev' | 'demo';
export const diagnosisMode = (devKey: string): DiagnosisMode => (DIAGNOSIS_URL ? 'server' : devKey ? 'dev' : 'demo');

export interface DiagnosisOutcome {
  result: Diagnosis;
  model?: string;
  remaining?: number; // photos left today for this device (server mode)
}

export async function diagnosePhoto(
  opts: { deviceId: string; devKey: string; imageBase64: string; context: DiagnosisContext },
  signal?: AbortSignal,
): Promise<DiagnosisOutcome> {
  const mode = diagnosisMode(opts.devKey);
  if (mode === 'dev') {
    const out = await diagnoseWithGemini(opts.devKey, opts.imageBase64, opts.context, signal);
    return { result: out.result, model: out.model };
  }
  if (mode === 'demo') {
    await new Promise((r) => setTimeout(r, 1800));
    return { result: demoDiagnosis(opts.context) };
  }
  let res: Response;
  try {
    res = await fetch(`${DIAGNOSIS_URL}/diagnose`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': opts.deviceId,
        'X-App-Platform': Platform.OS,
        ...(APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : {}),
      },
      body: JSON.stringify({ image: opts.imageBase64, context: opts.context }),
    });
  } catch {
    throw new DiagnosisError('Connessione non riuscita. Controlla la rete e riprova.', 'network');
  }
  const body = await res.json().catch(() => null);
  if (res.status === 429) throw new DiagnosisError(body?.error ?? 'Hai usato tutte le analisi di oggi. Riprova domani.', 'quota');
  if (!res.ok) throw new DiagnosisError(body?.error ?? `Errore del servizio (${res.status})`, res.status === 422 ? 'blocked' : 'other');
  return { result: body.diagnosis as Diagnosis, model: body.model, remaining: body.remaining };
}

/** Example result shown when no service is configured, so the screen can be tried out. Clearly labelled as an example in the UI. */
export function demoDiagnosis(context: DiagnosisContext): Diagnosis {
  const flowering = context.stage?.toLowerCase() === 'fioritura';
  return {
    isCannabisPlant: true,
    photoQuality: 'sufficiente',
    photoNote: 'Avvicinati a 20–30 cm dalle foglie colpite e fotografa con luce bianca, non sotto il LED viola.',
    overall: 'attenzione',
    summary: flowering
      ? 'Le foglie medio-basse mostrano ingiallimento tra le nervature con nervature ancora verdi. Con le cime in formazione è compatibile con una carenza di magnesio, frequente sotto LED.'
      : 'Le foglie più vecchie in basso ingialliscono in modo uniforme partendo dalla punta. In vegetativa è il quadro tipico di una carenza di azoto.',
    findings: flowering
      ? [
          {
            problemId: 'magnesio',
            name: 'Carenza di magnesio',
            confidence: 72,
            evidence: 'Clorosi internervale sulle foglie medie, nervature verdi, margini che iniziano a seccare.',
          },
          {
            problemId: 'azoto',
            name: 'Carenza di azoto',
            confidence: 21,
            evidence: 'Leggero ingiallimento uniforme delle foglie più basse.',
          },
        ]
      : [
          {
            problemId: 'azoto',
            name: 'Carenza di azoto',
            confidence: 78,
            evidence: "Ingiallimento uniforme delle foglie basse, che procede dal basso verso l'alto.",
          },
          {
            problemId: 'blocco-ph',
            name: 'pH fuori range',
            confidence: 18,
            evidence: 'Alcune macchie irregolari potrebbero indicare un blocco di assorbimento.',
          },
        ],
    actions: flowering
      ? [
          'Misura il pH del drenaggio: deve stare tra 6,2 e 6,8 in terra.',
          'Aggiungi Cal-Mag a 0,5–1 ml/L alla prossima annaffiatura.',
          'Non togliere le foglie gialle finché non si seccano: la pianta ne recupera i nutrienti.',
        ]
      : [
          'Aumenta il concime da crescita del 20–25% alla prossima annaffiatura.',
          'Controlla pH del drenaggio ed EC prima di correggere ancora.',
          'Annota la data: le foglie nuove devono restare verdi entro 5–7 giorni.',
        ],
    followUp: 'Rifai una foto delle stesse foglie tra 5 giorni: le foglie già colpite non tornano verdi, guarda quelle nuove.',
  };
}
