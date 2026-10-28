import { addDays, clamp, round, seeded, startOfDay, vpd } from '../lib/math';
import { STAGE_RANGES } from './ranges';
import { Environment, StageId } from './types';

export type LogKind = 'acqua' | 'nutrienti' | 'training' | 'osservazione' | 'trapianto' | 'raccolta' | 'trattamento';

export interface LogEntry {
  id: string;
  date: Date;
  kind: LogKind;
  title: string;
  detail: string;
  metrics?: { label: string; value: string }[];
}

export interface DayReading {
  date: Date;
  stage: StageId;
  temp: number;
  rh: number;
  vpd: number;
  ph: number | null;
  ec: number | null;
  ppfd: number | null;
  height: number;
  water: number | null; // litres given
}

export interface Plant {
  id: string;
  nickname: string;
  cultivarId: string;
  env: Environment;
  medium: 'Cocco' | 'Terra' | 'Idroponica' | 'Terra piena';
  potL: number | null;
  space: string;
  light: string;
  photoperiod: string;
  sowDate: Date;
  timeline: { stage: StageId; start: Date }[];
  stage: StageId;
  stageStart: Date;
  expectedHarvest: Date | null;
  health: number;
  healthTrend: number;
  readings: DayReading[];
  logs: LogEntry[];
  finalYield?: number; // grams dry
}

interface Spec {
  id: string;
  nickname: string;
  cultivarId: string;
  env: Environment;
  medium: Plant['medium'];
  potL: number | null;
  space: string;
  light: string;
  photoperiod: string;
  /** Days ago each stage started, oldest first. */
  stages: [StageId, number][];
  finalHeight: number;
  expectedHarvestInDays: number | null;
  health: number;
  healthTrend: number;
  seed: number;
  /** Optional deviations injected into the last N days to make alerts realistic. */
  events?: { metric: 'temp' | 'rh' | 'ph' | 'ec'; daysAgo: number[]; delta: number }[];
  logs: [number, LogKind, string, string, { label: string; value: string }[]?][];
  finalYield?: number;
}

