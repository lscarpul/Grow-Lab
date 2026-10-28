import { Medium } from './kit';

export type NutrientType = 'Organico' | 'Minerale';
export type Level = 'Principiante' | 'Intermedio' | 'Esperto';
export type PackId = 'essenziale' | 'parziale' | 'completo';

export interface NutrientPack {
  id: PackId;
  price: number; // € for the whole pack
  ml: number; // total concentrate in the pack, used to estimate how many packs a grow needs
  items: string[];
}

export interface NutrientLine {
  id: string;
  brand: string;
  line: string;
  type: NutrientType;
  level: Level;
  media: Medium[]; // substrates the line is made for
  note: string;
  packs: NutrientPack[];
  /** ml of concentrate per litre of water, by week: vegetative weeks first, then flowering weeks. */
  schedule: { grow: number[]; bloom: number[] };
  products: [string, string]; // names of the main grow / bloom products in the schedule
}

export const PACK_LABEL: Record<PackId, string> = { essenziale: 'Essenziale', parziale: 'Parziale', completo: 'Completo' };
export const LEVEL_RANK: Record<Level, number> = { Principiante: 1, Intermedio: 2, Esperto: 3 };

/** Indicative street prices (Italian grow shops, 1 L bottles unless stated). */
export const NUTRIENT_LINES: NutrientLine[] = [
  {
    id: 'biobizz',
    brand: 'BioBizz',
    line: 'Bio-Grow / Bio-Bloom',
    type: 'Organico',
    level: 'Principiante',
    media: ['terra', 'terra-ricca', 'cocco'],
    note: 'La linea organica più usata: dosi basse e tolleranti, il terriccio fa da tampone.',
    packs: [
      { id: 'essenziale', price: 13, ml: 750, items: ['Try Pack Indoor: Bio-Grow, Bio-Bloom, Top-Max 250 ml'] },
      { id: 'parziale', price: 45, ml: 3000, items: ['Bio-Grow 1 L', 'Bio-Bloom 1 L', 'Top-Max 1 L'] },
      { id: 'completo', price: 112, ml: 6000, items: ['Bio-Grow, Bio-Bloom, Top-Max 1 L', 'Root-Juice, Alg-A-Mic, Acti-Vera 1 L'] },
    ],
    schedule: { grow: [1, 2, 2, 3], bloom: [3, 4, 4, 4, 4, 4, 2, 0] },
    products: ['Bio-Grow', 'Bio-Bloom'],
  },
  {
    id: 'biotabs',
    brand: 'BioTabs',
    line: 'Starter Box',
    type: 'Organico',
    level: 'Principiante',
    media: ['terra', 'terra-ricca'],
    note: 'Pastiglie a lento rilascio nel vaso: niente dosi settimanali, solo acqua e un booster in fioritura.',
    packs: [
      { id: 'essenziale', price: 29, ml: 500, items: ['Starter Box: BioTabs, Bactrex, Mycotrex, Orgatrex (piccola)'] },
      { id: 'parziale', price: 49, ml: 1000, items: ['BioTabs 100 pz', 'Orgatrex 1 L'] },
      { id: 'completo', price: 79, ml: 2000, items: ['BioTabs 100 pz', 'Orgatrex 1 L', 'Bactrex 250 g', 'Mycotrex 100 g'] },
    ],
    schedule: { grow: [0, 0, 1, 1], bloom: [2, 2, 3, 3, 3, 2, 0, 0] },
    products: ['Pastiglie (nel vaso)', 'Orgatrex'],
  },
  {
    id: 'plagron-terra',
    brand: 'Plagron',
    line: 'Terra Grow / Terra Bloom',
    type: 'Minerale',
    level: 'Principiante',
    media: ['terra', 'terra-ricca'],
    note: 'Minerale semplice a due bottiglie, pensato per terra: buon punto di partenza per imparare a misurare il pH.',
    packs: [
      { id: 'essenziale', price: 24, ml: 2000, items: ['Terra Grow 1 L', 'Terra Bloom 1 L'] },
      { id: 'parziale', price: 52, ml: 2500, items: ['Terra Grow 1 L', 'Terra Bloom 1 L', 'Green Sensation 250 ml'] },
      {
        id: 'completo',
        price: 108,
        ml: 3500,
        items: ['Terra Grow, Terra Bloom 1 L', 'Green Sensation, Power Roots, Pure Zym, Sugar Royal'],
      },
    ],
    schedule: { grow: [2, 3, 4, 4], bloom: [4, 5, 5, 5, 5, 5, 3, 0] },
    products: ['Terra Grow', 'Terra Bloom'],
  },
  {
    id: 'canna-terra',
    brand: 'Canna',
    line: 'Terra Vega / Terra Flores',
    type: 'Minerale',
    level: 'Intermedio',
    media: ['terra', 'terra-ricca'],
    note: 'Linea minerale molto stabile; con additivi (PK, enzimi) chiede più attenzione a EC e drenaggio.',
    packs: [
      { id: 'essenziale', price: 27, ml: 2000, items: ['Terra Vega 1 L', 'Terra Flores 1 L'] },
      { id: 'parziale', price: 66, ml: 3500, items: ['Terra Vega, Terra Flores 1 L', 'PK 13/14 0,5 L', 'Rhizotonic 1 L'] },
      { id: 'completo', price: 152, ml: 5000, items: ['Terra Vega, Terra Flores 1 L', 'PK 13/14, Rhizotonic, Cannazym, Cannaboost'] },
    ],
    schedule: { grow: [2, 3, 4, 4], bloom: [4, 5, 5, 5, 5, 4, 2, 0] },
    products: ['Terra Vega', 'Terra Flores'],
  },
  {
    id: 'canna-coco',
    brand: 'Canna',
    line: 'Coco A+B',
    type: 'Minerale',
    level: 'Intermedio',
    media: ['cocco'],
    note: 'Lo standard per il cocco: concime a ogni annaffiatura, con pH ed EC da misurare sempre.',
    packs: [
      { id: 'essenziale', price: 22, ml: 2000, items: ['Coco A 1 L', 'Coco B 1 L'] },
      { id: 'parziale', price: 49, ml: 3500, items: ['Coco A+B 1 L', 'Cal-Mag Agent 1 L', 'PK 13/14 0,5 L'] },
      { id: 'completo', price: 138, ml: 5500, items: ['Coco A+B 1 L', 'Cal-Mag, PK 13/14, Rhizotonic, Cannazym, Cannaboost'] },
    ],
    schedule: { grow: [2, 3, 3, 4], bloom: [4, 4, 5, 5, 5, 4, 2, 0] },
    products: ['Coco A + B', 'Coco A + B'],
  },
  {
    id: 'tripart',
    brand: 'Terra Aquatica',
    line: 'TriPart Grow / Micro / Bloom',
    type: 'Minerale',
    level: 'Esperto',
    media: ['terra', 'cocco'],
    note: 'Tre componenti da bilanciare a mano: massimo controllo, ma serve saper leggere EC e drenaggio.',
    packs: [
      { id: 'essenziale', price: 29, ml: 3000, items: ['TriPart Grow, Micro, Bloom 1 L'] },
      { id: 'parziale', price: 58, ml: 4000, items: ['TriPart Grow, Micro, Bloom 1 L', 'Pro Organic 1 L'] },
      { id: 'completo', price: 104, ml: 5500, items: ['TriPart 1 L', 'Pro Organic, Mineral Magic, Ripe 1 L'] },
    ],
    schedule: { grow: [2, 3, 3, 4], bloom: [3, 4, 4, 5, 5, 4, 2, 0] },
    products: ['Grow + Micro', 'Bloom + Micro'],
  },
];

