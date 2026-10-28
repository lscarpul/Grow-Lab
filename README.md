# Grow Lab

App mobile (Android e iOS) per chi coltiva cannabis:

- **Home**: dashboard con sensori, VPD, avvisi e compiti del giorno (o i primi passi se non hai ancora piante).
- **Piante**: diario delle tue piante, misure manuali, cambio fase, raccolta stimata.
- **Kit**: lista della spesa per spazio, budget e numero di piante con prodotti e prezzi reali; consiglio "da genetica" (spazio, kit, costi, €/g) e "ho già" (genetiche adatte alla tua attrezzatura).
- **Genetiche**: 14 genetiche con radar, terpeni e confronto.
- **Guida**: fasi, tipologie e calendario outdoor mese per mese.
- **Strumenti**: diagnosi con foto e AI, ricerca per sintomi, calcolatori (VPD, DLI, bolletta, diluizione concimi).

Costruita con **Expo (React Native)** e **NativeWind** (Tailwind CSS per React Native).

## Provarla sul telefono in 2 minuti

1. Installa **Node.js 20+** sul computer.
2. Installa l'app **Expo Go** sul telefono (Play Store o App Store).
3. Nella cartella del progetto:

   ```bash
   npm install
   npx expo start
   ```

4. Inquadra il QR code che compare nel terminale:
   - Android: dall'app Expo Go
   - iPhone: con la fotocamera

Telefono e computer devono essere sulla stessa rete Wi‑Fi (in alternativa: `npx expo start --tunnel`).

## Creare un file installabile (APK)

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

EAS compila nel cloud e restituisce un link per scaricare l'APK. Per iOS serve un account Apple Developer.

## Diagnosi con foto (AI)

L'app non contiene nessuna chiave. Funziona in tre modi:

| Modo                         | Quando                                              | Come                                                                                                                    |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Server (versione in vendita) | `EXPO_PUBLIC_DIAGNOSIS_URL` impostato               | L'app manda la foto al Worker Cloudflare in `worker/`, che custodisce la chiave Gemini e limita le analisi per telefono |
| Chiave di test               | Nessun URL, chiave incollata in Strumenti → Foto AI | La foto va direttamente a Gemini con la tua chiave personale. Solo per sviluppo                                         |
| Esempio                      | Nessun URL e nessuna chiave                         | Mostra un risultato di prova, segnalato come esempio                                                                    |

### Test con la chiave gratuita

1. Crea una chiave su <https://aistudio.google.com/apikey> (gratis, senza carta).
2. Nell'app: Strumenti → Foto AI → tocca la scheda "Modalità esempio" → incolla la chiave → Salva.

Il piano gratuito di Gemini va bene per i tuoi test, ma i [termini Gemini API](https://ai.google.dev/gemini-api/terms) consentono **solo servizi a pagamento** per app offerte a utenti in UE, Svizzera e Regno Unito, e richiedono utenti maggiorenni. Per la versione in vendita usa il server con una chiave di un progetto Google Cloud con fatturazione attiva.

### Pubblicare il server (Cloudflare Workers, piano gratuito)

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create USAGE      # copia l'id in wrangler.toml
npx wrangler secret put GEMINI_API_KEY      # chiave Gemini (per il lancio: progetto con fatturazione)
npx wrangler secret put APP_TOKEN           # una stringa casuale a tua scelta
npm test                                    # test locali con Gemini simulato
npx wrangler deploy                         # stampa l'URL, es. https://grow-lab-diagnosis.<tuo-account>.workers.dev
```

Poi nell'app crea un file `.env` (vedi `.env.example`):

```
EXPO_PUBLIC_DIAGNOSIS_URL=https://grow-lab-diagnosis.<tuo-account>.workers.dev
EXPO_PUBLIC_DIAGNOSIS_TOKEN=<lo stesso APP_TOKEN>
EXPO_PUBLIC_STORE_BUILD=1
```

- Limiti in `worker/wrangler.toml`: `DAILY_LIMIT_PER_DEVICE` (analisi al giorno per telefono) e `GLOBAL_DAILY_LIMIT` (tetto di spesa giornaliero).
- Costo indicativo con `gemini-3.5-flash-lite` ($0,30 per milione di token in ingresso, $2,50 in uscita): circa 0,3 centesimi a foto. Verifica i prezzi aggiornati su <https://ai.google.dev/gemini-api/docs/pricing>.
- Il piano gratuito di Workers KV consente 1.000 scritture al giorno (circa 500 analisi): oltre serve Workers Paid (5 $/mese).
- `APP_TOKEN` scoraggia l'uso del server fuori dall'app ma si può estrarre dall'APK: per una protezione forte aggiungi Play Integrity.
- Le foto non vengono salvate sul server.

## Google Play

- Età: l'app chiede conferma della maggiore età al primo avvio. Imposta anche la classificazione 18+ nella console.
- Le norme di Google Play vietano le app che facilitano la vendita di cannabis o di prodotti con THC. Con `EXPO_PUBLIC_STORE_BUILD=1` i semi mostrano prezzo e negozio senza link d'acquisto; restano i link all'attrezzatura.
- Prezzi dei prodotti verificati il 28 ottobre 2026 (`src/data/shop.ts`): aggiornali prima di ogni rilascio.

## Struttura

```
App.tsx                    font, provider, tab bar
src/
  components/
    ui.tsx                 vetro (glassmorphism), badge, trend, chip, segmented
    charts.tsx             grafico ad area interattivo con tooltip, sparkline, anello,
                           barre range, radar, ciambella, barre
    Drawer.tsx             pannello dal basso con sfocatura e trascinamento
    layout.tsx             schermata, animazioni d'ingresso, tab bar
    Background.tsx         sfondo con gradienti
  data/
    stages.ts              7 fasi del ciclo (parametri, passi, errori)
    strains.ts             6 tipologie (indica, sativa, ibrida, auto, foto, CBD)
    problems.ts            22 problemi: carenze, stress, parassiti, muffe
    cultivars.ts           14 genetiche con terpeni e statistiche
    ranges.ts              range ideali per fase (temp, UR, VPD, pH, EC, PPFD)
    grows.ts               6 piante dimostrative + piante e misure dell'utente
    kit.ts                 calcolo del kit (LED, estrattore, vasi, substrato…)
    shop.ts                prodotti e prezzi reali, semi per genetica
    calendar.ts            calendario outdoor, ore di luce
  lib/
    advisor.ts             consigli genetica → spazio e attrezzatura → genetiche
    gemini.ts              richiesta e schema della diagnosi (condiviso col Worker)
    diagnosis.ts           server / chiave di test / esempio
    insights.ts            avvisi, attività consigliate, punteggi
    math.ts                VPD, DLI, trend, date
  state/store.tsx          dati salvati sul telefono
  screens/                 Home, Piante, Kit, Genetiche, Guida, Strumenti, drawer
worker/                    server Cloudflare per la diagnosi (chiave, limiti, test)
```

## Note

- Le piante d'esempio (disattivabili in Piante), i loro sensori e le statistiche della community sono **dati dimostrativi**. I parametri di coltivazione (range, tempi, sintomi, soluzioni) sono valori tipici di riferimento.
- Le voci aggiunte al diario e le attività spuntate restano salvate sul telefono.
- La coltivazione di cannabis è regolata in modo diverso in ogni Paese: verifica le leggi locali.
