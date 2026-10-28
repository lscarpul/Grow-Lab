/** Deterministic PRNG (mulberry32) so mock data stays stable between launches. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const round = (v: number, digits = 1) => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};

/** Leaf VPD in kPa, with leaf temperature ~2 °C below air (typical under LED). */
export function vpd(tempC: number, rh: number, leafOffset = -2) {
  const svp = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
  const leaf = svp(tempC + leafOffset);
  const air = svp(tempC) * (rh / 100);
  return Math.max(0, leaf - air);
}

/** Daily Light Integral (mol/m²/day) from PPFD and hours of light. */
export const dli = (ppfd: number, hours: number) => (ppfd * hours * 3600) / 1_000_000;

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Percent change between the mean of the last `window` values and the window before it. */
export function trend(xs: number[], window = 7) {
  if (xs.length < window * 2) return 0;
  const recent = mean(xs.slice(-window));
  const prev = mean(xs.slice(-window * 2, -window));
  if (prev === 0) return 0;
  return ((recent - prev) / Math.abs(prev)) * 100;
}

export const DAY = 86_400_000;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const WEEKDAYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

export const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const fmtWeekday = (d: Date) => WEEKDAYS[d.getDay()];
export const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const fmtNum = (v: number, digits = 1) =>
  v.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtSigned = (v: number, digits = 1) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${fmtNum(Math.abs(v), digits)}`;

export function relativeDay(d: Date, now = new Date()) {
  const diff = daysBetween(d, now);
  if (diff === 0) return 'oggi';
  if (diff === 1) return 'ieri';
  if (diff < 7) return `${diff} giorni fa`;
  return fmtDate(d);
}
