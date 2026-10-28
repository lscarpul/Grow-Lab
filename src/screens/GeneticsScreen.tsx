import { GitCompareArrows, Search, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Donut, Radar, RangeBar } from '../components/charts';
import { Drawer } from '../components/Drawer';
import { Disclaimer, Enter, Screen } from '../components/layout';
import { Badge, Bullet, ChipRow, cn, Divider, Eyebrow, Glass, KeyValue, Segmented, T, tap, TrendPill } from '../components/ui';
import { Cultivar, CULTIVARS, cultivarScores } from '../data/cultivars';
import { strainById } from '../data/strains';
import { StrainTypeId } from '../data/types';
import { fmtNum } from '../lib/math';
import { alpha, C, TYPE_COLOR } from '../theme/tokens';

type Sort = 'popolari' | 'resa' | 'veloci' | 'facili';
const COMPARE_COLORS = [C.leaf, C.violet, C.amber];
const TERP_COLORS = [C.leaf, C.violet, C.amber, C.sky, '#3A4A52'];

const FILTERS: { value: StrainTypeId; label: string }[] = [
  { value: 'indica', label: 'Indica' },
  { value: 'sativa', label: 'Sativa' },
  { value: 'ibrida', label: 'Ibrida' },
  { value: 'autofiorente', label: 'Autofiorente' },
  { value: 'fotoperiodica', label: 'Fotoperiodica' },
  { value: 'cbd', label: 'CBD' },
];

const avg = (r: [number, number]) => (r[0] + r[1]) / 2;
const fmtPct = (v: number) => fmtNum(v, v < 0.1 ? 2 : v < 1 ? 1 : 0);

export function GeneticsScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [types, setTypes] = useState<StrainTypeId[]>([]);
  const [sort, setSort] = useState<Sort>('popolari');
  const [open, setOpen] = useState<Cultivar | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return CULTIVARS.filter((c) => (types.length ? types.every((t) => c.tags.includes(t)) : true))
      .filter(
        (c) =>
          !query || `${c.name} ${c.lineage} ${c.aroma.join(' ')} ${c.terpenes.map((t) => t.name).join(' ')}`.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        if (sort === 'resa') return avg(b.yieldIndoor) - avg(a.yieldIndoor);
        if (sort === 'veloci') return avg(a.seedToHarvestDays ?? a.floweringDays) - avg(b.seedToHarvestDays ?? b.floweringDays);
        if (sort === 'facili') return a.difficulty - b.difficulty || b.community.successRate - a.community.successRate;
        return b.community.grows - a.community.grows;
      });
  }, [q, types, sort]);

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? [...prev.slice(1), id] : [...prev, id]));

  const totalGrows = CULTIVARS.reduce((a, c) => a + c.community.grows, 0);

  return (
    <>
      <Screen
        eyebrow="Catalogo genetiche"
        title="Genetiche"
        subtitle={`${CULTIVARS.length} varietà · parametri di coltivazione, terpeni e statistiche della community`}
      >
        <Enter i={1} className="mx-5 mt-5">
          <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/[0.05] px-3.5">
            <Search size={16} color="#8A9A93" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Cerca per nome, aroma o terpene…"
              placeholderTextColor="#56655F"
              className="ml-2.5 flex-1 py-3 font-inter text-[14px] text-[#ECF3EF]"
              style={{ outlineStyle: 'none' } as object}
            />
          </View>
        </Enter>
        <Enter i={2} className="mt-3">
          <ChipRow
            options={FILTERS.map((f) => ({
              ...f,
              color: TYPE_COLOR[f.value],
              count: CULTIVARS.filter((c) => c.tags.includes(f.value)).length,
            }))}
            selected={types}
            onToggle={(v) => setTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
          />
        </Enter>
        <Enter i={3} className="mx-5 mt-3">
          <Segmented
            value={sort}
            onChange={setSort}
            options={[
              { value: 'popolari', label: 'Popolari' },
              { value: 'resa', label: 'Resa' },
              { value: 'veloci', label: 'Veloci' },
              { value: 'facili', label: 'Facili' },
            ]}
          />
        </Enter>
        <Enter i={4} className="mx-5 mt-3 flex-row items-center">
          <Users size={12} color="#56655F" />
          <T className="ml-1.5 text-2xs text-[#56655F]">
            {list.length} risultati · {totalGrows.toLocaleString('it-IT')} coltivazioni registrate dalla community · tocca ⇄ per confrontare
          </T>
        </Enter>

        <View className="mx-5 mt-3 gap-3">
          {list.map((c, i) => (
            <Enter i={5 + Math.min(i, 8)} key={c.id}>
              <CultivarCard
                c={c}
                compareIndex={compare.indexOf(c.id)}
                onPress={() => setOpen(c)}
                onLongPress={() => {
                  tap();
                  toggleCompare(c.id);
                }}
              />
            </Enter>
          ))}
          {list.length === 0 && <T className="mt-8 text-center text-sm text-[#8A9A93]">Nessuna genetica corrisponde ai filtri.</T>}
        </View>
        <Disclaimer />
      </Screen>

      {compare.length > 0 && (
        <Animated.View
          entering={FadeInUp.springify().damping(18)}
          exiting={FadeOutDown}
          style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 84 }}
        >
          <Pressable
            onPress={() => {
              tap();
              if (compare.length >= 2) setCompareOpen(true);
            }}
            className="flex-row items-center rounded-2xl border border-white/15 bg-[#13201F] px-4 py-3 active:opacity-70 active:scale-[0.97]"
            style={{ shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 18, elevation: 12 }}
          >
            <GitCompareArrows size={18} color={C.leaf} />
            <View className="ml-3 flex-1">
              <T className="font-inter-sb text-[13px]">{compare.length >= 2 ? 'Confronta selezionate' : 'Seleziona almeno 2 genetiche'}</T>
              <T className="text-2xs text-[#8A9A93]" numberOfLines={1}>
                {compare.map((id) => CULTIVARS.find((c) => c.id === id)?.name).join(' · ')}
              </T>
            </View>
            <Pressable className="active:opacity-70 active:scale-[0.97]" onPress={() => setCompare([])} hitSlop={10}>
              <T className="font-inter-sb text-xs text-[#8A9A93]">Annulla</T>
            </Pressable>
          </Pressable>
        </Animated.View>
      )}

      <CultivarDrawer c={open} onClose={() => setOpen(null)} />
      <CompareDrawer ids={compare} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </>
  );
}

