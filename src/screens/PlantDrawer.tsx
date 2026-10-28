import { Beaker, Droplets, Eye, FlaskConical, Scissors, ShieldCheck, Sprout, TriangleAlert } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AreaChart, MiniBars, RangeBar, Ring } from '../components/charts';
import { Drawer } from '../components/Drawer';
import { StageBadge } from '../components/layout';
import { Badge, Bullet, Divider, Eyebrow, Glass, T, tap, TrendPill } from '../components/ui';
import { cultivarById } from '../data/cultivars';
import { LogKind, Plant } from '../data/grows';
import { METRICS, MetricKey, rangeStatus, STAGE_RANGES } from '../data/ranges';
import { stageById } from '../data/stages';
import { cycleProgress, envScore, latest, metricTrend, plantAlerts, plantTasks, series, stageProgress } from '../lib/insights';
import { daysBetween, fmtDate, fmtNum, fmtTime, relativeDay } from '../lib/math';
import { useStore } from '../state/store';
import { alpha, C, METRIC_COLOR, STAGE_COLOR } from '../theme/tokens';

export const LOG_META: Record<LogKind, { label: string; color: string; Icon: typeof Droplets }> = {
  acqua: { label: 'Acqua', color: C.sky, Icon: Droplets },
  nutrienti: { label: 'Nutrienti', color: C.amber, Icon: FlaskConical },
  training: { label: 'Training', color: C.leaf, Icon: Scissors },
  osservazione: { label: 'Osservazione', color: C.violet, Icon: Eye },
  trapianto: { label: 'Trapianto', color: C.lime, Icon: Sprout },
  raccolta: { label: 'Raccolta', color: '#F7B946', Icon: Scissors },
  trattamento: { label: 'Trattamento', color: C.rose, Icon: ShieldCheck },
};

const QUICK: { kind: LogKind; title: string; detail: string }[] = [
  { kind: 'acqua', title: 'Annaffiatura', detail: 'Registrata dal diario rapido.' },
  { kind: 'nutrienti', title: 'Fertirrigazione', detail: 'Registrata dal diario rapido.' },
  { kind: 'training', title: 'Training / potatura', detail: 'Registrato dal diario rapido.' },
  { kind: 'osservazione', title: 'Controllo visivo', detail: 'Nessuna anomalia rilevata.' },
];

