import { nutrientById, nutrientCost, PACK_LABEL, PackId, SUBSTRATE_DEMAND } from './nutrients';
import { picksFor, ShopPick } from './shop';

export type SpaceId = 'tenda60' | 'tenda80' | 'tenda100' | 'tenda120' | 'balcone' | 'giardino';
export type Budget = 'base' | 'medio' | 'pro';
export type GrowKind = 'auto' | 'foto';
export type Medium = 'terra-ricca' | 'terra' | 'cocco';
export type Technique = 'seme' | 'talea' | 'scrog' | 'sog';

export interface KitConfig {
  space: SpaceId;
  budget: Budget;
  plants: number;
  kind: GrowKind;
  medium: Medium;
  /** Lamp wattage picked from the guided presets; unset = not chosen yet (the kit uses the budget default). */
  ledW?: number;
  kwhPrice?: number; // €/kWh
  nutrient?: { line: string; pack: PackId };
  advanced?: boolean; // EC control unlocked
  technique?: Technique;
  cultivarId?: string; // strain used for the final yield estimate
  dehumidifier?: boolean;
  heater?: boolean;
}

export const DEFAULT_KIT: KitConfig = { space: 'tenda80', budget: 'medio', plants: 3, kind: 'foto', medium: 'terra', kwhPrice: 0.3 };

export interface Space {
  id: SpaceId;
  label: string;
  short: string;
  indoor: boolean;
  dims?: [number, number, number]; // cm
  maxPlants: number;
}

export const SPACES: Space[] = [
  { id: 'tenda60', label: 'Tenda 60×60×160', short: '60×60', indoor: true, dims: [60, 60, 160], maxPlants: 2 },
  { id: 'tenda80', label: 'Tenda 80×80×180', short: '80×80', indoor: true, dims: [80, 80, 180], maxPlants: 4 },
  { id: 'tenda100', label: 'Tenda 100×100×200', short: '100×100', indoor: true, dims: [100, 100, 200], maxPlants: 6 },
  { id: 'tenda120', label: 'Tenda 120×120×200', short: '120×120', indoor: true, dims: [120, 120, 200], maxPlants: 9 },
  { id: 'balcone', label: 'Balcone / terrazzo', short: 'Balcone', indoor: false, maxPlants: 6 },
  { id: 'giardino', label: 'Giardino / terra piena', short: 'Giardino', indoor: false, maxPlants: 9 },
];

export type KitCategory =
  | 'Spazio'
  | 'Luce'
  | 'Aria e clima'
  | 'Vasi e substrato'
  | 'Nutrienti'
  | 'Misura e controllo'
  | 'Cura e training'
  | 'Protezione'
  | 'Raccolta e concia';

export const KIT_CATEGORIES: KitCategory[] = [
  'Spazio',
  'Luce',
  'Aria e clima',
  'Vasi e substrato',
  'Nutrienti',
  'Misura e controllo',
  'Cura e training',
  'Protezione',
  'Raccolta e concia',
];

export type Priority = 'Essenziale' | 'Consigliato' | 'Extra';

export interface KitItem {
  id: string;
  name: string;
  category: KitCategory;
  priority: Priority;
  qty: number;
  unit: string;
  spec: string; // computed headline spec
  unitPrice: Record<Budget, number>;
  why: string;
  lookFor: string[];
  avoid: string[];
  when: string; // when it is needed in the cycle
  picks?: ShopPick[]; // real products, best match first
  price?: number; // unit price used for totals: first pick, else the estimate for the budget
}

export interface KitStats {
  area: number; // m²
  volume: number; // m³
  ledW: number;
  ppfd: number;
  fanM3h: number;
  duct: number;
  potL: number;
  substrateL: number;
  monthlyKwh: number;
}

const EFFICACY: Record<Budget, number> = { base: 2.3, medio: 2.6, pro: 2.85 }; // µmol/J
const W_PER_M2: Record<Budget, number> = { base: 280, medio: 330, pro: 380 };

