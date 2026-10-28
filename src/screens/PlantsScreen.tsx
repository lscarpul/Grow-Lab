import { LayoutGrid, List, TriangleAlert } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ring, Sparkline } from '../components/charts';
import { Disclaimer, Enter, Screen, StageBadge } from '../components/layout';
import { Badge, ChipRow, cn, Eyebrow, Glass, Progress, Segmented, T, TrendPill } from '../components/ui';
import { cultivarById } from '../data/cultivars';
import { Plant } from '../data/grows';
import { stageById } from '../data/stages';
import { cycleProgress, envScore, latest, plantAlerts, series, stageProgress } from '../lib/insights';
import { fmtNum, relativeDay } from '../lib/math';
import { useStore } from '../state/store';
import { C, METRIC_COLOR, STAGE_COLOR } from '../theme/tokens';
import { PlantDrawer } from './PlantDrawer';

type Group = 'crescita' | 'fioritura' | 'post';
type Env = 'indoor' | 'outdoor';
type Sort = 'urgenza' | 'raccolta' | 'salute';

const GROUP_OF = (p: Plant): Group =>
  p.stage === 'fioritura' ? 'fioritura' : ['raccolta', 'essiccazione', 'concia'].includes(p.stage) ? 'post' : 'crescita';

export function PlantsScreen() {
  const { plants } = useStore();
  const [view, setView] = useState<'lista' | 'griglia'>('lista');
  const [groups, setGroups] = useState<Group[]>([]);
  const [envs, setEnvs] = useState<Env[]>([]);
  const [sort, setSort] = useState<Sort>('urgenza');
  const [open, setOpen] = useState<Plant | null>(null);

  const toggle = <V,>(list: V[], set: (v: V[]) => void, v: V) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const filtered = useMemo(() => {
    const out = plants.filter((p) => (groups.length ? groups.includes(GROUP_OF(p)) : true) && (envs.length ? envs.includes(p.env) : true));
    return out.sort((a, b) => {
      if (sort === 'urgenza') return plantAlerts(b).length - plantAlerts(a).length || a.health - b.health;
      if (sort === 'salute') return b.health - a.health;
      const ha = a.expectedHarvest?.getTime() ?? Infinity;
      const hb = b.expectedHarvest?.getTime() ?? Infinity;
      return ha - hb;
    });
  }, [plants, groups, envs, sort]);

  const count = (g: Group) => plants.filter((p) => GROUP_OF(p) === g).length;
  const avgHealth = Math.round(plants.reduce((a, p) => a + p.health, 0) / plants.length);
  const totalAlerts = plants.reduce((a, p) => a + plantAlerts(p).length, 0);

  return (
    <>
      <Screen
        eyebrow="Diario di coltivazione"
        title="Le mie piante"
        subtitle="Ogni pianta ha sensori, fasi, consigli e diario. Tocca una scheda per aprire il dettaglio."
      >
        {/* KPI strip */}
        <Enter i={1} className="mx-5 mt-5 flex-row gap-3">
          {[
            { label: 'Piante', value: `${plants.length}`, sub: `${count('crescita') + count('fioritura')} attive`, color: C.leaf },
            { label: 'Salute media', value: `${avgHealth}`, sub: 'su 100', color: C.lime },
            {
              label: 'Avvisi',
              value: `${totalAlerts}`,
              sub: totalAlerts ? 'da verificare' : 'nessuno',
              color: totalAlerts ? C.rose : C.leaf,
            },
          ].map((k) => (
            <Glass key={k.label} className="flex-1 p-3.5">
              <Eyebrow>{k.label}</Eyebrow>
              <T className="mt-1 font-grotesk-b text-[26px]" style={{ color: k.color }}>
                {k.value}
              </T>
              <T className="text-2xs text-[#56655F]">{k.sub}</T>
            </Glass>
          ))}
        </Enter>

        {/* Controls */}
        <Enter i={2} className="mt-5">
          <ChipRow<Group | Env>
            options={[
              { value: 'crescita', label: 'In crescita', count: count('crescita'), color: STAGE_COLOR.vegetativa },
              { value: 'fioritura', label: 'In fioritura', count: count('fioritura'), color: STAGE_COLOR.fioritura },
              { value: 'post', label: 'Post-raccolta', count: count('post'), color: STAGE_COLOR.concia },
              { value: 'indoor', label: 'Indoor', count: plants.filter((p) => p.env === 'indoor').length },
              { value: 'outdoor', label: 'Outdoor', count: plants.filter((p) => p.env === 'outdoor').length },
            ]}
            selected={[...groups, ...envs]}
            onToggle={(v) => (v === 'indoor' || v === 'outdoor' ? toggle(envs, setEnvs, v) : toggle(groups, setGroups, v as Group))}
          />
        </Enter>
        <Enter i={3} className="mx-5 mt-3 flex-row gap-3">
          <Segmented
            className="flex-1"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'urgenza', label: 'Urgenza' },
              { value: 'raccolta', label: 'Raccolta' },
              { value: 'salute', label: 'Salute' },
            ]}
          />
          <Segmented
            className="w-[104px]"
            value={view}
            onChange={setView}
            options={[
              { value: 'lista', label: '', icon: <List size={16} color={view === 'lista' ? C.leaf : '#8A9A93'} /> },
              { value: 'griglia', label: '', icon: <LayoutGrid size={16} color={view === 'griglia' ? C.leaf : '#8A9A93'} /> },
            ]}
          />
        </Enter>

        {filtered.length === 0 && <T className="mx-5 mt-10 text-center text-sm text-[#8A9A93]">Nessuna pianta con questi filtri.</T>}

        {view === 'lista' ? (
          <View className="mx-5 mt-4 gap-3">
            {filtered.map((p, i) => (
              <Enter i={4 + i} key={p.id}>
                <PlantRow plant={p} onPress={() => setOpen(p)} />
              </Enter>
            ))}
          </View>
        ) : (
          <View className="mx-5 mt-4 flex-row flex-wrap justify-between gap-y-3">
            {filtered.map((p, i) => (
              <Enter i={4 + i} key={p.id} className="w-[48.5%]">
                <PlantTile plant={p} onPress={() => setOpen(p)} />
              </Enter>
            ))}
          </View>
        )}
        <Disclaimer />
      </Screen>
      <PlantDrawer plant={open} onClose={() => setOpen(null)} />
    </>
  );
}

