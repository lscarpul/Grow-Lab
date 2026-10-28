import {
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  Droplets,
  FlaskConical,
  Gauge,
  Sun,
  Thermometer,
  TriangleAlert,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AreaChart, Ring, Sparkline, StackBar } from '../components/charts';
import { Disclaimer, Enter, IconButton, Screen, StageBadge } from '../components/layout';
import { Badge, cn, Eyebrow, Glass, SectionHeader, Segmented, T, tap, TrendPill } from '../components/ui';
import { cultivarById } from '../data/cultivars';
import { Plant } from '../data/grows';
import { METRICS, MetricKey, STAGE_ORDER, STAGE_RANGES } from '../data/ranges';
import { stageById } from '../data/stages';
import { cycleProgress, envScore, latest, metricTrend, plantAlerts, plantTasks, series, stageProgress } from '../lib/insights';
import { daysBetween, dli, fmtDate, fmtNum, mean } from '../lib/math';
import { useStore } from '../state/store';
import { alpha, C, METRIC_COLOR, STAGE_COLOR } from '../theme/tokens';
import { PlantDrawer } from './PlantDrawer';

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 6) return 'Buonanotte';
  if (h < 13) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

const LIVING = ['germinazione', 'piantina', 'vegetativa', 'fioritura'];

export function HomeScreen() {
  const { plants, doneTasks, toggleTask } = useStore();
  const [open, setOpen] = useState<Plant | null>(null);
  const living = plants.filter((p) => LIVING.includes(p.stage));
  const [focusId, setFocusId] = useState(living[0]?.id);
  const focus = plants.find((p) => p.id === focusId) ?? living[0];
  const [metric, setMetric] = useState<MetricKey>('rh');

  const alerts = useMemo(() => plants.flatMap(plantAlerts), [plants]);
  const tasks = useMemo(
    () =>
      living.flatMap((p) =>
        plantTasks(p)
          .filter((t) => t.priority !== 'bassa')
          .slice(0, 2),
      ),
    [living],
  );
  const last = latest(focus);
  const sp = stageProgress(focus);
  const cp = cycleProgress(focus);
  const cultivar = cultivarById(focus.cultivarId);
  const ranges = STAGE_RANGES[focus.stage];
  const lightHours = focus.photoperiod.includes('/') ? Number(focus.photoperiod.split('/')[0]) : 14;

  const tiles: { key: MetricKey; Icon: typeof Thermometer; goodUp: boolean }[] = [
    { key: 'temp', Icon: Thermometer, goodUp: false },
    { key: 'rh', Icon: Droplets, goodUp: false },
  ];

  const stageCounts = STAGE_ORDER.map((s) => ({ stage: s, n: plants.filter((p) => p.stage === s).length })).filter((x) => x.n > 0);
  const upcoming = plants.filter((p) => p.expectedHarvest).sort((a, b) => a.expectedHarvest!.getTime() - b.expectedHarvest!.getTime());
  const horizon = Math.max(...upcoming.map((p) => daysBetween(new Date(), p.expectedHarvest!)), 1);

  return (
    <>
      <Screen
        eyebrow={`${greeting()} · ${fmtDate(new Date())}`}
        title="Grow Lab"
        subtitle={`${living.length} piante in crescita · ${plants.length - living.length} in post-raccolta`}
        right={
          <IconButton>
            <Bell size={18} color="#C9D4CF" />
            {alerts.length > 0 && <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FB7185]" />}
          </IconButton>
        }
      >
        {/* Focus selector */}
        <Enter i={1} className="mt-5">
          <View className="flex-row gap-2 px-5">
            {living.map((p) => {
              const active = p.id === focus.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    tap();
                    setFocusId(p.id);
                  }}
                  className={cn(
                    'flex-1 rounded-2xl border px-2.5 py-2',
                    active ? 'border-white/20 bg-white/[0.08]' : 'border-white/[0.06] bg-white/[0.02]',
                  )}
                >
                  <View className="flex-row items-center">
                    <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[p.stage] }} />
                    <T numberOfLines={1} className={cn('flex-1 text-[11px]', active ? 'font-inter-sb' : 'font-inter-md text-[#8A9A93]')}>
                      {p.nickname}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Enter>

        {/* Hero */}
        <Enter i={2} className="mx-5 mt-3">
          <Pressable onPress={() => setOpen(focus)}>
            <Glass glow={STAGE_COLOR[focus.stage]} className="p-5">
              <View className="flex-row items-center">
                <Ring value={sp.pct} size={128} stroke={11} color={STAGE_COLOR[focus.stage]} color2={C.lime}>
                  <Eyebrow className="text-[9px]">{stageById(focus.stage)?.name}</Eyebrow>
                  <T className="font-grotesk-b text-[34px] leading-[38px]">{sp.day}</T>
                  <T className="text-2xs text-[#8A9A93]">di ~{sp.target} giorni</T>
                </Ring>
                <View className="ml-5 flex-1">
                  <StageBadge stage={focus.stage} />
                  <T className="mt-2 font-grotesk-b text-[22px] leading-[26px] tracking-[-0.4px]">{focus.nickname}</T>
                  <T className="text-xs text-[#8A9A93]">{cultivar?.name}</T>
                  <View className="mt-3 flex-row items-center">
                    <CalendarClock size={13} color={C.amber} />
                    <T className="ml-1.5 text-xs text-[#C9D4CF]">
                      {focus.expectedHarvest ? (
                        <>
                          Raccolta tra <T className="font-inter-b text-[#F7B946]">{cp.daysLeft} giorni</T>
                        </>
                      ) : (
                        'Ciclo completato'
                      )}
                    </T>
                  </View>
                  <T className="mt-0.5 text-2xs text-[#56655F]">
                    Settimana {sp.week} · giorno {cp.day} dalla semina
                  </T>
                </View>
              </View>
              <View className="mt-5 flex-row border-t border-white/[0.06] pt-4">
                {[
                  { label: 'Salute', value: `${focus.health}`, trend: focus.healthTrend },
                  { label: 'Ambiente', value: `${envScore(focus)}%`, trend: null },
                  { label: 'Altezza', value: `${last.height} cm`, trend: null },
                  { label: 'Ciclo', value: `${Math.round(cp.pct * 100)}%`, trend: null },
                ].map((s, i) => (
                  <View key={s.label} className={cn('flex-1', i > 0 && 'border-l border-white/[0.06] pl-3')}>
                    <T className="text-2xs text-[#8A9A93]">{s.label}</T>
                    <T className="mt-0.5 font-grotesk text-[17px]">{s.value}</T>
                    {s.trend !== null && <TrendPill value={s.trend} />}
                  </View>
                ))}
              </View>
              <View className="mt-4 flex-row items-center justify-end">
                <T className="font-inter-sb text-xs text-[#34D88A]">Apri scheda completa</T>
                <ChevronRight size={14} color={C.leaf} />
              </View>
            </Glass>
          </Pressable>
        </Enter>

        {/* Bento: VPD gauge + temp/RH */}
        <View className="mx-5 mt-3 flex-row gap-3">
          <Enter i={3} className="flex-1">
            <Glass className="flex-1 p-4" glow={C.violet}>
              <View className="flex-row items-center justify-between">
                <Eyebrow>VPD</Eyebrow>
                <Gauge size={14} color={C.violet} />
              </View>
              <VpdGauge value={last.vpd} ideal={ranges.vpd} />
              <T className="text-center text-2xs leading-4 text-[#8A9A93]">
                Ideale in {stageById(focus.stage)?.name.toLowerCase()}:{' '}
                {ranges.vpd ? `${fmtNum(ranges.vpd[0], 1)}–${fmtNum(ranges.vpd[1], 1)} kPa` : '—'}
              </T>
              <View className="mt-3 items-center">
                <TrendPill value={metricTrend(focus, 'vpd')} label="7 gg" goodWhenUp={focus.stage === 'fioritura'} />
              </View>
            </Glass>
          </Enter>
          <View className="flex-1 gap-3">
            {tiles.map(({ key, Icon, goodUp }, idx) => {
              const v = last[key] as number;
              const r = ranges[key];
              const ok = r ? v >= r[0] && v <= r[1] : true;
              return (
                <Enter i={4 + idx} key={key}>
                  <Glass className="p-3.5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Icon size={13} color={METRIC_COLOR[key]} />
                        <Eyebrow className="ml-1.5">{METRICS[key].short}</Eyebrow>
                      </View>
                      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ok ? C.leaf : C.amber }} />
                    </View>
                    <View className="mt-1 flex-row items-end justify-between">
                      <T className="font-grotesk-b text-[24px]">
                        {fmtNum(v, METRICS[key].digits)}
                        <T className="font-inter text-xs text-[#8A9A93]">{METRICS[key].unit}</T>
                      </T>
                      <Sparkline data={series(focus, key, 10).map((d) => d.value)} color={METRIC_COLOR[key]} width={64} height={26} />
                    </View>
                    <TrendPill value={metricTrend(focus, key)} goodWhenUp={goodUp} label="vs sett. prec." />
                  </Glass>
                </Enter>
              );
            })}
          </View>
        </View>

        {/* Bento: small tiles */}
        <Enter i={6} className="mx-5 mt-3 flex-row gap-3">
          {[
            { label: 'pH', value: last.ph, digits: 2, unit: '', color: METRIC_COLOR.ph, Icon: FlaskConical, range: ranges.ph },
            { label: 'EC', value: last.ec, digits: 1, unit: 'mS', color: METRIC_COLOR.ec, Icon: FlaskConical, range: ranges.ec },
            {
              label: 'DLI',
              value: last.ppfd ? dli(last.ppfd, lightHours) : null,
              digits: 0,
              unit: 'mol',
              color: METRIC_COLOR.ppfd,
              Icon: Sun,
              range: ranges.ppfd ? ([dli(ranges.ppfd[0], lightHours), dli(ranges.ppfd[1], lightHours)] as [number, number]) : undefined,
            },
          ].map((t) => {
            const ok = t.value !== null && t.range ? t.value >= t.range[0] && t.value <= t.range[1] : true;
            return (
              <Glass key={t.label} className="flex-1 p-3.5">
                <View className="flex-row items-center justify-between">
                  <Eyebrow>{t.label}</Eyebrow>
                  <t.Icon size={12} color={t.color} />
                </View>
                <T className="mt-1.5 font-grotesk-b text-xl" style={{ color: ok ? '#ECF3EF' : C.amber }}>
                  {t.value === null ? '—' : fmtNum(t.value, t.digits)}
                  <T className="font-inter text-2xs text-[#8A9A93]"> {t.unit}</T>
                </T>
                <T className="mt-0.5 text-[9.5px] text-[#56655F]">
                  {t.range ? `ideale ${fmtNum(t.range[0], t.digits)}–${fmtNum(t.range[1], t.digits)}` : 'n/d in questa fase'}
                </T>
              </Glass>
            );
          })}
        </Enter>

        {/* Trend chart */}
        <SectionHeader title="Andamento ambiente" caption={`${focus.nickname} · ultimi 21 giorni · tieni premuto per i dettagli`} />
        <Enter i={7} className="mx-5">
          <Glass className="px-4 pb-3 pt-3">
            <Segmented
              value={metric}
              onChange={setMetric}
              options={(['temp', 'rh', 'vpd', 'ec'] as MetricKey[]).map((k) => ({ value: k, label: METRICS[k].short }))}
            />
            <View className="mt-3 flex-row items-baseline justify-between">
              <View className="flex-row items-baseline">
                <T className="font-grotesk-b text-[26px]" style={{ color: METRIC_COLOR[metric] }}>
                  {fmtNum(mean(series(focus, metric, 7).map((d) => d.value)), METRICS[metric].digits)}
                </T>
                <T className="ml-1 text-xs text-[#8A9A93]">{METRICS[metric].unit} media 7 gg</T>
              </View>
              <TrendPill value={metricTrend(focus, metric)} goodWhenUp={false} />
            </View>
            <AreaChart
              id={`home-${focus.id}-${metric}`}
              data={series(focus, metric, 21)}
              color={METRIC_COLOR[metric]}
              unit={METRICS[metric].unit}
              digits={METRICS[metric].digits}
              ideal={ranges[metric]}
              height={180}
              extra={(i) => {
                const rs = focus.readings.slice(-21);
                const r = rs[i];
                return r
                  ? [
                      { label: 'Fase', value: stageById(r.stage)?.name ?? '', color: STAGE_COLOR[r.stage] },
                      { label: 'Temp · UR', value: `${fmtNum(r.temp, 1)}° · ${r.rh}%` },
                      { label: 'VPD', value: `${fmtNum(r.vpd, 2)} kPa`, color: C.violet },
                      ...(r.water ? [{ label: 'Acqua', value: `${fmtNum(r.water, 1)} L`, color: C.sky }] : []),
                    ]
                  : [];
              }}
            />
            <View className="mt-1 flex-row items-center">
              <View className="mr-1.5 h-[1px] w-4 border-t border-dashed border-[#34D88A]" />
              <T className="text-2xs text-[#56655F]">Fascia ideale per la fase attuale</T>
            </View>
          </Glass>
        </Enter>

        {/* Alerts */}
        <SectionHeader
          title="Avvisi"
          caption="Calcolati confrontando i sensori con i range ideali"
          right={<Badge tone={alerts.length ? 'rose' : 'leaf'}>{alerts.length ? `${alerts.length} attivi` : 'Tutto ok'}</Badge>}
        />
        <View className="mx-5 gap-2">
          {alerts.map((a, i) => {
            const p = plants.find((x) => x.id === a.plantId)!;
            const c = a.level === 'bad' ? C.rose : C.amber;
            return (
              <Enter i={8 + i} key={a.id}>
                <Pressable onPress={() => setOpen(p)}>
                  <View
                    className="flex-row items-start rounded-[20px] p-3.5"
                    style={{ backgroundColor: alpha(c, 0.07), borderWidth: 1, borderColor: alpha(c, 0.22) }}
                  >
                    <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: alpha(c, 0.15) }}>
                      <TriangleAlert size={15} color={c} />
                    </View>
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <T className="font-inter-sb text-[13px]">{a.title}</T>
                        <T className="text-2xs text-[#8A9A93]">{p.nickname}</T>
                      </View>
                      <T className="mt-0.5 text-xs leading-[17px] text-[#B7C3BE]">{a.detail}</T>
                    </View>
                  </View>
                </Pressable>
              </Enter>
            );
          })}
        </View>

        {/* Tasks */}
        <SectionHeader
          title="Da fare oggi"
          caption="Suggerimenti in base alla fase di ogni pianta"
          right={
            <T className="font-grotesk text-sm text-[#8A9A93]">
              {tasks.filter((t) => doneTasks.includes(t.id)).length}/{tasks.length}
            </T>
          }
        />
        <Enter i={10} className="mx-5">
          <Glass className="px-2 py-1">
            {tasks.map((t, i) => {
              const done = doneTasks.includes(t.id);
              const p = plants.find((x) => x.id === t.plantId)!;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    tap();
                    toggleTask(t.id);
                  }}
                  className={cn('flex-row items-start px-2.5 py-3', i > 0 && 'border-t border-white/[0.05]')}
                >
                  <View
                    className="mt-0.5 h-5 w-5 items-center justify-center rounded-md border"
                    style={{ borderColor: done ? C.leaf : 'rgba(255,255,255,0.2)', backgroundColor: done ? C.leaf : 'transparent' }}
                  >
                    {done && <Check size={13} color="#05080A" strokeWidth={3} />}
                  </View>
                  <View className="ml-3 flex-1">
                    <T className={cn('font-inter-sb text-[13px]', done && 'text-[#56655F] line-through')}>{t.title}</T>
                    <T className="mt-0.5 text-xs leading-[17px] text-[#8A9A93]" numberOfLines={2}>
                      {t.detail}
                    </T>
                  </View>
                  <View className="ml-2 items-end">
                    <T className="text-2xs" style={{ color: STAGE_COLOR[p.stage] }}>
                      {p.nickname}
                    </T>
                    <T className="mt-0.5 text-2xs text-[#56655F]">{t.due}</T>
                  </View>
                </Pressable>
              );
            })}
          </Glass>
        </Enter>

        {/* Harvest horizon */}
        <SectionHeader title="Orizzonte raccolte" caption="Giorni mancanti alla raccolta stimata" />
        <Enter i={11} className="mx-5">
          <Glass className="p-4">
            {upcoming.map((p, i) => {
              const left = daysBetween(new Date(), p.expectedHarvest!);
              return (
                <Pressable key={p.id} onPress={() => setOpen(p)} className={cn(i > 0 && 'mt-4')}>
                  <View className="mb-1.5 flex-row items-baseline justify-between">
                    <T className="font-inter-sb text-[13px]">{p.nickname}</T>
                    <T className="text-xs text-[#8A9A93]">
                      <T className="font-grotesk-b text-[#ECF3EF]">{left}</T> gg · {fmtDate(p.expectedHarvest!)}
                    </T>
                  </View>
                  <View className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <View
                      style={{
                        width: `${Math.max(4, (1 - left / horizon) * 100)}%`,
                        height: '100%',
                        borderRadius: 10,
                        backgroundColor: STAGE_COLOR[p.stage],
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </Glass>
        </Enter>

        {/* Stage distribution */}
        <SectionHeader title="Distribuzione per fase" caption={`${plants.length} piante registrate`} />
        <Enter i={12} className="mx-5">
          <Glass className="p-4">
            <StackBar parts={stageCounts.map((s) => ({ value: s.n, color: STAGE_COLOR[s.stage] }))} height={12} />
            <View className="mt-4 flex-row flex-wrap gap-y-3">
              {stageCounts.map((s) => (
                <View key={s.stage} className="w-1/3">
                  <View className="flex-row items-center">
                    <View className="mr-1.5 h-2 w-2 rounded-sm" style={{ backgroundColor: STAGE_COLOR[s.stage] }} />
                    <T className="text-2xs text-[#8A9A93]">{stageById(s.stage)?.name}</T>
                  </View>
                  <T className="mt-0.5 font-grotesk-b text-lg">{s.n}</T>
                </View>
              ))}
            </View>
          </Glass>
        </Enter>

        <Disclaimer />
      </Screen>
      <PlantDrawer plant={open} onClose={() => setOpen(null)} />
    </>
  );
}

/** Semicircular VPD gauge with ideal arc. */
function VpdGauge({ value, ideal }: { value: number; ideal?: [number, number] }) {
  const max = 2;
  const segments = 28;
  return (
    <View className="mt-3 items-center">
      <View style={{ width: 132, height: 72, overflow: 'hidden' }}>
        {Array.from({ length: segments }).map((_, i) => {
          const f = i / (segments - 1);
          const v = f * max;
          const ang = Math.PI * (1 - f);
          const inIdeal = ideal ? v >= ideal[0] && v <= ideal[1] : false;
          const reached = v <= value;
          const r = 58;
          const x = 66 + Math.cos(ang) * r;
          const y = 66 - Math.sin(ang) * r;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x - 2,
                top: y - 7,
                width: 4,
                height: 14,
                borderRadius: 2,
                backgroundColor: reached
                  ? inIdeal
                    ? C.violet
                    : alpha(C.violet, 0.55)
                  : inIdeal
                    ? alpha(C.leaf, 0.35)
                    : 'rgba(255,255,255,0.08)',
                transform: [{ rotate: `${90 - (ang * 180) / Math.PI}deg` }],
              }}
            />
          );
        })}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
          <T className="font-grotesk-b text-[24px] leading-[26px]">{fmtNum(value, 2)}</T>
          <T className="text-[9px] text-[#8A9A93]">kPa</T>
        </View>
      </View>
    </View>
  );
}