const SPECS: Spec[] = [
  {
    id: 'p-gg4',
    nickname: 'Glue Queen',
    cultivarId: 'gorilla-glue-4',
    env: 'indoor',
    medium: 'Cocco',
    potL: 18,
    space: 'Tenda A · 100×100×200',
    light: 'LED full-spectrum 320 W',
    photoperiod: '12/12',
    stages: [
      ['germinazione', 74],
      ['piantina', 71],
      ['vegetativa', 55],
      ['fioritura', 33],
    ],
    finalHeight: 128,
    expectedHarvestInDays: 27,
    health: 87,
    healthTrend: -3.2,
    seed: 41,
    events: [{ metric: 'rh', daysAgo: [0, 1, 2], delta: 9 }],
    logs: [
      [
        0,
        'osservazione',
        'Umidità alta durante la notte',
        'Igrometro a 59% alle 03:00. Deumidificatore impostato a 45%, estrattore +15%.',
        [
          { label: 'UR notte', value: '59%' },
          { label: 'UR giorno', value: '52%' },
        ],
      ],
      [
        1,
        'nutrienti',
        'Fertirrigazione settimana 5 fioritura',
        'Base A+B 2,4 ml/L, PK 13/14 0,8 ml/L, Cal-Mag 0,5 ml/L.',
        [
          { label: 'EC in', value: '1,9' },
          { label: 'EC drenaggio', value: '2,2' },
          { label: 'pH', value: '5,9' },
          { label: 'Volume', value: '2,6 L' },
        ],
      ],
      [
        3,
        'training',
        'Tutori sui rami principali',
        'Le cime superiori iniziano a piegarsi: 4 bacchette in bambù + rete abbassata di 5 cm.',
      ],
      [
        5,
        'acqua',
        'Annaffiatura',
        'Solo acqua con Cal-Mag, 20% drenaggio.',
        [
          { label: 'pH', value: '5,8' },
          { label: 'Volume', value: '2,4 L' },
        ],
      ],
      [12, 'training', 'Defogliazione giorno 21', 'Rimosse ~25 foglie a ventaglio interne e i rametti sotto il 3° nodo.'],
      [
        22,
        'osservazione',
        'Fine stretch',
        'Altezza passata da 61 a 104 cm in 3 settimane (×1,7).',
        [{ label: 'Altezza', value: '104 cm' }],
      ],
      [33, 'osservazione', 'Passaggio a 12/12', "Chioma piatta su rete SCROG riempita all'80%."],
      [45, 'training', 'Topping al 5° nodo', 'Due cime principali + LST sui rami laterali.'],
    ],
  },
  {
    id: 'p-nla',
    nickname: 'Aurora',
    cultivarId: 'nl-auto',
    env: 'indoor',
    medium: 'Terra',
    potL: 15,
    space: 'Tenda B · 80×80×180',
    light: 'LED quantum board 200 W',
    photoperiod: '20/4',
    stages: [
      ['germinazione', 38],
      ['piantina', 35],
      ['vegetativa', 22],
      ['fioritura', 6],
    ],
    finalHeight: 72,
    expectedHarvestInDays: 34,
    health: 95,
    healthTrend: 2.1,
    seed: 7,
    logs: [
      [
        0,
        'acqua',
        'Annaffiatura',
        'Acqua a pH 6,5, terreno leggermente concimato.',
        [
          { label: 'pH', value: '6,5' },
          { label: 'Volume', value: '1,4 L' },
        ],
      ],
      [2, 'osservazione', 'Pistilli abbondanti', 'Prime cime visibili su tutti i rami principali.'],
      [6, 'osservazione', 'Primi pistilli bianchi', 'Inizio fioritura automatica al giorno 32 dalla semina.'],
      [10, 'training', 'LST', 'Piegata la cima principale a 45°, 4 rami laterali aperti a raggiera.'],
      [18, 'nutrienti', 'Primo concime crescita', 'Mezza dose: 1 ml/L.', [{ label: 'EC', value: '1,0' }]],
    ],
  },
  {
    id: 'p-gel',
    nickname: 'Viola',
    cultivarId: 'gelato',
    env: 'indoor',
    medium: 'Cocco',
    potL: 18,
    space: 'Tenda B · 80×80×180',
    light: 'LED quantum board 200 W',
    photoperiod: '18/6',
    stages: [
      ['germinazione', 40],
      ['piantina', 37],
      ['vegetativa', 21],
    ],
    finalHeight: 46,
    expectedHarvestInDays: 77,
    health: 91,
    healthTrend: 4.6,
    seed: 23,
    events: [{ metric: 'ph', daysAgo: [0], delta: 0.45 }],
    logs: [
      [
        0,
        'nutrienti',
        'Fertirrigazione crescita',
        'Base A+B 1,6 ml/L + radicante. pH misurato alto: da correggere.',
        [
          { label: 'EC', value: '1,3' },
          { label: 'pH', value: '6,6' },
        ],
      ],
      [4, 'training', 'Topping al 4° nodo', 'Taglio netto con forbici sterilizzate.'],
      [9, 'trapianto', 'Trapianto in vaso da 18 L', 'Da vaso 3 L a 18 L di cocco + 30% perlite.'],
    ],
  },
  {
    id: 'p-cbd',
    nickname: 'Salvia',
    cultivarId: 'cbd-auto',
    env: 'indoor',
    medium: 'Terra',
    potL: 11,
    space: 'Tenda B · 80×80×180',
    light: 'LED quantum board 200 W',
    photoperiod: '20/4',
    stages: [
      ['germinazione', 12],
      ['piantina', 9],
    ],
    finalHeight: 9,
    expectedHarvestInDays: 56,
    health: 98,
    healthTrend: 0.8,
    seed: 3,
    logs: [
      [1, 'osservazione', 'Terzo nodo in formazione', 'Crescita compatta, colore verde brillante.'],
      [9, 'osservazione', 'Emersione', 'Cotiledoni aperti dopo 72 ore.'],
      [12, 'osservazione', 'Germinazione in carta', 'Fittone di 8 mm dopo 30 ore a 24 °C.'],
    ],
  },
  {
    id: 'p-bd',
    nickname: 'Gigante del balcone',
    cultivarId: 'blue-dream',
    env: 'outdoor',
    medium: 'Terra',
    potL: 60,
    space: 'Terrazzo esposto a sud',
    light: 'Sole (~6 h dirette)',
    photoperiod: 'Naturale',
    stages: [
      ['germinazione', 186],
      ['piantina', 182],
      ['vegetativa', 165],
      ['fioritura', 85],
      ['raccolta', 7],
      ['essiccazione', 6],
    ],
    finalHeight: 214,
    expectedHarvestInDays: null,
    health: 90,
    healthTrend: 0,
    seed: 11,
    finalYield: 412,
    logs: [
      [
        0,
        'osservazione',
        'Controllo essiccazione',
        'Rametti piccoli si piegano ancora: servono 3–4 giorni.',
        [
          { label: 'Temp', value: '17,8 °C' },
          { label: 'UR', value: '60%' },
        ],
      ],
      [
        7,
        'raccolta',
        'Raccolta completata',
        'Tricomi 75% lattiginosi, 15% ambrati. Peso umido 1,62 kg.',
        [
          { label: 'Umido', value: '1620 g' },
          { label: 'Stima secco', value: '≈ 410 g' },
        ],
      ],
      [20, 'trattamento', 'Bacillus thuringiensis (Btk)', 'Ultimo trattamento preventivo contro i bruchi.'],
      [42, 'osservazione', 'Ondata di caldo', 'Massime di 34 °C per 4 giorni: annaffiature doppie al mattino.'],
    ],
  },
  {
    id: 'p-crit',
    nickname: "Critical d'estate",
    cultivarId: 'critical',
    env: 'indoor',
    medium: 'Terra',
    potL: 20,
    space: 'Tenda A · 100×100×200',
    light: 'LED full-spectrum 320 W',
    photoperiod: '—',
    stages: [
      ['germinazione', 130],
      ['piantina', 126],
      ['vegetativa', 108],
      ['fioritura', 80],
      ['raccolta', 30],
      ['essiccazione', 29],
      ['concia', 18],
    ],
    finalHeight: 98,
    expectedHarvestInDays: null,
    health: 96,
    healthTrend: 1.2,
    seed: 19,
    finalYield: 168,
    logs: [
      [
        0,
        'osservazione',
        'Burping',
        'Igrometri dei barattoli tra 61% e 62%. Aroma dolce e pieno.',
        [{ label: 'UR barattoli', value: '61–62%' }],
      ],
      [7, 'osservazione', 'Burping ridotto', 'Apertura ogni 3 giorni.'],
      [
        18,
        'raccolta',
        'Peso finale secco',
        '168 g da una pianta, 5 barattoli da 1 L.',
        [
          { label: 'Secco', value: '168 g' },
          { label: 'Resa', value: '168 g/m²' },
        ],
      ],
    ],
  },
];