function PlantRow({ plant: p, onPress }: { plant: Plant; onPress: () => void }) {
  const sp = stageProgress(p);
  const cp = cycleProgress(p);
  const last = latest(p);
  const alerts = plantAlerts(p);
  const c = STAGE_COLOR[p.stage];
  const lastLog = p.logs[0];
  return (
    <Pressable onPress={onPress}>
      <Glass className="p-4" glow={alerts.length ? C.rose : undefined}>
        <View className="flex-row items-center">
          <Ring value={sp.pct} size={64} stroke={6} color={c} color2={C.lime}>
            <T className="font-grotesk-b text-base leading-5">{sp.day}</T>
            <T className="text-[8px] text-[#8A9A93]">giorno</T>
          </Ring>
          <View className="ml-3.5 flex-1">
            <View className="flex-row items-center justify-between">
              <T className="flex-1 font-grotesk-b text-[18px] tracking-[-0.3px]" numberOfLines={1}>
                {p.nickname}
              </T>
              {alerts.length > 0 && (
                <View className="ml-2 flex-row items-center">
                  <TriangleAlert size={13} color={C.rose} />
                  <T className="ml-1 font-inter-sb text-2xs text-[#FB7185]">{alerts.length}</T>
                </View>
              )}
            </View>
            <T className="text-xs text-[#8A9A93]" numberOfLines={1}>
              {cultivarById(p.cultivarId)?.name} · {p.space}
            </T>
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <StageBadge stage={p.stage} />
              <Badge tone={p.env === 'indoor' ? 'violet' : 'amber'}>{p.env === 'indoor' ? 'Indoor' : 'Outdoor'}</Badge>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row">
          {[
            { label: 'Temp', value: `${fmtNum(last.temp, 1)}°`, data: series(p, 'temp', 10).map((d) => d.value), color: METRIC_COLOR.temp },
            { label: 'UR', value: `${last.rh}%`, data: series(p, 'rh', 10).map((d) => d.value), color: METRIC_COLOR.rh },
            { label: 'VPD', value: fmtNum(last.vpd, 2), data: series(p, 'vpd', 10).map((d) => d.value), color: METRIC_COLOR.vpd },
          ].map((m, i) => (
            <View key={m.label} className={cn('flex-1', i > 0 && 'pl-3')}>
              <View className="flex-row items-baseline justify-between">
                <T className="text-2xs text-[#8A9A93]">{m.label}</T>
                <T className="font-grotesk text-[13px]">{m.value}</T>
              </View>
              <Sparkline data={m.data} color={m.color} width={92} height={24} />
            </View>
          ))}
        </View>

        <View className="mt-3 flex-row items-center">
          <View className="flex-1">
            <Progress value={cp.pct} color={c} height={4} />
          </View>
          <T className="ml-3 text-2xs text-[#8A9A93]">
            {p.expectedHarvest ? `${cp.daysLeft} gg alla raccolta` : p.finalYield ? `${p.finalYield} g raccolti` : 'Completata'}
          </T>
        </View>
        {lastLog && (
          <View className="mt-3 flex-row items-center border-t border-white/[0.05] pt-3">
            <T className="flex-1 text-2xs text-[#8A9A93]" numberOfLines={1}>
              <T className="font-inter-sb text-2xs text-[#C9D4CF]">{lastLog.title}</T> · {relativeDay(lastLog.date)}
            </T>
            <View className="ml-2 flex-row items-center">
              <T className="text-2xs text-[#56655F]">Salute </T>
              <T className="font-inter-sb text-2xs">{p.health}</T>
              <View className="ml-1.5">
                <TrendPill value={p.healthTrend} />
              </View>
            </View>
          </View>
        )}
      </Glass>
    </Pressable>
  );
}