function CultivarCard({
  c,
  onPress,
  onLongPress,
  compareIndex,
}: {
  c: Cultivar;
  onPress: () => void;
  onLongPress: () => void;
  compareIndex: number;
}) {
  const color = TYPE_COLOR[c.dominance];
  const selected = compareIndex >= 0;
  const flower = c.seedToHarvestDays ?? c.floweringDays;
  return (
    <Pressable className="active:opacity-70 active:scale-[0.97]" onPress={onPress} onLongPress={onLongPress} delayLongPress={300}>
      <Glass className="p-4" style={selected ? { borderColor: COMPARE_COLORS[compareIndex], borderWidth: 1.5 } : undefined}>
        <View className="flex-row items-start">
          <View className="flex-1">
            <View className="flex-row flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <Badge key={t} color={TYPE_COLOR[t]}>
                  {strainById(t)?.name.replace(' (basso THC)', '')}
                </Badge>
              ))}
            </View>
            <T className="mt-2 font-grotesk-b text-[19px] tracking-[-0.3px]">{c.name}</T>
            <T className="text-xs text-[#8A9A93]" numberOfLines={1}>
              {c.lineage}
            </T>
          </View>
          <View className="items-end">
            <Radar
              axes={cultivarScores(c).map(() => '')}
              series={[{ label: c.id, color, values: cultivarScores(c).map((s) => s.value) }]}
              size={64}
            />
          </View>
        </View>

        <View className="mt-3 flex-row gap-3">
          <Stat
            label={c.tags.includes('cbd') ? 'CBD' : 'THC'}
            value={c.tags.includes('cbd') ? `${c.cbd[0]}–${c.cbd[1]}%` : `${c.thc[0]}–${c.thc[1]}%`}
          />
          <Stat
            label={c.seedToHarvestDays ? 'Seme→raccolta' : 'Fioritura'}
            value={`${Math.round(flower[0] / 7)}–${Math.round(flower[1] / 7)} sett.`}
          />
          <Stat label="Resa g/m²" value={`${c.yieldIndoor[0]}–${c.yieldIndoor[1]}`} />
        </View>

        <View className="mt-3 flex-row items-center justify-between border-t border-white/[0.05] pt-3">
          <View className="flex-row items-center gap-3">
            <Dots label="Difficoltà" value={c.difficulty} color={C.amber} />
            <Dots label="Anti-muffa" value={c.moldResistance} color={C.leaf} />
          </View>
          <View className="flex-row items-center gap-2">
            <TrendPill value={c.community.trend} label="sett." />
            <Pressable
              onPress={onLongPress}
              accessibilityLabel={`Confronta ${c.name}`}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70 active:scale-[0.97]"
              style={{
                borderColor: selected ? COMPARE_COLORS[compareIndex] : 'rgba(255,255,255,0.1)',
                backgroundColor: selected ? alpha(COMPARE_COLORS[compareIndex], 0.15) : 'rgba(255,255,255,0.04)',
              }}
            >
              <GitCompareArrows size={14} color={selected ? COMPARE_COLORS[compareIndex] : '#8A9A93'} />
            </Pressable>
          </View>
        </View>
      </Glass>
    </Pressable>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View className="flex-1 rounded-xl bg-white/[0.035] px-2.5 py-2">
      <T className="text-[9.5px] text-[#8A9A93]">{label}</T>
      <T className="mt-0.5 font-grotesk text-[13px]">
        {value}
        {unit && <T className="font-inter text-[9px] text-[#8A9A93]"> {unit}</T>}
      </T>
    </View>
  );
}

