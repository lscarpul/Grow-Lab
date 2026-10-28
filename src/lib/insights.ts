import { Cultivar, cultivarById } from '../data/cultivars';
import { DayReading, Plant } from '../data/grows';
import { METRICS, MetricKey, rangeStatus, STAGE_DAYS, STAGE_RANGES } from '../data/ranges';
import { StageId } from '../data/types';
import { daysBetween, fmtNum, mean, trend } from './math';

export type Level = 'ok' | 'info' | 'warn' | 'bad';

export interface Alert {
  id: string;
  plantId: string;
  level: Level;
  title: string;
  detail: string;
  metric?: MetricKey;
}

export interface Task {
  id: string;
  plantId: string;
  title: string;
  detail: string;
  due: string;
  priority: 'alta' | 'media' | 'bassa';
}

export const latest = (p: Plant) => p.readings[p.readings.length - 1];

export function series(p: Plant, key: MetricKey | 'height' | 'water', days = 14) {
  return p.readings
    .slice(-days)
    .map((r) => ({ date: r.date, value: r[key as keyof DayReading] as number | null, stage: r.stage }))
    .filter((d): d is { date: Date; value: number; stage: StageId } => d.value !== null && d.value !== undefined);
}

export function metricTrend(p: Plant, key: MetricKey, window = 7) {
  return trend(
    series(p, key, window * 2).map((d) => d.value),
    window,
  );
}

export function stageLength(stage: StageId, cultivar?: Cultivar): [number, number] {
  if (stage === 'fioritura' && cultivar) return cultivar.floweringDays;
  if (stage === 'vegetativa' && cultivar?.tags.includes('autofiorente')) return [14, 28];
  return STAGE_DAYS[stage];
}

export function stageProgress(p: Plant, now = new Date()) {
  const cultivar = cultivarById(p.cultivarId);
  const day = daysBetween(p.stageStart, now) + 1;
  const [lo, hi] = stageLength(p.stage, cultivar);
  const target = Math.round((lo + hi) / 2);
  return { day, target, min: lo, max: hi, pct: Math.min(1, day / target), week: Math.ceil(day / 7) };
}

export function cycleProgress(p: Plant, now = new Date()) {
  const day = daysBetween(p.sowDate, now) + 1;
  if (!p.expectedHarvest) {
    const harvest = p.timeline.find((t) => t.stage === 'raccolta');
    return { day, total: harvest ? daysBetween(p.sowDate, harvest.start) : day, pct: 1, daysLeft: 0 };
  }
  const total = daysBetween(p.sowDate, p.expectedHarvest);
  return { day, total, pct: Math.min(1, day / total), daysLeft: Math.max(0, total - day) };
}

export function plantAlerts(p: Plant): Alert[] {
  const r = latest(p);
  const ranges = STAGE_RANGES[p.stage];
  const out: Alert[] = [];
  (['temp', 'rh', 'vpd', 'ph', 'ec'] as MetricKey[]).forEach((key) => {
    const value = r[key];
    const range = ranges[key];
    if (value === null || !range) return;
    const status = rangeStatus(value, range);
    if (status === 'ok') return;
    const meta = METRICS[key];
    const dir = value > range[1] ? 'sopra' : 'sotto';
    const u = meta.unit === '%' ? '%' : ` ${meta.unit}`;
    let detail = `${fmtNum(value, meta.digits)}${u} ${dir} l'intervallo ideale ${fmtNum(range[0], meta.digits)}–${fmtNum(range[1], meta.digits)}${u}.`;
    if (key === 'rh' && p.stage === 'fioritura' && value > range[1])
      detail += ' Cime dense + umidità alta = rischio botrite: aumenta estrazione e deumidificazione.';
    if (key === 'ph') detail += ' Fuori range si bloccano microelementi come ferro e manganese.';
    if (key === 'vpd' && value < range[0]) detail += ' Traspirazione lenta: le cime trattengono acqua.';
    out.push({
      id: `${p.id}-${key}`,
      plantId: p.id,
      level: status === 'bad' ? 'bad' : 'warn',
      title: `${meta.short} ${dir} il range`,
      detail,
      metric: key,
    });
  });
  const rhSeries = series(p, 'rh', 3).map((d) => d.value);
  if (p.stage === 'fioritura' && rhSeries.length === 3 && mean(rhSeries) > 52) {
    out.push({
      id: `${p.id}-mold`,
      plantId: p.id,
      level: 'bad',
      title: 'Rischio muffa elevato',
      detail: `UR media ${fmtNum(mean(rhSeries), 0)}% negli ultimi 3 giorni in fioritura. Ispeziona l'interno delle cime più grandi.`,
      metric: 'rh',
    });
  }
  return out;
}

