import { StageId } from './types';

export type MetricKey = 'temp' | 'rh' | 'vpd' | 'ph' | 'ec' | 'ppfd';

export interface MetricMeta {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  digits: number;
  scale: [number, number]; // full axis used for range bars
}

export const METRICS: Record<MetricKey, MetricMeta> = {
  temp: { key: 'temp', label: 'Temperatura', short: 'Temp', unit: '°C', digits: 1, scale: [10, 35] },
  rh: { key: 'rh', label: 'Umidità relativa', short: 'UR', unit: '%', digits: 0, scale: [20, 100] },
  vpd: { key: 'vpd', label: 'VPD fogliare', short: 'VPD', unit: 'kPa', digits: 2, scale: [0, 2] },
  ph: { key: 'ph', label: 'pH soluzione', short: 'pH', unit: '', digits: 1, scale: [5, 7.5] },
  ec: { key: 'ec', label: 'EC soluzione', short: 'EC', unit: 'mS/cm', digits: 1, scale: [0, 2.6] },
  ppfd: { key: 'ppfd', label: 'Intensità luce (PPFD)', short: 'PPFD', unit: 'µmol', digits: 0, scale: [0, 1100] },
};

type Ranges = Partial<Record<MetricKey, [number, number]>>;

/** Ideal environmental envelope per stage (soil/coco pH shown as a combined window). */
export const STAGE_RANGES: Record<StageId, Ranges> = {
  germinazione: { temp: [22, 25], rh: [70, 90], vpd: [0.3, 0.6] },
  piantina: { temp: [20, 25], rh: [65, 70], vpd: [0.4, 0.8], ph: [5.8, 6.8], ec: [0.4, 0.8], ppfd: [200, 400] },
  vegetativa: { temp: [22, 28], rh: [50, 70], vpd: [0.8, 1.2], ph: [5.8, 6.8], ec: [1.0, 1.6], ppfd: [400, 600] },
  fioritura: { temp: [20, 26], rh: [40, 50], vpd: [1.2, 1.6], ph: [5.8, 6.8], ec: [1.4, 2.0], ppfd: [600, 900] },
  raccolta: { temp: [18, 24], rh: [40, 50] },
  essiccazione: { temp: [16, 20], rh: [55, 62] },
  concia: { temp: [15, 21], rh: [58, 65] },
};

export const STAGE_ORDER: StageId[] = ['germinazione', 'piantina', 'vegetativa', 'fioritura', 'raccolta', 'essiccazione', 'concia'];

export const STAGE_SHORT: Record<StageId, string> = {
  germinazione: 'Germ.',
  piantina: 'Piant.',
  vegetativa: 'Veg.',
  fioritura: 'Fior.',
  raccolta: 'Racc.',
  essiccazione: 'Essic.',
  concia: 'Concia',
};

/** Typical duration in days (min, max) used for the cycle timeline. */
export const STAGE_DAYS: Record<StageId, [number, number]> = {
  germinazione: [2, 7],
  piantina: [14, 21],
  vegetativa: [21, 56],
  fioritura: [49, 98],
  raccolta: [1, 2],
  essiccazione: [7, 14],
  concia: [14, 56],
};

export function rangeStatus(value: number, range?: [number, number]) {
  if (!range) return 'na' as const;
  const [lo, hi] = range;
  const span = hi - lo;
  if (value >= lo && value <= hi) return 'ok' as const;
  if (value >= lo - span * 0.25 && value <= hi + span * 0.25) return 'warn' as const;
  return 'bad' as const;
}