export const nutrientById = (id?: string | null) => NUTRIENT_LINES.find((n) => n.id === id);

/** How much more (or less) feed the substrate needs compared with a light soil mix. */
export const SUBSTRATE_DEMAND: Record<Medium, { factor: number; label: string; note: string }> = {
  'terra-ricca': {
    factor: 0.55,
    label: 'Terra ricca',
    note: 'Già concimata: niente nutrienti per le prime 3–4 settimane, poi dosi ridotte. Spendi meno.',
  },
  terra: {
    factor: 1,
    label: 'Terra leggera',
    note: 'Poco concimata (light mix): nutrienti dalla 2ª settimana a dose piena.',
  },
  cocco: {
    factor: 1.4,
    label: 'Cocco',
    note: 'Inerte: concime a ogni annaffiatura e Cal-Mag sempre. Consumo e costo più alti.',
  },
};

/** Concentrate needed for a whole grow, in ml (≈ 90 L of feed solution per plant over the cycle). */
export function nutrientNeedMl(line: NutrientLine, medium: Medium, plants: number) {
  const weeks = [...line.schedule.grow, ...line.schedule.bloom];
  const avgMlPerL = weeks.reduce((a, b) => a + b, 0) / weeks.length;
  return Math.round(avgMlPerL * 90 * plants * SUBSTRATE_DEMAND[medium].factor);
}

