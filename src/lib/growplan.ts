import { Cultivar } from '../data/cultivars';
import { KitConfig, kitStats, SPACES, Technique } from '../data/kit';

/* ───────────── Guided lamp wattage ───────────── */

export interface LampPreset {
  id: 'risparmio' | 'bilanciato' | 'resa';
  label: string;
  tagline: string;
  watts: number;
  ppfd: number; // average canopy PPFD at flowering height
}

// Common real-wattage sizes of quality LED bars sold in Europe.
const LAMP_SIZES = [65, 100, 150, 200, 240, 300, 320, 400, 480, 600, 720, 800];
const nearest = (w: number) => LAMP_SIZES.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
const EFFICACY = 2.6; // µmol/J, mid-range quality LED

/** Three ready-made choices for the tent area instead of a free watt input. */
export function lampPresets(space: KitConfig['space']): LampPreset[] {
  const s = SPACES.find((x) => x.id === space)!;
  if (!s.indoor || !s.dims) return [];
  const area = (s.dims[0] * s.dims[1]) / 10000;
  const mk = (id: LampPreset['id'], label: string, tagline: string, wPerM2: number): LampPreset => {
    const watts = nearest(area * wPerM2);
    return { id, label, tagline, watts, ppfd: Math.round(((watts * EFFICACY) / area) * 0.85) };
  };
  const list = [
    mk('risparmio', 'Basso consumo', 'Bolletta leggera · resa minore', 230),
    mk('bilanciato', 'Bilanciato', 'Il miglior rapporto resa/spesa', 320),
    mk('resa', 'Alta resa', 'Più grammi · bolletta più alta', 420),
  ];
  // Small tents can round two presets to the same lamp: keep distinct sizes only.
  return list.filter((p, i) => list.findIndex((q) => q.watts === p.watts) === i);
}

/* ───────────── Electricity ───────────── */

export interface Device {
  id: string;
  label: string;
  watts: number;
  hoursVeg: number;
  hoursFlower: number;
}

export function growDevices(c: KitConfig): Device[] {
  const s = kitStats(c);
  if (!SPACES.find((x) => x.id === c.space)?.indoor) return [];
  const auto = c.kind === 'auto';
  const list: Device[] = [
    { id: 'luce', label: `Lampada LED ${s.ledW} W`, watts: s.ledW, hoursVeg: auto ? 20 : 18, hoursFlower: auto ? 20 : 12 },
    { id: 'estrattore', label: 'Estrattore + filtro', watts: c.budget === 'pro' ? 35 : 60, hoursVeg: 24, hoursFlower: 24 },
    { id: 'ventola', label: 'Ventilatore a clip', watts: 15, hoursVeg: 24, hoursFlower: 24 },
  ];
  if (c.dehumidifier) list.push({ id: 'deumidificatore', label: 'Deumidificatore', watts: 200, hoursVeg: 2, hoursFlower: 8 });
  if (c.heater) list.push({ id: 'riscaldatore', label: 'Riscaldatore', watts: 400, hoursVeg: 4, hoursFlower: 4 });
  return list;
}

export function energyPlan(c: KitConfig) {
  const price = c.kwhPrice ?? 0.3;
  const devices = growDevices(c).map((d) => {
    const kwhVeg = (d.watts * d.hoursVeg * 30) / 1000;
    const kwhFlower = (d.watts * d.hoursFlower * 30) / 1000;
    return { ...d, kwhVeg, kwhFlower, eurVeg: kwhVeg * price, eurFlower: kwhFlower * price };
  });
  const monthVeg = devices.reduce((a, d) => a + d.eurVeg, 0);
  const monthFlower = devices.reduce((a, d) => a + d.eurFlower, 0);
  // Photoperiod: ~1 month seedling/veg + ~2 months flowering. Auto: ~2.7 months at 20/4.
  const cycle = c.kind === 'auto' ? monthVeg * 2.7 : monthVeg * 1.2 + monthFlower * 2.1;
  const kwhMonth = devices.reduce((a, d) => a + (c.kind === 'auto' ? d.kwhVeg : d.kwhFlower), 0);
  return { price, devices, monthVeg, monthFlower, cycle, kwhMonth };
}