const mid = (r?: [number, number]) => (r ? (r[0] + r[1]) / 2 : 0);

function stageAt(stages: [StageId, number][], daysAgo: number): StageId {
  let current = stages[0][0];
  for (const [s, start] of stages) if (daysAgo <= start) current = s;
  return current;
}

function build(spec: Spec, now: Date): Plant {
  const today = startOfDay(now);
  const rnd = seeded(spec.seed);
  const sowAgo = spec.stages[0][1];
  const span = Math.min(sowAgo, 34);
  const readings: DayReading[] = [];

  for (let ago = span; ago >= 0; ago--) {
    const stage = stageAt(spec.stages, ago);
    const r = STAGE_RANGES[stage];
    const noise = () => rnd() * 2 - 1;
    let temp = mid(r.temp) + noise() * 1.6 + (spec.env === 'outdoor' && stage !== 'essiccazione' ? noise() * 4 : 0);
    let rh = mid(r.rh) + noise() * 5;
    const isLiving = !['raccolta', 'essiccazione', 'concia'].includes(stage);
    let ph = isLiving && r.ph ? (spec.medium === 'Terra' ? 6.4 : 5.9) + noise() * 0.15 : null;
    let ec = isLiving && r.ec ? mid(r.ec) + noise() * 0.15 : null;
    const ppfd =
      isLiving && r.ppfd && spec.env === 'indoor'
        ? mid(r.ppfd) + noise() * 40
        : isLiving && spec.env === 'outdoor'
          ? 900 + noise() * 250
          : null;

    for (const ev of spec.events ?? []) {
      if (!ev.daysAgo.includes(ago)) continue;
      if (ev.metric === 'temp') temp += ev.delta;
      if (ev.metric === 'rh') rh += ev.delta;
      if (ev.metric === 'ph' && ph !== null) ph += ev.delta;
      if (ev.metric === 'ec' && ec !== null) ec += ev.delta;
    }

    // Logistic growth that plateaus at the end of the flowering stretch (~3 weeks into flower).
    const age = sowAgo - ago;
    const flowerAgo = spec.stages.find(([s]) => s === 'fioritura')?.[1];
    const stretchEndAge = flowerAgo !== undefined ? sowAgo - flowerAgo + 21 : sowAgo + 40;
    const midAge = stretchEndAge * 0.62;
    const k = 6 / Math.max(8, stretchEndAge * 0.5);
    const logistic = (x: number) => 1 / (1 + Math.exp(-k * (x - midAge)));
    const reference = logistic(Math.min(sowAgo, stretchEndAge));
    const height = Math.min(spec.finalHeight, (spec.finalHeight * logistic(age)) / reference);

    temp = clamp(temp, 8, 38);
    rh = clamp(rh, 20, 95);
    const date = addDays(today, -ago);
    readings.push({
      date,
      stage,
      temp: round(temp, 1),
      rh: round(rh, 0),
      vpd: round(vpd(temp, rh, isLiving ? -2 : 0), 2),
      ph: ph === null ? null : round(ph, 2),
      ec: ec === null ? null : round(ec, 2),
      ppfd: ppfd === null ? null : Math.round(ppfd),
      height: round(isLiving ? height : spec.finalHeight, 0),
      water: isLiving && ago % (spec.potL && spec.potL > 15 ? 2 : 3) === 0 ? round((spec.potL ?? 20) * (0.1 + rnd() * 0.06), 1) : null,
    });
  }

  const timeline = spec.stages.map(([stage, ago]) => ({ stage, start: addDays(today, -ago) }));
  const last = timeline[timeline.length - 1];

  return {
    id: spec.id,
    nickname: spec.nickname,
    cultivarId: spec.cultivarId,
    env: spec.env,
    medium: spec.medium,
    potL: spec.potL,
    space: spec.space,
    light: spec.light,
    photoperiod: spec.photoperiod,
    sowDate: addDays(today, -sowAgo),
    timeline,
    stage: last.stage,
    stageStart: last.start,
    expectedHarvest: spec.expectedHarvestInDays === null ? null : addDays(today, spec.expectedHarvestInDays),
    health: spec.health,
    healthTrend: spec.healthTrend,
    readings,
    finalYield: spec.finalYield,
    logs: spec.logs.map(([ago, kind, title, detail, metrics], i) => ({
      id: `${spec.id}-log-${i}`,
      date: new Date(addDays(today, -ago).getTime() + (9 + ((i * 7) % 11)) * 3_600_000 + ((i * 17) % 60) * 60_000),
      kind,
      title,
      detail,
      metrics,
    })),
  };
}

export function buildPlants(now = new Date()): Plant[] {
  return SPECS.map((s) => build(s, now));
}