function Dots({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View>
      <T className="text-[9px] text-[#56655F]">{label}</T>
      <View className="mt-1 flex-row gap-[3px]">
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} className="h-1.5 w-3 rounded-full" style={{ backgroundColor: n <= value ? color : 'rgba(255,255,255,0.08)' }} />
        ))}
      </View>
    </View>
  );
}

function CultivarDrawer({ c, onClose }: { c: Cultivar | null; onClose: () => void }) {
  const [env, setEnv] = useState<'indoor' | 'outdoor'>('indoor');
  if (!c)
    return (
      <Drawer open={false} onClose={onClose} header={null}>
        {null}
      </Drawer>
    );
  const color = TYPE_COLOR[c.dominance];
  const scores = cultivarScores(c);
  const isCbd = c.tags.includes('cbd');
  const strain = strainById(c.tags.includes('autofiorente') ? 'autofiorente' : c.dominance);
  return (
    <Drawer
      open
      onClose={onClose}
      accent={color}
      header={
        <View>
          <View className="flex-row flex-wrap gap-1.5">
            {c.tags.map((t) => (
              <Badge key={t} color={TYPE_COLOR[t]} dot>
                {strainById(t)?.name}
              </Badge>
            ))}
          </View>
          <T className="mt-2 font-grotesk-b text-[28px] tracking-[-0.8px]">{c.name}</T>
          <T className="text-[13px] text-[#8A9A93]">{c.lineage}</T>
        </View>
      }
    >
      <View className="mx-5 flex-row gap-3">
        {[
          { label: 'Grow', value: c.community.grows.toLocaleString('it-IT'), trend: c.community.trend },
          { label: 'Successo', value: `${c.community.successRate}%`, trend: null },
          { label: 'Resa media', value: `${c.community.avgYield}`, unit: 'g/m²', trend: null },
        ].map((k) => (
          <Glass key={k.label} className="flex-1 p-3">
            <Eyebrow className="text-[9px]">{k.label}</Eyebrow>
            <T className="mt-1 font-grotesk-b text-lg">
              {k.value}
              {k.unit && <T className="font-inter text-[9px] text-[#8A9A93]"> {k.unit}</T>}
            </T>
            {k.trend !== null && <TrendPill value={k.trend} label="sett." />}
          </Glass>
        ))}
      </View>

      <Glass className="mx-5 mt-3 items-center p-4">
        <View className="w-full flex-row items-center justify-between">
          <Eyebrow>Profilo di coltivazione</Eyebrow>
          <T className="text-2xs text-[#56655F]">normalizzato sul catalogo</T>
        </View>
        <Radar axes={scores.map((s) => s.label)} series={[{ label: c.id, color, values: scores.map((s) => s.value) }]} size={268} />
      </Glass>

      <Glass className="mx-5 mt-3 p-4">
        <Eyebrow>Cannabinoidi</Eyebrow>
        <View className="mt-3">
          <View className="mb-1 flex-row justify-between">
            <T className="text-xs text-[#A9B6B0]">THC</T>
            <T className="font-inter-sb text-xs">
              {c.thc[0]}–{c.thc[1]}%
            </T>
          </View>
          <RangeBar scale={[0, 30]} ideal={c.thc} color={C.violet} />
          <View className="mb-1 mt-3 flex-row justify-between">
            <T className="text-xs text-[#A9B6B0]">CBD</T>
            <T className="font-inter-sb text-xs">
              {fmtPct(c.cbd[0])}–{fmtPct(c.cbd[1])}%
            </T>
          </View>
          <RangeBar scale={[0, isCbd ? 16 : 30]} ideal={c.cbd} color={C.leaf} />
        </View>
      </Glass>

      <Glass className="mx-5 mt-3 p-4">
        <Eyebrow>Profilo terpenico</Eyebrow>
        <View className="mt-3 flex-row items-center">
          <Donut segments={c.terpenes.map((t, i) => ({ value: t.share, color: TERP_COLORS[i] }))}>
            <T className="font-grotesk-b text-base">{c.terpenes[0].share}%</T>
            <T className="text-[9px] text-[#8A9A93]">{c.terpenes[0].name}</T>
          </Donut>
          <View className="ml-5 flex-1 gap-2">
            {c.terpenes.map((t, i) => (
              <View key={t.name} className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-sm" style={{ backgroundColor: TERP_COLORS[i] }} />
                <T className="flex-1 text-xs">
                  {t.name}
                  {t.note ? <T className="text-2xs text-[#56655F]"> · {t.note}</T> : null}
                </T>
                <T className="font-grotesk text-xs">{t.share}%</T>
              </View>
            ))}
          </View>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {c.aroma.map((a) => (
            <Badge key={a} tone="neutral">
              {a}
            </Badge>
          ))}
        </View>
      </Glass>

      <View className="mx-5 mt-5">
        <Segmented
          value={env}
          onChange={setEnv}
          options={[
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
          ]}
        />
      </View>
      <Glass className="mx-5 mt-3 px-4 py-1">
        {env === 'indoor' ? (
          <>
            <KeyValue label="Fioritura" value={`${c.floweringDays[0]}–${c.floweringDays[1]} giorni`} />
            {c.seedToHarvestDays && (
              <KeyValue label="Dal seme alla raccolta" value={`${c.seedToHarvestDays[0]}–${c.seedToHarvestDays[1]} giorni`} />
            )}
            <KeyValue label="Resa" value={`${c.yieldIndoor[0]}–${c.yieldIndoor[1]} g/m²`} accent={C.leaf} />
            <KeyValue label="Altezza" value={`${c.heightIndoor[0]}–${c.heightIndoor[1]} cm`} />
            <KeyValue label="Allungamento in fioritura" value={`×${fmtNum(c.stretch, 1)}`} />
            <KeyValue label="Resistenza parassiti" value={`${c.pestResistance}/5`} />
          </>
        ) : (
          <>
            <KeyValue label="Raccolta (Italia)" value={c.outdoorHarvest} accent={C.amber} />
            <KeyValue label="Resa per pianta" value={`${c.yieldOutdoor[0]}–${c.yieldOutdoor[1]} g`} accent={C.leaf} />
            <KeyValue label="Resistenza al freddo" value={`${c.coldTolerance}/5`} />
            <KeyValue label="Resistenza muffa" value={`${c.moldResistance}/5`} />
          </>
        )}
      </Glass>

      <Glass className="mx-5 mt-3 p-4">
        <Eyebrow>Consigli dei coltivatori</Eyebrow>
        <View className="mt-3">
          {c.growerNotes.map((n) => (
            <Bullet key={n} color={color}>
              {n}
            </Bullet>
          ))}
        </View>
        {strain && (
          <>
            <Divider className="my-3" />
            <Eyebrow>
              Regole per {strain.name.toLowerCase()} · {env}
            </Eyebrow>
            <View className="mt-3">
              {strain[env].tips.map((n) => (
                <Bullet key={n} color="#56655F">
                  {n}
                </Bullet>
              ))}
            </View>
          </>
        )}
      </Glass>
    </Drawer>
  );
}

