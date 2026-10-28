# Grow Lab

App mobile (Android e iOS) per chi coltiva cannabis: dashboard con sensori e avvisi, diario delle piante, catalogo genetiche con confronto, guida per fasi e tipologie, diagnosi di carenze, parassiti e muffe.

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
    grows.ts               6 piante dimostrative con letture giornaliere
  lib/
    insights.ts            avvisi, attività consigliate, punteggi
    math.ts                VPD, DLI, trend, date
  state/store.tsx          diario e attività salvati sul telefono
  screens/                 Home, Piante, Genetiche, Guida, Diagnosi, drawer
```

## Note

- Le piante, i sensori e le statistiche della community sono **dati dimostrativi**. I parametri di coltivazione (range, tempi, sintomi, soluzioni) sono valori tipici di riferimento.
- Le voci aggiunte al diario e le attività spuntate restano salvate sul telefono.
- La coltivazione di cannabis è regolata in modo diverso in ogni Paese: verifica le leggi locali.