export function plantTasks(p: Plant, now = new Date()): Task[] {
  const { day, week } = stageProgress(p, now);
  const cultivar = cultivarById(p.cultivarId);
  const auto = cultivar?.tags.includes('autofiorente');
  const t = (title: string, detail: string, due: string, priority: Task['priority']): Task => ({
    id: `${p.id}-${title}`,
    plantId: p.id,
    title,
    detail,
    due,
    priority,
  });
  switch (p.stage) {
    case 'germinazione':
      return [t('Controlla il fittone', 'Pianta quando è lungo 0,5–1 cm, radice verso il basso.', 'Oggi', 'alta')];
    case 'piantina':
      return [
        t('Annaffiatura leggera', 'Solo attorno al fusto, 100–200 ml.', 'Oggi', 'media'),
        t('Distanza lampada', 'Se il fusto si allunga, avvicina la luce di 5–10 cm.', 'Oggi', 'bassa'),
        ...(auto
          ? []
          : [t('Prepara il trapianto', 'Al 3°–4° nodo passa al vaso definitivo.', `Tra ${Math.max(1, 18 - day)} giorni`, 'bassa')]),
      ];
    case 'vegetativa':
      return [
        t('Misura pH del drenaggio', 'Range ideale 5,8–6,2 in cocco, 6,2–6,8 in terra.', 'Oggi', 'alta'),
        auto
          ? t('LST leggero', 'Apri i rami laterali: niente topping sulle autofiorenti.', 'Questa settimana', 'media')
          : t(
              'Valuta il passaggio a 12/12',
              "Quando la pianta ha metà dell'altezza finale desiderata.",
              day > 28 ? 'Ora' : `Tra ${28 - day} giorni`,
              day > 28 ? 'alta' : 'media',
            ),
        t('Lollipopping', 'Rimuovi i rametti bassi che non ricevono luce.', 'Prima della fioritura', 'bassa'),
      ];
    case 'fioritura':
      return [
        ...(week >= 5
          ? [
              t(
                'Ispezione anti-muffa',
                'Apri delicatamente le cime più grandi e cerca foglioline secche o marroni.',
                'Ogni giorno',
                'alta' as const,
              ),
            ]
          : []),
        ...(week <= 3
          ? [
              t(
                'Gestisci lo stretch',
                "Alza la lampada e continua l'LST sui rami che superano la chioma.",
                'Ogni 2 giorni',
                'alta' as const,
              ),
            ]
          : []),
        ...(week === 3 || week === 4
          ? [t('Defogliazione leggera', 'Rimuovi le foglie che coprono le cime interne.', 'Questa settimana', 'media' as const)]
          : []),
        ...(week >= 6
          ? [t('Controllo tricomi', 'Lente 60×: raccogli con tricomi lattiginosi e 10–30% ambrati.', 'Ogni 2 giorni', 'alta' as const)]
          : []),
        t('Fertirrigazione fioritura', 'Meno azoto, più fosforo e potassio. EC 1,4–2,0.', 'Prossima annaffiatura', 'media'),
        t('UR sotto il 50%', 'Deumidificatore ed estrattore: sotto il 45% nelle ultime 2 settimane.', 'Continuo', 'media'),
      ];
    case 'raccolta':
      return [t('Manicure', 'Rimuovi le foglie grandi e appendi i rami.', 'Oggi', 'alta')];
    case 'essiccazione':
      return [
        t(
          'Test dei rametti',
          'Pronta quando i rametti piccoli si spezzano con un "crack".',
          day >= 7 ? 'Oggi' : `Dal giorno 7`,
          day >= 7 ? 'alta' : 'media',
        ),
        t("Controlla l'odore", 'Odore di fieno o di muffa = intervieni su temperatura e umidità.', 'Ogni giorno', 'media'),
      ];
    case 'concia':
      return [
        t(
          day <= 14 ? 'Burping quotidiano' : 'Burping ogni 3 giorni',
          'Apri i barattoli 10–15 minuti. Se UR > 70% togli le cime per qualche ora.',
          day <= 14 ? 'Oggi' : 'Ogni 3 giorni',
          day <= 14 ? 'alta' : 'bassa',
        ),
        t('Assaggio di prova', 'Aroma e gusto migliorano fino a 6–8 settimane.', day >= 28 ? 'Pronta' : `Tra ${28 - day} giorni`, 'bassa'),
      ];
  }
}

/** 0–100 environmental score: share of the last 7 days within ideal range, weighted. */
export function envScore(p: Plant) {
  const ranges = STAGE_RANGES[p.stage];
  const keys: MetricKey[] = ['temp', 'rh', 'vpd', 'ph', 'ec'];
  let hit = 0;
  let total = 0;
  p.readings.slice(-7).forEach((r) => {
    keys.forEach((k) => {
      const v = r[k];
      const range = ranges[k];
      if (v === null || !range) return;
      total += 1;
      const s = rangeStatus(v, range);
      hit += s === 'ok' ? 1 : s === 'warn' ? 0.5 : 0;
    });
  });
  return total ? Math.round((hit / total) * 100) : 100;
}