export function PlantDrawer({ plant, onClose }: { plant: Plant | null; onClose: () => void }) {
  const { addLog } = useStore();
  const [metric, setMetric] = useState<MetricKey>('temp');
  const p = plant;
  const data = useMemo(() => (p ? derive(p) : null), [p]);
  if (!p || !data)
    return (
      <Drawer open={false} onClose={onClose} header={null}>
        {null}
      </Drawer>
    );
  const { cultivar, sp, cp, last, alerts, tasks, score } = data;
  const color = STAGE_COLOR[p.stage];
  const ranges = STAGE_RANGES[p.stage];
  const available = (['temp', 'rh', 'vpd', 'ph', 'ec', 'ppfd'] as MetricKey[]).filter(
    (k) => last[k] !== null && series(p, k, 14).length > 1,
  );
  const m = available.includes(metric) ? metric : available[0];
  const chartData = series(p, m, 21);
  const total = daysBetween(p.sowDate, p.expectedHarvest ?? new Date()) || 1;

  return (
    <Drawer
      open={!!plant}
      onClose={onClose}
      accent={color}
      header={
        <View>
          <View className="flex-row items-center gap-2">
            <StageBadge stage={p.stage} />
            <Badge tone={p.env === 'indoor' ? 'violet' : 'amber'}>{p.env === 'indoor' ? 'Indoor' : 'Outdoor'}</Badge>
          </View>
          <T className="mt-2 font-grotesk-b text-[26px] tracking-[-0.6px]">{p.nickname}</T>
          <T className="text-[13px] text-[#8A9A93]">
            {cultivar?.name} · {p.medium}
            {p.potL ? ` ${p.potL} L` : ''} · {p.space}
          </T>
        </View>
      }
    >
      {/* Hero metrics */}
      <View className="flex-row items-center px-5 pt-1">
        <Ring value={sp.pct} size={112} stroke={10} color={color} color2={C.lime}>
          <T className="font-grotesk-b text-[26px]">{sp.day}</T>
          <T className="-mt-1 text-2xs text-[#8A9A93]">giorno di {sp.target}</T>
        </Ring>
        <View className="ml-5 flex-1 gap-3">
          <View>
            <Eyebrow>Salute pianta</Eyebrow>
            <View className="mt-1 flex-row items-center gap-2">
              <T className="font-grotesk-b text-2xl">{p.health}</T>
              <TrendPill value={p.healthTrend} label="7 gg" />
            </View>
          </View>
          <View>
            <Eyebrow>Ambiente nel range</Eyebrow>
            <View className="mt-1 flex-row items-center gap-2">
              <T className="font-grotesk-b text-2xl" style={{ color: score >= 80 ? C.leaf : score >= 60 ? C.amber : C.rose }}>
                {score}%
              </T>
              <T className="text-2xs text-[#56655F]">ultimi 7 giorni</T>
            </View>
          </View>
        </View>
      </View>

      {/* Cycle timeline */}
      <Glass className="mx-5 mt-5 p-4">
        <View className="flex-row items-center justify-between">
          <Eyebrow>Ciclo di vita</Eyebrow>
          <T className="text-2xs text-[#8A9A93]">
            Giorno {cp.day}
            {p.expectedHarvest ? ` · raccolta ~${fmtDate(p.expectedHarvest)}` : ''}
          </T>
        </View>
        <View className="mt-3 flex-row overflow-hidden rounded-full" style={{ height: 12, gap: 2 }}>
          {p.timeline.map((t, i) => {
            const end = p.timeline[i + 1]?.start ?? p.expectedHarvest ?? new Date();
            const len = Math.max(1, daysBetween(t.start, end));
            return (
              <View
                key={t.stage}
                style={{ flex: len / total, backgroundColor: alpha(STAGE_COLOR[t.stage], i === p.timeline.length - 1 ? 0.95 : 0.55) }}
              />
            );
          })}
          {p.expectedHarvest && <View style={{ flex: Math.max(0, cp.daysLeft) / total, backgroundColor: 'rgba(255,255,255,0.06)' }} />}
        </View>
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
          {p.timeline.map((t) => (
            <View key={t.stage} className="flex-row items-center">
              <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_COLOR[t.stage] }} />
              <T className="text-2xs text-[#A9B6B0]">
                {stageById(t.stage)?.name} · {fmtDate(t.start)}
              </T>
            </View>
          ))}
        </View>
      </Glass>

      {/* Alerts */}
      {alerts.length > 0 && (
        <View className="mx-5 mt-4 gap-2">
          {alerts.map((a) => (
            <View
              key={a.id}
              className="flex-row rounded-2xl p-3.5"
              style={{
                backgroundColor: alpha(a.level === 'bad' ? C.rose : C.amber, 0.08),
                borderWidth: 1,
                borderColor: alpha(a.level === 'bad' ? C.rose : C.amber, 0.25),
              }}
            >
              <TriangleAlert size={16} color={a.level === 'bad' ? C.rose : C.amber} />
              <View className="ml-2.5 flex-1">
                <T className="font-inter-sb text-[13px]">{a.title}</T>
                <T className="mt-0.5 text-xs leading-[17px] text-[#B7C3BE]">{a.detail}</T>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Chart */}
      {m && (
        <Glass className="mx-5 mt-4 px-4 pb-3 pt-4">
          <View className="flex-row items-start justify-between">
            <View>
              <Eyebrow>{METRICS[m].label}</Eyebrow>
              <View className="mt-1 flex-row items-baseline">
                <T className="font-grotesk-b text-[28px]" style={{ color: METRIC_COLOR[m] }}>
                  {fmtNum(last[m] as number, METRICS[m].digits)}
                </T>
                <T className="ml-1 text-xs text-[#8A9A93]">{METRICS[m].unit}</T>
              </View>
            </View>
            <TrendPill value={metricTrend(p, m)} label="vs 7 gg prec." goodWhenUp={m === 'ppfd'} />
          </View>
          <View className="mt-2">
            <AreaChart
              id={`pd-${p.id}-${m}`}
              data={chartData}
              color={METRIC_COLOR[m]}
              unit={METRICS[m].unit}
              digits={METRICS[m].digits}
              ideal={ranges[m]}
              height={168}
              extra={(i) => {
                const r = p.readings[p.readings.length - chartData.length + i];
                return r
                  ? [
                      { label: 'Fase', value: stageById(r.stage)?.name ?? '', color: STAGE_COLOR[r.stage] },
                      { label: 'Temp / UR', value: `${fmtNum(r.temp, 1)}° · ${r.rh}%` },
                      { label: 'VPD', value: `${fmtNum(r.vpd, 2)} kPa` },
                    ]
                  : [];
              }}
            />
          </View>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {available.map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  tap();
                  setMetric(k);
                }}
                className="rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: k === m ? alpha(METRIC_COLOR[k], 0.16) : 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: k === m ? alpha(METRIC_COLOR[k], 0.45) : 'rgba(255,255,255,0.06)',
                }}
              >
                <T className="font-inter-sb text-2xs" style={{ color: k === m ? METRIC_COLOR[k] : '#8A9A93' }}>
                  {METRICS[k].short}
                </T>
              </Pressable>
            ))}
          </View>
        </Glass>
      )}

      {/* Range check */}
      <Glass className="mx-5 mt-4 p-4">
        <Eyebrow>Valori attuali vs ideale · {stageById(p.stage)?.name}</Eyebrow>
        <View className="mt-3 gap-3.5">
          {(['temp', 'rh', 'vpd', 'ph', 'ec', 'ppfd'] as MetricKey[])
            .filter((k) => ranges[k] && last[k] !== null)
            .map((k) => {
              const v = last[k] as number;
              const st = rangeStatus(v, ranges[k]);
              const c = st === 'ok' ? C.leaf : st === 'warn' ? C.amber : C.rose;
              return (
                <View key={k}>
                  <View className="mb-1 flex-row justify-between">
                    <T className="text-xs text-[#A9B6B0]">{METRICS[k].label}</T>
                    <T className="font-inter-sb text-xs" style={{ color: c }}>
                      {fmtNum(v, METRICS[k].digits)} {METRICS[k].unit}
                      <T className="text-2xs text-[#56655F]">
                        {'  '}
                        ideale {fmtNum(ranges[k]![0], METRICS[k].digits)}–{fmtNum(ranges[k]![1], METRICS[k].digits)}
                      </T>
                    </T>
                  </View>
                  <RangeBar scale={METRICS[k].scale} ideal={ranges[k]} value={v} color={METRIC_COLOR[k]} />
                </View>
              );
            })}
        </View>
      </Glass>

      {/* Water + growth */}
      <View className="mx-5 mt-4 flex-row gap-3">
        <Glass className="flex-1 p-4">
          <Eyebrow>Acqua · 14 gg</Eyebrow>
          <T className="mt-1 font-grotesk-b text-xl">
            {fmtNum(
              p.readings.slice(-14).reduce((a, r) => a + (r.water ?? 0), 0),
              1,
            )}
            <T className="font-inter text-xs text-[#8A9A93]"> L</T>
          </T>
          <View className="mt-3">
            <MiniBars data={p.readings.slice(-14).map((r) => r.water)} color={C.sky} height={46} />
          </View>
        </Glass>
        <Glass className="flex-1 p-4">
          <Eyebrow>Altezza</Eyebrow>
          <T className="mt-1 font-grotesk-b text-xl">
            {last.height}
            <T className="font-inter text-xs text-[#8A9A93]"> cm</T>
          </T>
          <View className="mt-1">
            <TrendPill value={metricHeightDelta(p)} suffix=" cm" label="in 7 gg" />
          </View>
          <View className="mt-2">
            <MiniBars data={p.readings.slice(-14).map((r) => r.height)} color={C.leaf} height={30} />
          </View>
        </Glass>
      </View>

      {/* Tasks */}
      <View className="mx-5 mt-6">
        <Eyebrow>Prossime azioni consigliate</Eyebrow>
        <View className="mt-3 gap-2">
          {tasks.map((t) => (
            <View key={t.id} className="flex-row rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">
              <View
                className="mr-3 mt-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: t.priority === 'alta' ? C.rose : t.priority === 'media' ? C.amber : C.sky }}
              />
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <T className="flex-1 font-inter-sb text-[13px]">{t.title}</T>
                  <T className="ml-2 text-2xs text-[#8A9A93]">{t.due}</T>
                </View>
                <T className="mt-0.5 text-xs leading-[17px] text-[#9FB0A9]">{t.detail}</T>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Cultivar notes */}
      {cultivar && (
        <Glass className="mx-5 mt-5 p-4">
          <Eyebrow>Note sulla genetica · {cultivar.name}</Eyebrow>
          <View className="mt-3">
            {cultivar.growerNotes.map((n) => (
              <Bullet key={n}>{n}</Bullet>
            ))}
          </View>
        </Glass>
      )}

      {/* Diary */}
      <View className="mx-5 mt-6">
        <View className="flex-row items-center justify-between">
          <Eyebrow>Diario</Eyebrow>
          <T className="text-2xs text-[#56655F]">{p.logs.length} voci</T>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {QUICK.map((q) => {
            const meta = LOG_META[q.kind];
            return (
              <Pressable
                key={q.kind}
                onPress={() => {
                  tap();
                  addLog(p.id, q.kind, q.title, q.detail);
                }}
                className="flex-row items-center rounded-full px-3 py-2"
                style={{ backgroundColor: alpha(meta.color, 0.1), borderWidth: 1, borderColor: alpha(meta.color, 0.3) }}
              >
                <meta.Icon size={13} color={meta.color} />
                <T className="ml-1.5 font-inter-sb text-2xs" style={{ color: meta.color }}>
                  + {meta.label}
                </T>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-4">
          {p.logs.map((l, i) => {
            const meta = LOG_META[l.kind];
            return (
              <View key={l.id} className="flex-row">
                <View className="items-center" style={{ width: 30 }}>
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: alpha(meta.color, 0.14), borderWidth: 1, borderColor: alpha(meta.color, 0.35) }}
                  >
                    <meta.Icon size={13} color={meta.color} />
                  </View>
                  {i < p.logs.length - 1 && <View className="w-px flex-1 bg-white/10" />}
                </View>
                <View className="ml-3 flex-1 pb-5">
                  <View className="flex-row items-center justify-between">
                    <T className="flex-1 font-inter-sb text-[13px]">{l.title}</T>
                    <T className="ml-2 text-2xs text-[#56655F]">
                      {relativeDay(l.date)} · {fmtTime(l.date)}
                    </T>
                  </View>
                  <T className="mt-0.5 text-xs leading-[17px] text-[#9FB0A9]">{l.detail}</T>
                  {l.metrics && (
                    <View className="mt-2 flex-row flex-wrap gap-1.5">
                      {l.metrics.map((mm) => (
                        <View key={mm.label} className="flex-row rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1">
                          <T className="text-2xs text-[#8A9A93]">{mm.label} </T>
                          <T className="font-inter-sb text-2xs">{mm.value}</T>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Divider className="mx-5 mt-2" />
      <View className="mx-5 mt-4 flex-row flex-wrap gap-x-6 gap-y-2">
        {[
          ['Luce', p.light],
          ['Fotoperiodo', p.photoperiod],
          ['Semina', fmtDate(p.sowDate)],
          ...(p.finalYield ? [['Resa secca', `${p.finalYield} g`]] : []),
        ].map(([k, v]) => (
          <View key={k}>
            <T className="text-2xs text-[#56655F]">{k}</T>
            <T className="font-inter-md text-xs">{v}</T>
          </View>
        ))}
      </View>
      <View className="mx-5 mt-4 flex-row items-center">
        <Beaker size={12} color="#56655F" />
        <T className="ml-1.5 text-2xs text-[#56655F]">Dati sensori dimostrativi generati per l'anteprima.</T>
      </View>
    </Drawer>
  );
}

function metricHeightDelta(p: Plant) {
  const h = p.readings.map((r) => r.height);
  if (h.length < 8) return 0;
  return h[h.length - 1] - h[h.length - 8];
}

function derive(p: Plant) {
  return {
    cultivar: cultivarById(p.cultivarId),
    sp: stageProgress(p),
    cp: cycleProgress(p),
    last: latest(p),
    alerts: plantAlerts(p),
    tasks: plantTasks(p),
    score: envScore(p),
  };
}
