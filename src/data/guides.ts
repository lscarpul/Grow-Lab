export type GuideId = 'raccolta' | 'essiccazione' | 'concia';

export interface Guide {
  id: GuideId;
  title: string;
  subtitle: string;
  duration: string;
  target: { label: string; value: string }[];
  steps: { title: string; text: string }[];
  checks: string[];
  mistakes: string[];
}

export const GUIDES: Guide[] = [
  {
    id: 'raccolta',
    title: 'Guida alla raccolta',
    subtitle: 'Capire quando tagliare guardando i tricomi, non il calendario.',
    duration: 'Ultime 2 settimane di fioritura',
    target: [
      { label: 'Tricomi', value: '70–80% lattiginosi, 10–20% ambrati' },
      { label: 'Pistilli', value: '70–90% scuriti e ritirati' },
      { label: 'Ultima annaffiatura', value: '1–2 giorni prima del taglio' },
    ],
    steps: [
      {
        title: 'Procurati una lente',
        text: 'Una lente 60× o un microscopio da clip per il telefono: i tricomi vanno guardati sulle cime, non sulle foglioline (maturano prima).',
      },
      {
        title: 'Controlla ogni 2–3 giorni',
        text: 'Dalla data indicata dal breeder meno una settimana, osserva le cime alte e quelle basse: maturano in tempi diversi.',
      },
      {
        title: "Decidi l'effetto",
        text: 'Più tricomi lattiginosi = effetto più "alto" e mentale; più ambrati (20–30%) = effetto più rilassante e corporeo. Trasparenti = troppo presto.',
      },
      {
        title: 'Lavaggio finale (opzionale)',
        text: 'Con concimi minerali molti fanno 7–10 giorni di sola acqua per finire le riserve. Con terra ricca o organici spesso non serve.',
      },
      {
        title: 'Buio e taglio',
        text: 'Taglia a fine notte o appena prima che si accenda la luce: le cime sono più profumate. Taglia rami interi, lasciando 15–25 cm di gambo.',
      },
      {
        title: 'Manicure',
        text: 'Togli le foglie grandi subito. Le foglioline con resina puoi toglierle ora (wet trim, essiccazione più veloce) o dopo (dry trim, più lenta e aromatica).',
      },
    ],
    checks: [
      'Lente pronta e pulita',
      'Forbici affilate e alcol per pulirle',
      'Guanti in nitrile',
      'Spazio di essiccazione già a 18–20 °C e 55–60% UR',
    ],
    mistakes: [
      'Tagliare guardando i pistilli: ingannano, i tricomi no',
      'Tagliare troppo presto per fretta: perdi fino al 20–25% del peso',
      'Lasciare cime con muffa grigia nel lotto: toglile e buttale',
    ],
  },
  {
    id: 'essiccazione',
    title: "Guida all'essiccazione",
    subtitle: "Lenta e al buio: è qui che si conserva (o si perde) l'aroma.",
    duration: '7–14 giorni',
    target: [
      { label: 'Temperatura', value: '18–20 °C' },
      { label: 'Umidità', value: '55–60%' },
      { label: 'Luce', value: 'Buio totale' },
      { label: 'Aria', value: 'Ricambio leggero, mai diretta sulle cime' },
    ],
    steps: [
      {
        title: 'Prepara lo spazio',
        text: "La tenda vuota è ideale: estrattore al minimo con filtro a carboni, ventilatore puntato al muro e non sulle cime, igrometro all'altezza dei rami.",
      },
      {
        title: 'Appendi i rami',
        text: 'Rami a testa in giù su un filo o una rete da essiccazione, distanziati in modo che le cime non si tocchino.',
      },
      {
        title: 'Controlla due volte al giorno',
        text: "Se l'umidità supera il 65% per più di un giorno rischi muffa: aumenta il ricambio d'aria. Sotto il 45% asciuga troppo in fretta e l'aroma sa di fieno.",
      },
      {
        title: 'Il test del ramo',
        text: 'È pronta quando i rametti piccoli si spezzano con un "crack" invece di piegarsi, di solito dopo 7–14 giorni. L\'esterno è secco ma la cima non si sbriciola.',
      },
      {
        title: 'Rifila e stacca',
        text: "Se non l'hai fatto prima, togli le foglioline ora e stacca le cime dal ramo, pronte per i barattoli.",
      },
    ],
    checks: ['Termoigrometro tarato', 'Rete o filo per appendere', "Estrattore con filtro (l'odore è al massimo)", 'Spazio buio'],
    mistakes: [
      'Essiccare in 3–4 giorni con caldo o ventilatore diretto: aroma perso',
      'Forno, microonde o deumidificatore a palla: rovinano terpeni e combustione',
      "Cime ammassate: muffa all'interno che non vedi",
    ],
  },
  {
    id: 'concia',
    title: 'Guida alla concia',
    subtitle: "Il riposo in barattolo che rende il fumo morbido e l'aroma completo.",
    duration: 'Minimo 2 settimane, meglio 4–8',
    target: [
      { label: 'Umidità nel barattolo', value: '58–62%' },
      { label: 'Temperatura', value: '15–21 °C' },
      { label: 'Riempimento', value: '¾ del barattolo' },
    ],
    steps: [
      {
        title: 'Barattoli di vetro',
        text: 'Vetro a chiusura ermetica, riempito per tre quarti senza schiacciare. Metti un piccolo igrometro dentro almeno a uno dei barattoli.',
      },
      {
        title: 'Prima settimana: "burping"',
        text: "Apri i barattoli 1–2 volte al giorno per 10–15 minuti per far uscire l'umidità. Se l'igrometro segna sopra il 65%, lascia le cime fuori su un vassoio per qualche ora.",
      },
      {
        title: 'Seconda e terza settimana',
        text: "Apri una volta ogni 2–3 giorni. L'umidità si stabilizza tra 58 e 62%.",
      },
      {
        title: 'Dopo il primo mese',
        text: 'Basta aprire ogni tanto. Puoi aggiungere bustine a umidità controllata (58% o 62%) per la conservazione lunga.',
      },
      {
        title: 'Conservazione',
        text: "Al buio e al fresco. Così l'erba mantiene aroma e potenza per 6–12 mesi.",
      },
    ],
    checks: ['Barattoli di vetro ermetici', 'Mini igrometro', 'Bustine a umidità controllata 58–62%', 'Etichette con genetica e data'],
    mistakes: [
      'Mettere nei barattoli cime ancora umide: in pochi giorni fanno muffa',
      'Sacchetti di plastica: trattengono umidità e schiacciano i tricomi',
      'Conservare vicino a fonti di calore o alla luce',
    ],
  },
];

export const guideById = (id: GuideId) => GUIDES.find((g) => g.id === id)!;
