import { StrainType } from './types';

export const STRAINS: StrainType[] = [
  {
    id: 'indica',
    name: 'Indica',
    emoji: '🌿',
    summary: 'Piante basse e compatte, foglie larghe, fioritura breve e cime dense. Ideali per spazi ridotti e climi freschi.',
    difficulty: 'Facile',
    floweringWeeks: [7, 9],
    traits: [
      { label: 'Altezza tipica', value: '60–120 cm indoor, 1–2 m outdoor' },
      { label: 'Fioritura', value: '7–9 settimane' },
      { label: 'Allungamento in fioritura', value: 'Basso (×1,5)' },
      { label: 'Foglie', value: 'Larghe, verde scuro' },
      { label: 'Cime', value: 'Compatte e resinose' },
    ],
    indoor: {
      params: [
        { label: 'Fotoperiodo', value: '18/6 in vegetativa, 12/12 in fioritura' },
        { label: 'Temperatura', value: '20–26 °C (luci accese)' },
        { label: 'Umidità in fioritura', value: '40–50%, sotto 45% nelle ultime 2 settimane' },
        { label: 'Vegetativa consigliata', value: '3–5 settimane' },
      ],
      tips: [
        'Si adatta bene a tende piccole (60×60, 80×80): bastano poche settimane di vegetativa.',
        'Le cime dense trattengono umidità: tieni una buona ventilazione per evitare la muffa grigia.',
        "Una leggera defogliazione a inizio fioritura migliora il passaggio d'aria.",
      ],
    },
    outdoor: {
      params: [
        { label: 'Semina (Italia)', value: 'Aprile – inizio maggio' },
        { label: 'Raccolta', value: 'Fine settembre – inizio ottobre' },
        { label: 'Clima adatto', value: 'Anche nord Italia e collina' },
      ],
      tips: [
        'Finisce prima delle piogge autunnali: buona scelta per climi umidi o montani.',
        "Controlla le cime dopo ogni pioggia, scuotendo delicatamente l'acqua in eccesso.",
      ],
    },
    mistakes: ['Umidità alta in tarda fioritura (rischio botrite).', 'Vegetativa troppo lunga in spazi piccoli.'],
  },
  {
    id: 'sativa',
    name: 'Sativa',
    emoji: '🌱',
    summary: 'Piante alte e slanciate, foglie sottili, fioritura lunga. Rese alte ma richiedono spazio, pazienza e clima caldo.',
    difficulty: 'Impegnativa',
    floweringWeeks: [10, 14],
    traits: [
      { label: 'Altezza tipica', value: '1–2 m indoor, oltre 3 m outdoor' },
      { label: 'Fioritura', value: '10–14 settimane' },
      { label: 'Allungamento in fioritura', value: 'Alto (×2–3)' },
      { label: 'Foglie', value: 'Sottili, verde chiaro' },
      { label: 'Cime', value: 'Allungate e più ariose' },
    ],
    indoor: {
      params: [
        { label: 'Fotoperiodo', value: '18/6 in vegetativa, 12/12 in fioritura' },
        { label: 'Temperatura', value: '22–28 °C (luci accese)' },
        { label: 'Umidità in fioritura', value: '40–50%' },
        { label: 'Vegetativa consigliata', value: '2–3 settimane (poi raddoppia di altezza)' },
      ],
      tips: [
        "Passa a 12/12 quando la pianta è a circa 1/3 dell'altezza disponibile.",
        'Usa tecniche di contenimento: LST (piegatura), topping, rete SCROG.',
        'Lascia almeno 30–40 cm tra cime e lampada per lo stretch.',
      ],
    },
    outdoor: {
      params: [
        { label: 'Semina (Italia)', value: 'Aprile' },
        { label: 'Raccolta', value: 'Metà ottobre – novembre' },
        { label: 'Clima adatto', value: 'Sud Italia, costa, autunni secchi' },
      ],
      tips: [
        'Al nord rischia di non finire prima del freddo: preferisci genetiche precoci.',
        'Pianta in terra piena o vasi grandi (50 L+) per sfruttare la crescita.',
        'Prevedi tutori e legature contro vento e peso delle cime.',
      ],
    },
    mistakes: ["Sottovalutare l'altezza finale indoor.", 'Raccogliere troppo presto per impazienza.'],
  },
  {
    id: 'ibrida',
    name: 'Ibrida',
    emoji: '🍀',
    summary: 'Incrocio tra indica e sativa: caratteristiche intermedie. È la categoria più diffusa e versatile.',
    difficulty: 'Facile',
    floweringWeeks: [8, 10],
    traits: [
      { label: 'Altezza tipica', value: '80–150 cm indoor' },
      { label: 'Fioritura', value: '8–10 settimane' },
      { label: 'Allungamento in fioritura', value: 'Medio (×1,5–2)' },
      { label: 'Dominanza', value: 'Indica-dominante o sativa-dominante: leggi la scheda del seme' },
    ],
    indoor: {
      params: [
        { label: 'Fotoperiodo', value: '18/6 in vegetativa, 12/12 in fioritura' },
        { label: 'Temperatura', value: '21–27 °C (luci accese)' },
        { label: 'Umidità in fioritura', value: '40–50%' },
        { label: 'Vegetativa consigliata', value: '3–4 settimane' },
      ],
      tips: [
        "Comportati come con l'indica o la sativa in base alla dominanza dichiarata dal produttore.",
        'Topping e LST funzionano bene per ottenere una chioma piatta e uniforme.',
      ],
    },
    outdoor: {
      params: [
        { label: 'Semina (Italia)', value: 'Aprile – maggio' },
        { label: 'Raccolta', value: 'Inizio – metà ottobre' },
        { label: 'Clima adatto', value: 'Quasi tutta Italia' },
      ],
      tips: ['Scegli ibridi "outdoor" o resistenti alla muffa se vivi in zone piovose.'],
    },
    mistakes: ['Non leggere i tempi di fioritura indicati dalla banca semi.'],
  },
  {
    id: 'autofiorente',
    name: 'Autofiorente',
    emoji: '⏱️',
    summary: 'Fiorisce da sola dopo 3–4 settimane, indipendentemente dalle ore di luce. Ciclo completo in 8–11 settimane dal seme.',
    difficulty: 'Facile',
    floweringWeeks: [5, 7],
    traits: [
      { label: 'Ciclo completo', value: '8–11 settimane dal seme' },
      { label: 'Altezza tipica', value: '40–100 cm' },
      { label: 'Inizio fioritura', value: 'Automatico, dopo 3–4 settimane' },
      { label: 'Resa', value: 'Più bassa per pianta, ma cicli rapidi' },
    ],
    indoor: {
      params: [
        { label: 'Fotoperiodo', value: '18/6 o 20/4 per tutto il ciclo' },
        { label: 'Temperatura', value: '20–26 °C' },
        { label: 'Vaso', value: 'Finale da subito (11–20 L)' },
        { label: 'Nutrienti', value: 'Dosi ridotte (circa metà/2/3 della tabella)' },
      ],
      tips: [
        'Semina direttamente nel vaso finale: i trapianti rubano giorni preziosi.',
        "Evita potature pesanti (topping tardivo): non c'è tempo per recuperare. Meglio LST.",
        'Non cambiare il fotoperiodo: non serve il 12/12.',
      ],
    },
    outdoor: {
      params: [
        { label: 'Semina (Italia)', value: 'Da aprile ad agosto (anche 2–3 cicli)' },
        { label: 'Raccolta', value: 'Circa 70–80 giorni dopo la semina' },
        { label: 'Clima adatto', value: 'Ovunque, anche al nord' },
      ],
      tips: [
        'Le semine di maggio–giugno, con più ore di luce, danno le piante più grandi.',
        "Ideali per balconi e per chi vuole raccogliere prima dell'autunno.",
      ],
    },
    mistakes: ['Trapiantare più volte.', 'Concimare troppo nelle prime settimane.', 'Stressare la pianta con potature drastiche.'],
  },
  {
    id: 'fotoperiodica',
    name: 'Fotoperiodica',
    emoji: '🌗',
    summary:
      'Fiorisce solo quando le ore di buio arrivano a circa 12. Puoi decidere tu quanto farla crescere: controllo totale su dimensioni e resa.',
    difficulty: 'Media',
    floweringWeeks: [8, 11],
    traits: [
      { label: 'Vegetativa', value: 'Quanto vuoi (con 18/6)' },
      { label: 'Fioritura', value: 'Si avvia con 12/12' },
      { label: 'Cloni', value: 'Sì, si possono fare talee e piante madri' },
      { label: 'Resa', value: 'Alta, proporzionale alla vegetativa' },
    ],
    indoor: {
      params: [
        { label: 'Fotoperiodo', value: '18/6 vegetativa → 12/12 fioritura' },
        { label: 'Buio', value: 'Assoluto durante le 12 ore (niente infiltrazioni di luce)' },
        { label: 'Temperatura', value: '20–28 °C' },
      ],
      tips: [
        'Il buio deve essere totale: anche piccole luci possono causare stress o ermafroditismo.',
        'Usa un timer affidabile e controllalo spesso.',
        'Le talee prese prima del 12/12 mantengono il sesso della madre.',
      ],
    },
    outdoor: {
      params: [
        { label: 'Semina (Italia)', value: 'Aprile – maggio' },
        { label: 'Inizio fioritura', value: 'Agosto, quando le giornate si accorciano' },
        { label: 'Raccolta', value: 'Fine settembre – novembre (dipende dalla genetica)' },
      ],
      tips: [
        'Prima semini, più la pianta diventa grande prima della fioritura.',
        'Evita luci artificiali di notte vicino alla pianta (lampioni, faretti).',
      ],
    },
    mistakes: ['Infiltrazioni di luce durante il buio.', 'Timer guasto o mal impostato.'],
  },
  {
    id: 'cbd',
    name: 'CBD (basso THC)',
    emoji: '💚',
    summary:
      'Genetiche selezionate per alto CBD e THC molto basso. Si coltivano come le altre, ma serve attenzione a legge e momento di raccolta.',
    difficulty: 'Facile',
    floweringWeeks: [8, 10],
    traits: [
      { label: 'Rapporto', value: 'CBD alto, THC basso (a seconda della genetica)' },
      { label: 'Coltivazione', value: 'Uguale alla tipologia (indica/sativa/auto)' },
      { label: 'Fioritura', value: '8–10 settimane (tipica)' },
    ],
    indoor: {
      params: [
        { label: 'Fotoperiodo', value: 'Come la genetica (18/6 → 12/12 o auto)' },
        { label: 'Temperatura', value: '20–26 °C' },
      ],
      tips: ["Molte varietà CBD sono vigorose: prevedi spazio e un po' di LST.", 'Raccogli con tricomi prevalentemente lattiginosi.'],
    },
    outdoor: {
      params: [
        { label: 'Semina (Italia)', value: 'Aprile – maggio' },
        { label: 'Raccolta', value: 'Settembre – ottobre' },
      ],
      tips: ['Verifica sempre le norme locali sulle varietà ammesse e sui limiti di THC.', 'Conserva cartellini e certificati dei semi.'],
    },
    mistakes: ['Dare per scontato che sia sempre legale: le regole cambiano spesso.'],
  },
];

export const strainById = (id: string) => STRAINS.find((s) => s.id === id);