function PlantTile({ plant: p, onPress }: { plant: Plant; onPress: () => void }) {
  const sp = stageProgress(p);
  const c = STAGE_COLOR[p.stage];
  const score = envScore(p);
  return (
    <Pressable onPress={onPress}>
      <Glass className="items-center p-4" glow={c}>
        <Ring value={sp.pct} size={86} stroke={8} color={c} color2={C.lime}>
          <T className="font-grotesk-b text-xl">{sp.day}</T>
          <T className="-mt-0.5 text-[9px] text-[#8A9A93]">/ {sp.target} gg</T>
        </Ring>
        <T className="mt-3 font-grotesk-b text-[15px]" numberOfLines={1}>
          {p.nickname}
        </T>
        <T className="text-2xs text-[#8A9A93]" numberOfLines={1}>
          {cultivarById(p.cultivarId)?.name}
        </T>
        <T className="mt-1.5 font-inter-sb text-2xs" style={{ color: c }}>
          {stageById(p.stage)?.name}
        </T>
        <View className="mt-3 w-full flex-row justify-between border-t border-white/[0.06] pt-2.5">
          <View className="items-center">
            <T className="text-[9px] text-[#56655F]">Salute</T>
            <T className="font-grotesk text-[13px]">{p.health}</T>
          </View>
          <View className="items-center">
            <T className="text-[9px] text-[#56655F]">Range</T>
            <T className="font-grotesk text-[13px]" style={{ color: score >= 80 ? C.leaf : C.amber }}>
              {score}%
            </T>
          </View>
          <View className="items-center">
            <T className="text-[9px] text-[#56655F]">Avvisi</T>
            <T className="font-grotesk text-[13px]" style={{ color: plantAlerts(p).length ? C.rose : '#ECF3EF' }}>
              {plantAlerts(p).length}
            </T>
          </View>
        </View>
      </Glass>
    </Pressable>
  );
}