export function kitStats(c: KitConfig): KitStats {
  const space = SPACES.find((s) => s.id === c.space)!;
  const [w, d, h] = space.dims ?? [0, 0, 0];
  const area = (w * d) / 10000;
  const volume = (w * d * h) / 1_000_000;
  const ledRaw = area * W_PER_M2[c.budget];
  const ledW = space.indoor ? (c.ledW ?? Math.max(100, Math.round(ledRaw / 10) * 10)) : 0;
  const ppfd = space.indoor ? Math.round(((ledW * EFFICACY[c.budget]) / area) * 0.85) : 0;
  // One full air exchange per minute + 30% for carbon filter and duct losses.
  const fanM3h = space.indoor ? Math.round(volume * 60 * 1.3) : 0;
  const duct = fanM3h <= 360 ? 125 : 150;
  const potL = space.indoor
    ? c.kind === 'auto'
      ? 11
      : c.medium === 'cocco'
        ? 15
        : 18
    : space.id === 'balcone'
      ? c.kind === 'auto'
        ? 20
        : 40
      : c.kind === 'auto'
        ? 30
        : 60;
  const substrateL = space.id === 'giardino' ? c.plants * 40 : Math.ceil(c.plants * potL * 1.1);
  // Average light hours: veg 18/6 then flower 12/12 (photoperiod), 20/4 constant (auto).
  const hours = c.kind === 'auto' ? 20 : 14.5;
  const fanW = space.indoor ? (c.budget === 'pro' ? 35 : 60) : 0;
  const monthlyKwh = space.indoor ? Math.round(((ledW * hours + fanW * 24 + 15 * 24) * 30) / 1000) : 0;
  return { area, volume, ledW, ppfd, fanM3h, duct, potL, substrateL, monthlyKwh };
}

const P = (base: number, medio: number, pro: number) => ({ base, medio, pro });