/* ───────────── Yield ───────────── */

export const TECHNIQUES: { id: Technique; label: string; info: string; factor: number; autoOk: boolean }[] = [
  {
    id: 'seme',
    label: 'Da seme',
    info: "Parti da un seme femminizzato: radice fittonante e piante vigorose, ma ogni pianta è un po' diversa dalle altre.",
    factor: 1,
    autoOk: true,
  },
  {
    id: 'talea',
    label: 'Talea',
    info: 'Un rametto tagliato da una pianta madre e fatto radicare: è un clone identico, salti la germinazione e le piante crescono tutte uguali.',
    factor: 1.05,
    autoOk: false,
  },
  {
    id: 'scrog',
    label: 'SCROG',
    info: '"Screen of Green": una rete orizzontale sopra le piante; pieghi i rami sotto la rete per ottenere un tappeto uniforme di cime alla stessa distanza dalla luce. Poche piante, più vegetativa, più resa per watt.',
    factor: 1.2,
    autoOk: false,
  },
  {
    id: 'sog',
    label: 'SOG',
    info: '"Sea of Green": tante piante piccole, vegetativa brevissima e fioritura subito. Una cima principale per pianta e cicli più corti (più raccolti l\'anno).',
    factor: 1.08,
    autoOk: true,
  },
];

export const YIELD_LEVELS = ['Molto bassa', 'Bassa', 'Media', 'Alta', 'Molto alta'] as const;

/** 1–5 visual yield class of a cultivar (no grams: those depend on space, lamp and technique). */
export function yieldLevel(c: Pick<Cultivar, 'yieldIndoor'>) {
  const avg = (c.yieldIndoor[0] + c.yieldIndoor[1]) / 2;
  const level = avg < 360 ? 1 : avg < 430 ? 2 : avg < 500 ? 3 : avg < 570 ? 4 : 5;
  return { level, label: YIELD_LEVELS[level - 1] };
}

/**
 * Final grams estimate. Grams per watt on a mid-range LED (0.5–0.9 g/W for home growers) scaled by the strain,
 * the technique and the light density; capped by what the canopy area can physically hold.
 */
export function estimateYield(c: KitConfig, cultivar?: Cultivar) {
  if (!c.ledW || !c.technique) return null;
  const s = kitStats(c);
  if (!s.area) return null;
  const tech = TECHNIQUES.find((t) => t.id === c.technique)!;
  const strain = cultivar ? Math.min(1.3, Math.max(0.75, (cultivar.yieldIndoor[0] + cultivar.yieldIndoor[1]) / 2 / 470)) : 1;
  const auto = c.kind === 'auto' ? 0.78 : 1;
  const density = c.ledW / s.area; // W/m²: past ~450 W/m² extra light gives little extra yield at home
  const saturation = density > 450 ? 450 / density + (1 - 450 / density) * 0.35 : 1;
  const gpw: [number, number] = [0.5, 0.85];
  const k = tech.factor * strain * auto * saturation;
  const cap = (cultivar?.yieldIndoor[1] ?? 550) * 1.15 * s.area * tech.factor;
  const round = (v: number) => Math.max(10, Math.round(v / 10) * 10);
  const lo = round(Math.min(cap * 0.7, c.ledW * gpw[0] * k));
  const hi = round(Math.min(cap, c.ledW * gpw[1] * k));
  return {
    range: [lo, hi] as [number, number],
    perPlant: [round(lo / c.plants), round(hi / c.plants)] as [number, number],
    gpw: [lo / c.ledW, hi / c.ledW] as [number, number],
    tech,
  };
}
