import { StageId, StrainTypeId } from '../data/types';

export const C = {
  bg: '#05080A',
  surface: '#0E161B',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.14)',
  text: '#ECF3EF',
  muted: '#8A9A93',
  faint: '#56655F',
  leaf: '#34D88A',
  leafDeep: '#0E9F5D',
  amber: '#F7B946',
  violet: '#A78BFA',
  sky: '#38BDF8',
  rose: '#FB7185',
  lime: '#C6F36B',
};

export const STAGE_COLOR: Record<StageId, string> = {
  germinazione: '#C6F36B',
  piantina: '#6EE7A8',
  vegetativa: '#34D88A',
  fioritura: '#A78BFA',
  raccolta: '#F7B946',
  essiccazione: '#E99A1C',
  concia: '#FB7185',
};

export const TYPE_COLOR: Record<StrainTypeId, string> = {
  indica: '#A78BFA',
  sativa: '#F7B946',
  ibrida: '#34D88A',
  autofiorente: '#38BDF8',
  fotoperiodica: '#C6F36B',
  cbd: '#6EE7A8',
};

export const METRIC_COLOR = {
  temp: '#FB7185',
  rh: '#38BDF8',
  vpd: '#A78BFA',
  ph: '#C6F36B',
  ec: '#F7B946',
  ppfd: '#FCD47D',
  height: '#34D88A',
};

/** Hex color with alpha (0–1) for SVG and inline styles. */
export const alpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
