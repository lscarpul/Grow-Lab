import { Check, Search, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Ellipse, Line, Path, Rect } from 'react-native-svg';
import { Ring, StackBar } from '../components/charts';
import { Drawer } from '../components/Drawer';
import { Enter } from '../components/layout';
import { Badge, Bullet, ChipRow, cn, Eyebrow, Glass, T, tap } from '../components/ui';
import { PROBLEM_CATEGORIES, PROBLEMS } from '../data/problems';
import { Problem, ProblemCategory } from '../data/types';
import { alpha, C } from '../theme/tokens';

type Zone = 'cime' | 'nuove' | 'foglie' | 'basse' | 'radici' | 'tutta';

const ZONES: { id: Zone; label: string }[] = [
  { id: 'cime', label: 'Cime' },
  { id: 'nuove', label: 'Foglie nuove' },
  { id: 'foglie', label: 'Foglie (superficie/retro)' },
  { id: 'basse', label: 'Foglie basse e medie' },
  { id: 'radici', label: 'Radici e substrato' },
  { id: 'tutta', label: 'Tutta la pianta' },
];

export const CAT_COLOR: Record<ProblemCategory, string> = {
  Carenze: C.amber,
  'Eccessi e stress': C.sky,
  Parassiti: C.rose,
  'Muffe e malattie': C.violet,
};

const URGENT = new Set(['botrite', 'marciume-radicale', 'ragnetto-rosso', 'bruchi', 'ermafroditismo', 'blocco-ph']);

export function zoneOf(p: Problem): Zone {
  const w = p.where.toLowerCase();
  if (w.includes('cime')) return 'cime';
  if (w.includes('nuove') || w.includes('in cima')) return 'nuove';
  if (w.includes('radici') || w.includes('substrato')) return 'radici';
  if (w.includes('tutta')) return 'tutta';
  if (w.includes('basse') || w.includes('vecchie') || w.includes('medie')) return 'basse';
  return 'foglie';
}