function CompareDrawer({ ids, open, onClose }: { ids: string[]; open: boolean; onClose: () => void }) {
  const items = ids.map((id) => CULTIVARS.find((c) => c.id === id)!).filter(Boolean);
  if (items.length < 2)
    return (
      <Drawer open={false} onClose={onClose} header={null}>
        {null}
      </Drawer>
    );
  const axes = cultivarScores(items[0]).map((s) => s.label);
  const rows: { label: string; get: (c: Cultivar) => number; fmt: (c: Cultivar) => string; best: 'max' | 'min' }[] = [
    { label: 'Resa indoor', get: (c) => avg(c.yieldIndoor), fmt: (c) => `${c.yieldIndoor[0]}–${c.yieldIndoor[1]} g/m²`, best: 'max' },
    { label: 'Fioritura', get: (c) => avg(c.floweringDays), fmt: (c) => `${c.floweringDays[0]}–${c.floweringDays[1]} gg`, best: 'min' },
    { label: 'Altezza indoor', get: (c) => avg(c.heightIndoor), fmt: (c) => `${c.heightIndoor[0]}–${c.heightIndoor[1]} cm`, best: 'min' },
    { label: 'THC', get: (c) => avg(c.thc), fmt: (c) => `${c.thc[0]}–${c.thc[1]}%`, best: 'max' },
    { label: 'Difficoltà', get: (c) => c.difficulty, fmt: (c) => `${c.difficulty}/5`, best: 'min' },
    { label: 'Anti-muffa', get: (c) => c.moldResistance, fmt: (c) => `${c.moldResistance}/5`, best: 'max' },
    { label: 'Successo community', get: (c) => c.community.successRate, fmt: (c) => `${c.community.successRate}%`, best: 'max' },
  ];
  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <View>
          <Eyebrow>Confronto</Eyebrow>
          <T className="mt-1 font-grotesk-b text-[24px] tracking-[-0.6px]">{items.length} genetiche a confronto</T>
        </View>
      }
    >
      <Glass className="mx-5 items-center p-4">
        <Radar
          axes={axes}
          size={290}
          series={items.map((c, i) => ({ label: c.id, color: COMPARE_COLORS[i], values: cultivarScores(c).map((s) => s.value) }))}
        />
        <View className="mt-1 flex-row flex-wrap justify-center gap-3">
          {items.map((c, i) => (
            <View key={c.id} className="flex-row items-center">
              <View className="mr-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
              <T className="font-inter-sb text-xs">{c.name}</T>
            </View>
          ))}
        </View>
      </Glass>
      <Glass className="mx-5 mt-3 p-4">
        {rows.map((r, ri) => {
          const vals = items.map(r.get);
          const target = r.best === 'max' ? Math.max(...vals) : Math.min(...vals);
          const maxV = Math.max(...vals);
          return (
            <View key={r.label} className={cn(ri > 0 && 'mt-4')}>
              <Eyebrow>{r.label}</Eyebrow>
              <View className="mt-2 gap-1.5">
                {items.map((c, i) => {
                  const v = r.get(c);
                  const winner = v === target;
                  return (
                    <View key={c.id} className="flex-row items-center">
                      <View className="mr-2 h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <View
                          style={{
                            width: `${(v / maxV) * 100}%`,
                            height: '100%',
                            backgroundColor: alpha(COMPARE_COLORS[i], winner ? 1 : 0.5),
                            borderRadius: 4,
                          }}
                        />
                      </View>
                      <T
                        className={cn('w-[118px] text-right text-2xs', winner ? 'font-inter-b' : 'font-inter text-[#8A9A93]')}
                        style={winner ? { color: COMPARE_COLORS[i] } : undefined}
                      >
                        {r.fmt(c)}
                        {winner ? ' ★' : ''}
                      </T>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </Glass>
    </Drawer>
  );
}