export function buildKit(c: KitConfig): KitItem[] {
  const space = SPACES.find((s) => s.id === c.space)!;
  const s = kitStats(c);
  const n = c.plants;
  const items: KitItem[] = [];
  const add = (it: KitItem | false) => it && items.push(it);
  const pro = c.budget === 'pro';
  const base = c.budget === 'base';

  if (space.indoor) {
    const tentPrice: Record<SpaceId, [number, number, number]> = {
      tenda60: [55, 95, 160],
      tenda80: [70, 120, 190],
      tenda100: [90, 150, 240],
      tenda120: [110, 180, 290],
      balcone: [0, 0, 0],
      giardino: [0, 0, 0],
    };
    const [tb, tm, tp] = tentPrice[c.space];
    add({
      id: 'tenda',
      name: 'Grow box (tenda)',
      category: 'Spazio',
      priority: 'Essenziale',
      qty: 1,
      unit: 'pz',
      spec: `${space.label} · interno riflettente Mylar · telaio in metallo`,
      unitPrice: P(tb, tm, tp),
      why: 'Isola luce, odori e clima: è la base di tutto il controllo ambientale.',
      lookFor: [
        'Telaio in acciaio con angolari in metallo',
        'Tessuto 600D o superiore, cuciture a tenuta di luce',
        "Più prese d'aria con manicotti e finestrelle",
        'Vassoio impermeabile sul fondo',
      ],
      avoid: ['Angolari in plastica che cedono col peso della lampada', 'Zip che lasciano filtrare luce (rischio ermafroditismo)'],
      when: 'Prima della semina',
    });
    add({
      id: 'led',
      name: 'Lampada LED full-spectrum',
      category: 'Luce',
      priority: 'Essenziale',
      qty: 1,
      unit: 'pz',
      spec: `${s.ledW} W reali · ≥ ${EFFICACY[c.budget].toFixed(1).replace('.', ',')} µmol/J · ~${s.ppfd} PPFD medio`,
      unitPrice: P(Math.round(s.ledW * 0.55), Math.round(s.ledW * 0.95), Math.round(s.ledW * 1.6)),
      why: `Per ${s.area.toFixed(2).replace('.', ',')} m² servono circa ${s.ledW} W reali per arrivare a 700–900 PPFD in fioritura.`,
      lookFor: [
        'Potenza reale assorbita (non "equivalente")',
        'Efficienza dichiarata in µmol/J e mappa PPFD',
        'Dimmer integrato per piantine e vegetativa',
        'Driver separabile o ben dissipato',
      ],
      avoid: ['LED "1000 W" che assorbono 100 W', 'Pannelli senza mappa PPFD o efficienza dichiarata'],
      when: 'Prima della semina',
    });
    add({
      id: 'estrattore',
      name: c.budget === 'base' ? 'Estrattore centrifugo + regolatore' : 'Estrattore EC silenzioso con controller',
      category: 'Aria e clima',
      priority: 'Essenziale',
      qty: 1,
      unit: 'pz',
      spec: `≥ ${s.fanM3h} m³/h · Ø ${s.duct} mm${pro ? ' · controllo automatico temp/UR' : ''}`,
      unitPrice: P(55, 110, 210),
      why: `Il volume della tenda è ${s.volume.toFixed(2).replace('.', ',')} m³: ricambiarlo ogni minuto, compensando il filtro, richiede almeno ${s.fanM3h} m³/h.`,
      lookFor: ['Portata reale ≥ quella calcolata', 'Regolatore di velocità (meglio motore EC)', 'Rumorosità dichiarata in dB'],
      avoid: ['Estrattori assiali da bagno: non reggono il filtro a carbone'],
      when: 'Prima della semina',
    });
    add({
      id: 'filtro',
      name: 'Filtro a carboni attivi',
      category: 'Aria e clima',
      priority: 'Essenziale',
      qty: 1,
      unit: 'pz',
      spec: `Ø ${s.duct} mm · portata ≥ ${s.fanM3h} m³/h`,
      unitPrice: P(35, 65, 120),
      why: 'Elimina gli odori in uscita, indispensabile dalla fioritura.',
      lookFor: ['Carbone attivo vergine (letto ≥ 38 mm)', "Stessa flangia dell'estrattore", 'Prefiltro lavabile'],
      avoid: ['Filtri sottodimensionati: riducono molto la portata'],
      when: "Entro l'inizio della fioritura",
    });
    add({
      id: 'tubo',
      name: 'Tubo e fascette',
      category: 'Aria e clima',
      priority: 'Essenziale',
      qty: 1,
      unit: 'kit',
      spec: `Ø ${s.duct} mm · 3–5 m${pro ? ' fonoassorbente' : ''}`,
      unitPrice: P(10, 18, 35),
      why: "Collega filtro ed estrattore all'esterno della tenda.",
      lookFor: ['Tubo fonoassorbente se serve silenzio', 'Fascette metalliche'],
      avoid: ['Curve strette: riducono la portata'],
      when: 'Prima della semina',
    });
    add({
      id: 'ventilatore',
      name: 'Ventilatore a clip oscillante',
      category: 'Aria e clima',
      priority: 'Essenziale',
      qty: s.area > 0.8 ? 2 : 1,
      unit: 'pz',
      spec: 'Ø 15–20 cm · oscillante · 2 velocità',
      unitPrice: P(14, 25, 45),
      why: "Muove l'aria tra le foglie: rinforza i fusti e previene muffe e parassiti.",
      lookFor: ['Clip robusta per il palo della tenda', 'Oscillazione e più velocità'],
      avoid: ['Aria diretta e forte sulle cime'],
      when: 'Dalla fase piantina',
    });
    add({
      id: 'timer',
      name: c.budget === 'pro' ? 'Presa smart con timer' : 'Timer digitale',
      category: 'Luce',
      priority: 'Essenziale',
      qty: 1,
      unit: 'pz',
      spec: c.kind === 'foto' ? 'Programmabile 18/6 → 12/12 · batteria tampone' : 'Programmabile 20/4 · batteria tampone',
      unitPrice: P(9, 16, 25),
      why:
        c.kind === 'foto'
          ? 'Le fotoperiodiche fioriscono solo con 12 ore di buio esatte e costanti.'
          : 'Mantiene costanti le ore di luce per tutto il ciclo.',
      lookFor: ['Digitale, non meccanico', 'Memoria in caso di blackout'],
      avoid: ['Timer meccanici con rotella che si sfasano'],
      when: 'Prima della semina',
    });
    add(
      (c.budget !== 'base' || s.area >= 1) && {
        id: 'deumidificatore',
        name: 'Deumidificatore',
        category: 'Aria e clima',
        priority: s.area >= 1 ? 'Consigliato' : 'Extra',
        qty: 1,
        unit: 'pz',
        spec: `${s.area >= 1 ? '12–20' : '10–12'} L/giorno · igrostato integrato`,
        unitPrice: P(130, 190, 290),
        why: "In fioritura l'UR deve stare al 40–50%: il deumidificatore è la difesa principale contro la botrite.",
        lookFor: ['Igrostato regolabile', 'Scarico continuo con tubo', 'Posizionato fuori dalla tenda, nella stanza'],
        avoid: ['Deumidificatori a sali: inutili in una tenda'],
        when: 'Dalla 3ª settimana di fioritura',
      },
    );
  }

  add({
    id: 'vasi',
    name: space.id === 'giardino' ? 'Ammendante per buche' : 'Vasi in tessuto',
    category: 'Vasi e substrato',
    priority: 'Essenziale',
    qty: n,
    unit: space.id === 'giardino' ? 'buche' : 'pz',
    spec: space.id === 'giardino' ? 'Buca 60×60×60 cm per pianta con humus e perlite' : `${s.potL} L · tessuto traspirante con maniglie`,
    unitPrice:
      space.id === 'giardino'
        ? P(6, 10, 16)
        : P(Math.round(2 + s.potL * 0.08), Math.round(3 + s.potL * 0.12), Math.round(5 + s.potL * 0.18)),
    why:
      c.kind === 'auto'
        ? 'Le autofiorenti vanno seminate direttamente nel vaso finale: niente trapianti.'
        : "Il tessuto ossigena le radici e ne evita l'avvolgimento (air pruning).",
    lookFor: ['Tessuto spesso con maniglie', 'Sottovaso rialzato'],
    avoid: ['Vasi troppo piccoli: limitano la pianta e richiedono acqua ogni giorno'],
    when: 'Semina o trapianto',
  });
  add({
    id: 'substrato',
    name:
      c.medium === 'cocco' && space.indoor
        ? 'Fibra di cocco + perlite'
        : space.id === 'giardino'
          ? 'Humus di lombrico'
          : c.medium === 'terra-ricca'
            ? 'Terriccio ricco pre-concimato (all-mix)'
            : 'Terriccio leggermente concimato',
    category: 'Vasi e substrato',
    priority: 'Essenziale',
    qty: Math.ceil(s.substrateL / 50),
    unit: 'sacchi 50 L',
    spec:
      c.medium === 'cocco' && space.indoor
        ? `${s.substrateL} L totali · 70% cocco, 30% perlite`
        : `${s.substrateL} L totali · con 20–30% di perlite`,
    unitPrice: c.medium === 'terra-ricca' ? P(18, 26, 34) : P(12, 18, 26),
    why:
      c.medium === 'terra-ricca'
        ? 'Contiene già concime per 3–4 settimane: meno nutrienti da comprare, ma va bene solo da vegetativa in poi.'
        : c.medium === 'cocco'
          ? 'Il cocco cresce più veloce e perdona i ristagni, ma richiede concime a ogni annaffiatura.'
          : 'Il terriccio fa da "cuscinetto": più tollerante agli errori, ideale per iniziare.',
    lookFor: ['Substrato specifico "light mix" o con perlite', 'Cocco lavato e tamponato (buffered)'],
    avoid: ['Terriccio universale molto concimato per le piantine', 'Cocco non tamponato: blocca calcio e magnesio'],
    when: 'Semina o trapianto',
  });
  add({
    id: 'sottovasi',
    name: 'Sottovasi',
    category: 'Vasi e substrato',
    priority: space.indoor ? 'Essenziale' : 'Consigliato',
    qty: space.id === 'giardino' ? 0 : n,
    unit: 'pz',
    spec: 'Diametro maggiore del vaso · bordo alto',
    unitPrice: P(2, 4, 7),
    why: 'Raccolgono il drenaggio e proteggono la tenda o il pavimento.',
    lookFor: ['Bordo di almeno 4 cm'],
    avoid: ['Lasciare acqua stagnante nel sottovaso: svuotalo dopo 30 minuti'],
    when: 'Semina o trapianto',
  });
  const line = nutrientById(c.nutrient?.line);
  const feed = line && c.nutrient ? nutrientCost(line, c.nutrient.pack, c.medium, n) : null;
  add({
    id: 'nutrienti',
    name: line
      ? `${line.brand} ${line.line}`
      : c.medium === 'cocco' && space.indoor
        ? 'Nutrienti per cocco A+B'
        : space.indoor
          ? 'Linea nutrienti crescita + fioritura'
          : 'Concime organico granulare + liquido fioritura',
    category: 'Nutrienti',
    priority: 'Essenziale',
    qty: feed ? feed.packs : 1,
    unit: feed ? 'pacchetti' : 'set',
    spec:
      line && c.nutrient
        ? `${line.type} · pacchetto ${PACK_LABEL[c.nutrient.pack]} · ${SUBSTRATE_DEMAND[c.medium].label}`
        : base
          ? 'Bottiglie da 1 L'
          : pro
            ? 'Linea completa da 1 L con stimolatori'
            : 'Bottiglie da 1 L',
    unitPrice:
      line && c.nutrient
        ? (() => {
            const v = line.packs.find((x) => x.id === c.nutrient!.pack)!.price;
            return P(v, v, v);
          })()
        : P(
            Math.round(28 * SUBSTRATE_DEMAND[c.medium].factor),
            Math.round(55 * SUBSTRATE_DEMAND[c.medium].factor),
            Math.round(120 * SUBSTRATE_DEMAND[c.medium].factor),
          ),
    why:
      c.medium === 'terra-ricca'
        ? 'Con la terra ricca servono meno nutrienti: si parte dalla 3ª–4ª settimana.'
        : c.medium === 'cocco'
          ? 'Il cocco è inerte: tutto il nutrimento arriva dal concime, a ogni annaffiatura.'
          : 'Forniscono azoto in vegetativa e fosforo/potassio in fioritura, nelle giuste proporzioni.',
    lookFor: ['Tabella di dosaggio chiara per settimana', 'Microelementi chelati inclusi'],
    avoid: ["Mischiare marchi diversi senza conoscere l'EC risultante"],
    when: c.medium === 'terra-ricca' ? 'Dalla 3ª–4ª settimana' : 'Dalla 2ª settimana di vegetativa',
  });
  add(
    (c.medium === 'cocco' || space.indoor) && {
      id: 'calmag',
      name: 'Cal-Mag',
      category: 'Nutrienti',
      priority: c.medium === 'cocco' ? 'Essenziale' : 'Consigliato',
      qty: 1,
      unit: 'pz',
      spec: '1 L · calcio + magnesio',
      unitPrice: P(12, 17, 25),
      why: 'Con LED e cocco la richiesta di calcio e magnesio aumenta: previene le carenze più comuni.',
      lookFor: ['Con azoto nitrico contenuto', 'Dose 0,5–1 ml/L'],
      avoid: ['Usarlo a dose piena con acqua di rubinetto molto dura'],
      when: 'Da subito con cocco, al bisogno in terra',
    },
  );
  add(
    !base && {
      id: 'pk',
      name: 'Booster PK fioritura',
      category: 'Nutrienti',
      priority: 'Extra',
      qty: 1,
      unit: 'pz',
      spec: 'PK 13/14 · 250–500 ml',
      unitPrice: P(10, 15, 22),
      why: 'Spinge la formazione delle cime a metà fioritura.',
      lookFor: ['Usalo solo 1–2 settimane a metà fioritura'],
      avoid: ['Sovradosaggio: bruciature delle punte'],
      when: 'Settimane 4–6 di fioritura',
    },
  );
  add({
    id: 'phmetro',
    name: 'pHmetro digitale',
    category: 'Misura e controllo',
    // Mineral feeds lock out quickly off-range; organic ones are buffered by the soil life.
    priority: line?.type === 'Organico' && c.medium !== 'cocco' ? 'Consigliato' : 'Essenziale',
    qty: 1,
    unit: 'pz',
    spec: 'Precisione ±0,1 · compensazione temperatura · con soluzioni di taratura',
    unitPrice: P(22, 45, 90),
    why: 'Il pH sbagliato blocca i nutrienti anche se concimi correttamente: è lo strumento più importante.',
    lookFor: ['Elettrodo sostituibile', 'Soluzioni di taratura pH 4 e 7', 'ATC (compensazione automatica)'],
    avoid: ['Cartine tornasole: troppo imprecise', "Conservare l'elettrodo asciutto"],
    when: 'Prima della semina',
  });
  add({
    id: 'phdown',
    name: 'Regolatore pH- (pH down)',
    category: 'Misura e controllo',
    priority: line?.type === 'Organico' && c.medium !== 'cocco' ? 'Consigliato' : 'Essenziale',
    qty: 1,
    unit: 'pz',
    spec: '250–500 ml · acido fosforico',
    unitPrice: P(7, 9, 12),
    why: "L'acqua di rubinetto italiana è spesso a pH 7,5–8: va abbassata a ogni annaffiatura.",
    lookFor: ['Versione "fioritura" e "crescita" se usi una linea completa'],
    avoid: ['Aceto o limone: instabili e imprecisi'],
    when: 'Prima della semina',
  });
  add(
    (c.medium === 'cocco' || !base || !!c.advanced) && {
      id: 'ecmetro',
      name: 'Conduttivimetro (EC)',
      category: 'Misura e controllo',
      priority: c.medium === 'cocco' || c.advanced ? 'Essenziale' : 'Consigliato',
      qty: 1,
      unit: 'pz',
      spec: 'Lettura in mS/cm · ATC · soluzione 1,413',
      unitPrice: P(15, 35, 80),
      why: 'Misura quanto concime dai e quanto si accumula nel substrato: evita bruciature e carenze.',
      lookFor: ['Misura in mS/cm (non solo ppm)', 'Combo pH/EC per risparmiare'],
      avoid: ["Misurare solo l'acqua in entrata: controlla anche il drenaggio"],
      when: 'Prima della semina',
    },
  );
  add({
    id: 'termoigrometro',
    name: pro ? 'Sensore Wi-Fi temperatura/UR' : 'Termoigrometro min/max',
    category: 'Misura e controllo',
    priority: 'Essenziale',
    qty: space.indoor ? 1 : 1,
    unit: 'pz',
    spec: pro ? "Storico e notifiche sul telefono · sonda all'altezza delle cime" : 'Memoria minimo/massimo · sonda esterna',
    unitPrice: P(9, 18, 45),
    why: "Temperatura e umidità determinano VPD, muffe e stress: vanno lette all'altezza delle cime.",
    lookFor: ['Memoria min/max', 'Sonda posizionabile vicino alle cime'],
    avoid: ['Misurare vicino alla lampada o al pavimento'],
    when: 'Prima della semina',
  });
  add({
    id: 'lente',
    name: 'Lente o microscopio tascabile 60×',
    category: 'Misura e controllo',
    priority: 'Essenziale',
    qty: 1,
    unit: 'pz',
    spec: '60–100× con luce LED',
    unitPrice: P(7, 14, 35),
    why: 'Serve per decidere il momento della raccolta guardando i tricomi, e per individuare acari e uova.',
    lookFor: ['Luce LED integrata', 'Clip per fotocamera del telefono (opzionale)'],
    avoid: ['Giudicare la maturazione solo dai pistilli'],
    when: 'Dalla 5ª settimana di fioritura',
  });
  add({
    id: 'forbici',
    name: 'Forbici da potatura di precisione',
    category: 'Cura e training',
    priority: 'Essenziale',
    qty: 1,
    unit: 'pz',
    spec: 'Lame dritte in acciaio inox · punta sottile',
    unitPrice: P(8, 14, 28),
    why: 'Per topping, defogliazione e manicure in raccolta.',
    lookFor: ['Lame sottili e affilate', 'Alcol isopropilico per pulirle'],
    avoid: ['Forbici da cucina: schiacciano i tessuti'],
    when: 'Dalla vegetativa',
  });
  add({
    id: 'lst',
    name:
      c.kind === 'foto' && space.indoor && !base ? 'Rete SCROG + fil di ferro plastificato' : 'Kit LST: fil di ferro plastificato e tutori',
    category: 'Cura e training',
    priority: 'Consigliato',
    qty: 1,
    unit: 'kit',
    spec:
      c.kind === 'foto' && space.indoor && !base
        ? `Rete elastica per ${SPACES.find((x) => x.id === c.space)?.short} · maglia 5–10 cm`
        : 'Filo morbido + bacchette di bambù',
    unitPrice: P(6, 12, 22),
    why: 'Il training rende la chioma piatta: più cime ricevono luce e la resa sale del 20–40%.',
    lookFor: ['Filo con guaina morbida'],
    avoid: ['Fascette di plastica strette: strozzano i rami'],
    when: 'Dalla 3ª settimana di vegetativa',
  });
  add({
    id: 'annaffiatoio',
    name: 'Tanica e annaffiatoio dosatore',
    category: 'Cura e training',
    priority: 'Essenziale',
    qty: 1,
    unit: 'kit',
    spec: space.indoor ? 'Tanica 20–25 L · siringhe dosatrici da 5–10 ml' : 'Annaffiatoio 10 L o irrigazione a goccia',
    unitPrice: P(10, 18, 45),
    why: 'Preparare la soluzione in una tanica permette di misurare pH ed EC con precisione.',
    lookFor: ['Siringhe graduate dedicate per ogni prodotto'],
    avoid: ['Dosare "a occhio" con il tappo'],
    when: 'Prima della semina',
  });
  add({
    id: 'germinazione',
    name: 'Kit germinazione',
    category: 'Cura e training',
    priority: 'Consigliato',
    qty: 1,
    unit: 'kit',
    spec: 'Cubetti torba/jiffy + mini serra con coperchio',
    unitPrice: P(8, 14, 30),
    why: 'Umidità alta e costante nei primi giorni aumenta il tasso di germinazione.',
    lookFor: ["Coperchio con prese d'aria regolabili"],
    avoid: ['Cubetti in lana di roccia senza pH corretto'],
    when: 'Prima della semina',
  });
  add({
    id: 'trappole',
    name: 'Trappole adesive gialle e blu',
    category: 'Protezione',
    priority: space.indoor ? 'Consigliato' : 'Essenziale',
    qty: 1,
    unit: 'conf.',
    spec: '10–20 pz misti',
    unitPrice: P(5, 8, 12),
    why: "Segnalano presto moscerini, tripidi e mosca bianca prima che diventino un'infestazione.",
    lookFor: ['Gialle per moscerini e mosca bianca, blu per i tripidi'],
    avoid: ['Lasciarle sulle cime in fioritura (resina appiccicosa)'],
    when: 'Dalla fase piantina',
  });
  add({
    id: 'neem',
    name: 'Sapone potassico / olio di neem',
    category: 'Protezione',
    priority: 'Consigliato',
    qty: 1,
    unit: 'pz',
    spec: '250–500 ml concentrato',
    unitPrice: P(8, 12, 18),
    why: 'Trattamento preventivo e curativo leggero contro afidi, acari e mosca bianca in vegetativa.',
    lookFor: ['Uso solo in vegetativa, a luci spente'],
    avoid: ['Spruzzarlo sulle cime in fioritura'],
    when: 'Vegetativa',
  });
  add(
    !space.indoor && {
      id: 'btk',
      name: 'Bacillus thuringiensis kurstaki (Btk)',
      category: 'Protezione',
      priority: 'Essenziale',
      qty: 1,
      unit: 'pz',
      spec: 'Polvere bagnabile · trattamenti ogni 7–10 giorni',
      unitPrice: P(10, 14, 20),
      why: 'Outdoor i bruchi dentro le cime sono la prima causa di perdita del raccolto in Italia.',
      lookFor: ['Varietà kurstaki, specifica per lepidotteri'],
      avoid: ['Iniziare dopo che i bruchi sono già nelle cime'],
      when: 'Da fine luglio a metà fioritura',
    },
  );
  add(
    !space.indoor && {
      id: 'tutori',
      name: 'Tutori e legacci',
      category: 'Protezione',
      priority: 'Essenziale',
      qty: n,
      unit: 'pz',
      spec: space.id === 'giardino' ? 'Pali 180–200 cm · legacci morbidi' : 'Bambù 120–150 cm · legacci morbidi',
      unitPrice: P(2, 4, 7),
      why: 'Vento e peso delle cime possono spezzare i rami nelle ultime settimane.',
      lookFor: ['Legacci in gomma o tessuto'],
      avoid: ['Fil di ferro nudo sui rami'],
      when: 'Prima della fioritura',
    },
  );
  add(
    !space.indoor && {
      id: 'rete',
      name: 'Rete antiuccelli / antigrandine',
      category: 'Protezione',
      priority: 'Consigliato',
      qty: 1,
      unit: 'pz',
      spec: 'Maglia fine · 4×5 m',
      unitPrice: P(10, 16, 30),
      why: 'Protegge le piantine dagli uccelli e le piante adulte da grandine e insetti grandi.',
      lookFor: ['Maglia ≤ 2 cm'],
      avoid: ['Reti che toccano le cime bagnate'],
      when: 'Primavera e fine estate',
    },
  );
  add({
    id: 'essiccatoio',
    name: 'Essiccatoio a rete',
    category: 'Raccolta e concia',
    priority: 'Consigliato',
    qty: 1,
    unit: 'pz',
    spec: `${n > 4 ? 6 : 4} ripiani · Ø 60 cm`,
    unitPrice: P(12, 18, 30),
    why: 'Fa asciugare le cime in modo uniforme senza schiacciarle.',
    lookFor: ['Rete fine con cerniera'],
    avoid: ['Essiccare in luoghi caldi o con aria diretta'],
    when: 'Raccolta',
  });
  add({
    id: 'barattoli',
    name: 'Barattoli di vetro ermetici',
    category: 'Raccolta e concia',
    priority: 'Essenziale',
    qty: Math.max(4, n * 2),
    unit: 'pz',
    spec: '1 L · chiusura ermetica con guarnizione',
    unitPrice: P(3, 4, 7),
    why: 'La concia in vetro, con aperture regolari, fa maturare aroma e gusto.',
    lookFor: ['Vetro spesso e guarnizione in gomma'],
    avoid: ['Contenitori di plastica: alterano gli aromi'],
    when: 'Fine essiccazione',
  });
  add({
    id: 'igrometri',
    name: pro ? 'Mini igrometri digitali per barattoli' : 'Bustine umidità 62%',
    category: 'Raccolta e concia',
    priority: 'Consigliato',
    qty: pro ? Math.max(4, n * 2) : Math.max(4, n * 2),
    unit: 'pz',
    spec: pro ? 'Display digitale · misura 20–95% UR' : 'Bidirezionali 62% · 8 g',
    unitPrice: P(1.5, 2.5, 6),
    why: "Tengono l'umidità dei barattoli tra 58% e 65%: niente muffa e niente cime secche.",
    lookFor: ['Taratura verificabile con il test del sale'],
    avoid: ['Chiudere cime ancora umide anche con le bustine'],
    when: 'Fine essiccazione',
  });
  return items
    .filter((i) => i.qty > 0)
    .map((i) => {
      const picks = picksFor(i.id, c.budget, s, space.short);
      return { ...i, picks, price: picks[0]?.price ?? i.unitPrice[c.budget] };
    });
}

export const itemTotal = (i: KitItem) => i.qty * (i.price ?? i.unitPrice.medio);