/** Symptom finder: search, plant zone map and category filters over the problem catalog. Rendered inside the Tools screen. */
export function SymptomFinder() {
  const [q, setQ] = useState('');
  const [cats, setCats] = useState<ProblemCategory[]>([]);
  const [zone, setZone] = useState<Zone | null>(null);
  const [open, setOpen] = useState<Problem | null>(null);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PROBLEMS.filter((p) => (cats.length ? cats.includes(p.category) : true))
      .filter((p) => (zone ? zoneOf(p) === zone : true))
      .filter((p) => !query || `${p.name} ${p.symptoms.join(' ')} ${p.where}`.toLowerCase().includes(query));
  }, [q, cats, zone]);

  return (
    <>
      <Enter i={1} className="mx-5 mt-5">
        <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/[0.05] px-3.5">
          <Search size={16} color="#8A9A93" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Es. punte bruciate, macchie, ragnatele…"
            placeholderTextColor="#56655F"
            className="ml-2.5 flex-1 py-3 font-inter text-[14px] text-[#ECF3EF]"
            style={{ outlineStyle: 'none' } as object}
          />
        </View>
      </Enter>

      {/* Zone map */}
      <Enter i={2} className="mx-5 mt-3">
        <Glass className="flex-row p-4">
          <View>
            <PlantMap zone={zone} />
          </View>
          <View className="ml-4 flex-1 justify-center gap-1.5">
            <Eyebrow className="mb-1">Dove vedi il sintomo?</Eyebrow>
            {ZONES.map((z) => {
              const n = PROBLEMS.filter((p) => zoneOf(p) === z.id).length;
              const active = zone === z.id;
              return (
                <Pressable
                  key={z.id}
                  onPress={() => {
                    tap();
                    setZone(active ? null : z.id);
                  }}
                  className={cn(
                    'flex-row items-center justify-between rounded-xl px-3 py-2',
                    active ? 'bg-[#34D88A]/15' : 'bg-white/[0.03]',
                  )}
                  style={{ borderWidth: 1, borderColor: active ? alpha(C.leaf, 0.45) : 'rgba(255,255,255,0.05)' }}
                >
                  <T className={cn('flex-1 text-xs', active ? 'font-inter-sb' : 'text-[#A9B6B0]')} numberOfLines={1}>
                    {z.label}
                  </T>
                  <T className="ml-2 font-grotesk-md text-2xs" style={{ color: active ? C.leaf : '#56655F' }}>
                    {n}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </Glass>
      </Enter>

      <Enter i={3} className="mt-3">
        <ChipRow
          options={PROBLEM_CATEGORIES.map((c) => ({
            value: c,
            label: c,
            color: CAT_COLOR[c],
            count: PROBLEMS.filter((p) => p.category === c).length,
          }))}
          selected={cats}
          onToggle={(v) => setCats((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
        />
      </Enter>

      <Enter i={4} className="mx-5 mt-4">
        <StackBar
          parts={PROBLEM_CATEGORIES.map((c) => ({ value: list.filter((p) => p.category === c).length, color: CAT_COLOR[c] }))}
          height={6}
        />
        <T className="mt-2 text-2xs text-[#56655F]">
          {list.length} problemi su {PROBLEMS.length}
          {zone ? ` · zona: ${ZONES.find((z) => z.id === zone)?.label.toLowerCase()}` : ''}
        </T>
      </Enter>

      <View className="mx-5 mt-3 gap-2.5">
        {list.map((p, i) => {
          const color = CAT_COLOR[p.category];
          return (
            <Enter i={5 + Math.min(i, 8)} key={p.id}>
              <Pressable onPress={() => setOpen(p)}>
                <Glass className="flex-row p-4">
                  <View className="mr-3.5 w-1 rounded-full" style={{ backgroundColor: color }} />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Badge color={color}>{p.category}</Badge>
                      {URGENT.has(p.id) && (
                        <Badge tone="rose" dot>
                          Intervieni subito
                        </Badge>
                      )}
                    </View>
                    <T className="mt-2 font-grotesk-b text-[16px]">{p.name}</T>
                    <T className="mt-0.5 text-2xs text-[#8A9A93]">{p.where}</T>
                    <T className="mt-1.5 text-xs leading-[17px] text-[#B7C3BE]" numberOfLines={2}>
                      {p.symptoms[0]}
                    </T>
                  </View>
                </Glass>
              </Pressable>
            </Enter>
          );
        })}
        {list.length === 0 && (
          <T className="mt-8 text-center text-sm text-[#8A9A93]">Nessun problema corrisponde. Prova a togliere un filtro.</T>
        )}
      </View>
      <ProblemDrawer problem={open} onClose={() => setOpen(null)} />
    </>
  );
}

function PlantMap({ zone }: { zone: Zone | null }) {
  const band: Record<Zone, [number, number]> = {
    cime: [6, 40],
    nuove: [40, 72],
    foglie: [72, 112],
    basse: [112, 150],
    radici: [168, 206],
    tutta: [6, 206],
  };
  const hl = zone ? band[zone] : null;
  const leaf = (x: number, y: number, rot: number, s = 1) => (
    <Ellipse cx={x} cy={y} rx={16 * s} ry={5.5 * s} fill={alpha(C.leaf, 0.55)} transform={`rotate(${rot} ${x} ${y})`} />
  );
  return (
    <Svg width={96} height={212}>
      {hl && (
        <Rect
          x={0}
          y={hl[0]}
          width={96}
          height={hl[1] - hl[0]}
          rx={10}
          fill={alpha(C.leaf, 0.12)}
          stroke={alpha(C.leaf, 0.5)}
          strokeWidth={1}
        />
      )}
      {/* buds */}
      <Ellipse cx={48} cy={22} rx={8} ry={14} fill={alpha(C.violet, 0.75)} />
      <Ellipse cx={34} cy={34} rx={5} ry={9} fill={alpha(C.violet, 0.55)} />
      <Ellipse cx={62} cy={34} rx={5} ry={9} fill={alpha(C.violet, 0.55)} />
      <Line x1={48} y1={30} x2={48} y2={158} stroke={C.leaf} strokeWidth={3} strokeLinecap="round" />
      {leaf(34, 56, -25, 0.8)}
      {leaf(62, 56, 25, 0.8)}
      {leaf(30, 90, -18)}
      {leaf(66, 90, 18)}
      {leaf(26, 128, -12, 1.2)}
      {leaf(70, 128, 12, 1.2)}
      <Line x1={10} y1={160} x2={86} y2={160} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      <Path
        d="M48 160 C44 175 36 185 28 198 M48 160 C52 176 60 186 70 200 M48 160 L48 204"
        stroke={alpha(C.amber, 0.6)}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ProblemDrawer({ problem: p, onClose }: { problem: Problem | null; onClose: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  if (!p)
    return (
      <Drawer open={false} onClose={onClose} header={null}>
        {null}
      </Drawer>
    );
  const color = CAT_COLOR[p.category];
  const match = p.symptoms.length ? checked.filter((c) => p.symptoms.includes(c)).length / p.symptoms.length : 0;
  return (
    <Drawer
      open
      onClose={() => {
        setChecked([]);
        onClose();
      }}
      accent={color}
      header={
        <View>
          <View className="flex-row gap-1.5">
            <Badge color={color} dot>
              {p.category}
            </Badge>
            {URGENT.has(p.id) && <Badge tone="rose">Urgente</Badge>}
          </View>
          <T className="mt-2 font-grotesk-b text-[26px] tracking-[-0.6px]">{p.name}</T>
          <T className="text-[13px] text-[#8A9A93]">Dove: {p.where}</T>
        </View>
      }
    >
      <Glass className="mx-5 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Eyebrow>Verifica i sintomi</Eyebrow>
            <T className="mt-1 text-xs text-[#8A9A93]">Spunta quelli che vedi sulla tua pianta</T>
          </View>
          <Ring value={match} size={58} stroke={6} color={color} color2={C.lime}>
            <T className="font-grotesk-b text-[13px]">{Math.round(match * 100)}%</T>
          </Ring>
        </View>
        <View className="mt-3 gap-2">
          {p.symptoms.map((s) => {
            const on = checked.includes(s);
            return (
              <Pressable
                key={s}
                onPress={() => {
                  tap();
                  setChecked((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]));
                }}
                className="flex-row items-start rounded-xl p-3"
                style={{
                  backgroundColor: on ? alpha(color, 0.1) : 'rgba(255,255,255,0.03)',
                  borderWidth: 1,
                  borderColor: on ? alpha(color, 0.4) : 'rgba(255,255,255,0.05)',
                }}
              >
                <View
                  className="mr-3 mt-0.5 h-[18px] w-[18px] items-center justify-center rounded-md border"
                  style={{ borderColor: on ? color : 'rgba(255,255,255,0.2)', backgroundColor: on ? color : 'transparent' }}
                >
                  {on && <Check size={12} color="#05080A" strokeWidth={3} />}
                </View>
                <T className="flex-1 text-[13px] leading-[19px]">{s}</T>
              </Pressable>
            );
          })}
        </View>
        {match >= 0.66 && (
          <T className="mt-3 font-inter-sb text-xs" style={{ color }}>
            Alta corrispondenza: segui le soluzioni qui sotto.
          </T>
        )}
      </Glass>

      <Glass className="mx-5 mt-3 p-4">
        <Eyebrow>Cause probabili</Eyebrow>
        <View className="mt-3">
          {p.causes.map((c) => (
            <Bullet key={c} color={C.amber}>
              {c}
            </Bullet>
          ))}
        </View>
      </Glass>

      <View className="mx-5 mt-5">
        <Eyebrow>Soluzioni</Eyebrow>
        <View className="mt-3 gap-2.5">
          {p.solutions.map((s, i) => (
            <View key={s} className="flex-row rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5">
              <View className="mr-3 h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: alpha(C.leaf, 0.16) }}>
                <T className="font-grotesk-b text-xs text-[#34D88A]">{i + 1}</T>
              </View>
              <T className="flex-1 text-[13px] leading-5 text-[#C9D4CF]">{s}</T>
            </View>
          ))}
        </View>
      </View>

      <View
        className="mx-5 mt-4 rounded-[22px] p-4"
        style={{ backgroundColor: alpha(C.leaf, 0.07), borderWidth: 1, borderColor: alpha(C.leaf, 0.2) }}
      >
        <View className="flex-row items-center">
          <ShieldCheck size={14} color={C.leaf} />
          <Eyebrow className="ml-2 text-[#34D88A]">Prevenzione</Eyebrow>
        </View>
        <View className="mt-3">
          {p.prevention.map((s) => (
            <Bullet key={s}>{s}</Bullet>
          ))}
        </View>
      </View>
    </Drawer>
  );
}