export function nutrientCost(line: NutrientLine, pack: PackId, medium: Medium, plants: number) {
  const p = line.packs.find((x) => x.id === pack)!;
  // The extras in partial/complete packs are used at low doses: base the count on the main bottles only.
  const mainMl = line.packs[0].ml * (pack === 'essenziale' ? 1 : Math.max(1, Math.round(p.ml / line.packs[0].ml / 1.6)));
  const need = nutrientNeedMl(line, medium, plants);
  const count = Math.max(1, Math.ceil(need / mainMl));
  const calmag = medium === 'cocco' && !p.items.some((i) => /cal-?mag/i.test(i)) ? 17 : 0;
  return { packs: count, total: count * p.price + calmag, needMl: need, calmag };
}

/** Plain-text feeding chart for the share sheet. */
export function feedingSheet(line: NutrientLine, opts: { medium: Medium; pack: PackId; plants: number; advanced: boolean }) {
  const { medium, pack, plants, advanced } = opts;
  const f = SUBSTRATE_DEMAND[medium].factor;
  const dose = (v: number) => (v * f).toFixed(1).replace('.', ',');
  const ec = ['0,8', '1,0', '1,2', '1,4', '1,6', '1,8', '1,9', '2,0', '1,8', '1,6', '1,0', '0,4'];
  const lines: string[] = [];
  lines.push(`SCHEDA NUTRIZIONE · GROW LAB`);
  lines.push(`${line.brand} ${line.line} (${line.type}) · pacchetto ${PACK_LABEL[pack]}`);
  lines.push(`Substrato: ${SUBSTRATE_DEMAND[medium].label} · ${plants} piante`);
  lines.push('');
  lines.push(
    line.type === 'Minerale'
      ? 'pH: OBBLIGATORIO a ogni annaffiatura (terra 6,2–6,8 · cocco 5,8–6,2)'
      : 'pH: opzionale, controllalo se vedi carenze (6,2–6,8)',
  );
  lines.push('');
  const weeks = [
    ...line.schedule.grow.map((v, i) => ({ label: `Vegetativa sett. ${i + 1}`, grow: v, bloom: 0, i })),
    ...line.schedule.bloom.map((v, i) => ({ label: `Fioritura sett. ${i + 1}`, grow: i < 2 ? Math.max(0, v - 2) : 0, bloom: v, i: i + 4 })),
  ];
  for (const w of weeks) {
    const parts = [];
    if (w.grow) parts.push(`${line.products[0]} ${dose(w.grow)} ml/L`);
    if (w.bloom) parts.push(`${line.products[1]} ${dose(w.bloom)} ml/L`);
    if (!parts.length) parts.push('solo acqua (lavaggio)');
    if (advanced) parts.push(`EC ${ec[w.i] ?? '—'} mS/cm`);
    lines.push(`${w.label}: ${parts.join(' · ')}`);
  }
  if (medium === 'cocco') lines.push('', 'Cocco: aggiungi Cal-Mag 0,5–1 ml/L a ogni annaffiatura.');
  if (medium === 'terra-ricca')
    lines.push('', 'Terra ricca: inizia i nutrienti solo quando le foglie basse schiariscono (di solito dalla 3ª–4ª settimana).');
  lines.push(
    '',
    'Dosi indicative ricavate dalle tabelle dei produttori, ridotte del 20–30% per sicurezza. Parti basso e osserva le punte delle foglie.',
  );
  return lines.join('\n');
}
