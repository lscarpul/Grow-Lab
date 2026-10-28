export const MONTHS_LONG = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

/** Approximate day length (hours) at mid-month for central Italy (~42° N). */
export const DAYLIGHT = [9.4, 10.6, 11.9, 13.3, 14.5, 15.2, 14.9, 13.8, 12.4, 11.0, 9.8, 9.1];

/** Mean daily temperature (°C) for a typical lowland Italian location, for the climate band. */
export const TEMP_MEAN = [6, 7, 10, 13, 18, 22, 25, 25, 21, 16, 11, 7];

export interface GanttRow {
  label: string;
  sub: string;
  bars: { from: number; to: number; stage: 'germinazione' | 'vegetativa' | 'fioritura' | 'raccolta' | 'essiccazione' }[]; // month index, fractional
}

export const GANTT: GanttRow[] = [
  {
    label: 'Fotoperiodiche',
    sub: "un ciclo l'anno",
    bars: [
      { from: 3.3, to: 4.0, stage: 'germinazione' },
      { from: 4.0, to: 7.3, stage: 'vegetativa' },
      { from: 7.3, to: 9.4, stage: 'fioritura' },
      { from: 9.4, to: 10.0, stage: 'raccolta' },
    ],
  },
  {
    label: 'Autofiorenti 1',
    sub: 'semina primaverile',
    bars: [
      { from: 3.6, to: 4.0, stage: 'germinazione' },
      { from: 4.0, to: 4.9, stage: 'vegetativa' },
      { from: 4.9, to: 6.1, stage: 'fioritura' },
      { from: 6.1, to: 6.4, stage: 'raccolta' },
    ],
  },
  {
    label: 'Autofiorenti 2',
    sub: 'semina estiva',
    bars: [
      { from: 5.6, to: 6.0, stage: 'germinazione' },
      { from: 6.0, to: 6.9, stage: 'vegetativa' },
      { from: 6.9, to: 8.1, stage: 'fioritura' },
      { from: 8.1, to: 8.4, stage: 'raccolta' },
    ],
  },
];

export interface MonthPlan {
  month: number;
  focus: string;
  tasks: string[];
  shopping?: string[];
  risk?: string;
}

export const MONTH_PLANS: MonthPlan[] = [
  {
    month: 0,
    focus: 'Pianificazione',
    tasks: ['Scegli le genetiche in base al clima della tua zona.', 'Prepara il terreno: vanga e aggiungi letame maturo o humus.'],
    shopping: ['Semi', 'Ammendanti'],
  },
  {
    month: 1,
    focus: 'Preparazione',
    tasks: ['Ordina i semi in anticipo: le varietà outdoor precoci finiscono presto.', 'Pulisci e disinfetta vasi e attrezzi.'],
    shopping: ['Vasi', 'Substrato'],
  },
  {
    month: 2,
    focus: 'Indoor per partire prima',
    tasks: [
      'Indoor puoi germinare a fine mese sotto una piccola lampada.',
      'Controlla le previsioni: niente piantine fuori sotto i 10 °C notturni.',
    ],
  },
  {
    month: 3,
    focus: 'Semina',
    tasks: [
      'Germina le fotoperiodiche da metà aprile.',
      'Prima semina di autofiorenti a fine mese.',
      'Abitua le piantine al sole per 5–7 giorni.',
    ],
    shopping: ['Kit germinazione', 'Trappole adesive'],
    risk: 'Gelate tardive al nord e in collina.',
  },
  {
    month: 4,
    focus: 'Trapianto e crescita',
    tasks: [
      'Trapianta nel vaso definitivo o in piena terra.',
      'Proteggi da lumache e uccelli.',
      'Inizia il concime da crescita a metà dose.',
    ],
    risk: 'Lumache e afidi sui germogli.',
  },
  {
    month: 5,
    focus: 'Crescita intensa',
    tasks: ['Topping e LST sulle fotoperiodiche.', 'Raccolta delle prime autofiorenti a fine mese.', 'Seconda semina di autofiorenti.'],
    risk: 'Prime ondate di caldo: annaffia al mattino.',
  },
  {
    month: 6,
    focus: 'Massimo vigore',
    tasks: [
      'Annaffiature quotidiane nei vasi, al mattino presto.',
      'Ultimo topping entro metà mese.',
      'Inizia i trattamenti preventivi con Btk a fine mese.',
    ],
    shopping: ['Btk', 'Tutori'],
    risk: 'Stress da calore oltre 32 °C, ragnetto rosso.',
  },
  {
    month: 7,
    focus: 'Inizio fioritura',
    tasks: ['Passa al concime da fioritura quando compaiono i pistilli.', 'Lega i rami principali ai tutori.', 'Btk ogni 7–10 giorni.'],
    risk: 'Bruchi nelle cime, temporali estivi.',
  },
  {
    month: 8,
    focus: 'Fioritura piena',
    tasks: ['Controlla le cime dopo ogni pioggia.', 'Raccogli le varietà precoci a fine mese.', 'Interrompi i trattamenti sulle cime.'],
    shopping: ['Lente 60×', 'Essiccatoio'],
    risk: 'Botrite con piogge e rugiade abbondanti.',
  },
  {
    month: 9,
    focus: 'Raccolta',
    tasks: ['Raccogli in giornate asciutte, mai dopo la pioggia.', 'Essicca in un locale buio a 16–20 °C e 55–62% di UR.'],
    shopping: ['Barattoli', 'Igrometri'],
    risk: 'Muffa grigia e freddo notturno.',
  },
  {
    month: 10,
    focus: 'Concia',
    tasks: [
      'Concia nei barattoli con burping regolare.',
      'Raccogli le ultime sativa al sud.',
      "Annota cosa ha funzionato per l'anno prossimo.",
    ],
  },
  { month: 11, focus: 'Riposo', tasks: ["Pulisci e ripara l'attrezzatura.", 'Valuta una coltivazione indoor invernale.'] },
];
