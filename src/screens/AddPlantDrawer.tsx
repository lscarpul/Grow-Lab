import { Sprout } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Drawer } from '../components/Drawer';
import { Badge, Button, cn, Eyebrow, Glass, Segmented, Stepper, T, tap } from '../components/ui';
import { CULTIVARS, cultivarById, GENERIC_CULTIVARS } from '../data/cultivars';
import { Plant } from '../data/grows';
import { SPACES } from '../data/kit';
import { STAGE_ORDER } from '../data/ranges';
import { stageById } from '../data/stages';
import { Environment, StageId } from '../data/types';
import { estimateHarvest, stageLength } from '../lib/insights';
import { addDays, DAY, fmtDate } from '../lib/math';
import { useStore } from '../state/store';
import { alpha, C, STAGE_COLOR } from '../theme/tokens';

const LIVING: StageId[] = STAGE_ORDER.slice(0, 4);
const MEDIA: Plant['medium'][] = ['Terra', 'Cocco', 'Idroponica', 'Terra piena'];

/** Builds a plausible stage timeline from the sowing date and the start of the current stage. */
function interpolateTimeline(stage: StageId, sow: Date, stageStart: Date, cultivarId: string) {
  const cultivar = cultivarById(cultivarId);
  const before = LIVING.slice(0, LIVING.indexOf(stage));
  const weights = before.map((s) => {
    const [lo, hi] = stageLength(s, cultivar);
    return (lo + hi) / 2;
  });
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const span = Math.max(0, stageStart.getTime() - sow.getTime());
  let t = sow.getTime();
  const out = before.map((s, i) => {
    const entry = { stage: s, start: new Date(t).toISOString() };
    t += (weights[i] / total) * span;
    return entry;
  });
  return [...out, { stage, start: stageStart.toISOString() }];
}

export function AddPlantDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPlant, kit } = useStore();
  const [name, setName] = useState('');
  const [cultivarId, setCultivarId] = useState('generica-foto');
  const [env, setEnv] = useState<Environment>('indoor');
  const [medium, setMedium] = useState<Plant['medium']>('Terra');
  const [potL, setPotL] = useState(18);
  const [space, setSpace] = useState(SPACES.find((s) => s.id === kit.space)?.label ?? 'Tenda 80×80×180');
  const [stage, setStage] = useState<StageId>('germinazione');
  const [sinceSow, setSinceSow] = useState(0);
  const [inStage, setInStage] = useState(0);

  const cultivar = cultivarById(cultivarId);
  const auto = cultivar?.tags.includes('autofiorente');
  const spaces = SPACES.filter((s) => s.indoor === (env === 'indoor'));
  const today = new Date();
  const sow = addDays(today, -sinceSow);
  const stageStart = addDays(today, -Math.min(inStage, sinceSow));
  const harvest = useMemo(() => estimateHarvest(stage, stageStart, cultivarId), [stage, stageStart.getTime(), cultivarId]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setName('');
    setStage('germinazione');
    setSinceSow(0);
    setInStage(0);
  };
  const save = () => {
    const nickname = name.trim() || `${cultivar?.name ?? 'Pianta'} #${Math.floor(Math.random() * 90 + 10)}`;
    addPlant({
      nickname,
      cultivarId,
      env,
      medium,
      potL: medium === 'Terra piena' ? null : potL,
      space,
      light: env === 'indoor' ? 'LED' : 'Sole',
      photoperiod: env === 'outdoor' ? 'Naturale' : auto ? '20/4' : stage === 'fioritura' ? '12/12' : '18/6',
      sowDate: sow.toISOString(),
      timeline: interpolateTimeline(stage, sow, stageStart, cultivarId),
    });
    reset();
    onClose();
  };

  const cultivars = [...GENERIC_CULTIVARS, ...CULTIVARS];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      accent={C.leaf}
      header={
        <View>
          <Badge tone="leaf" dot>
            Nuova pianta
          </Badge>
          <T className="mt-2 font-grotesk-b text-[26px] tracking-[-0.6px]">Aggiungi al diario</T>
          <T className="text-[13px] text-[#8A9A93]">Bastano genetica e fase: le misure le aggiungi dopo.</T>
        </View>
      }
    >
      <View className="px-5">
        <Eyebrow>Nome</Eyebrow>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Es. Gorilla balcone"
          placeholderTextColor="#56655F"
          className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-inter text-[15px] text-[#ECF3EF]"
        />

        <Eyebrow className="mt-5">Genetica</Eyebrow>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 8 }}
      >
        {cultivars.map((c) => {
          const active = c.id === cultivarId;
          const isAuto = c.tags.includes('autofiorente');
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                tap();
                setCultivarId(c.id);
                if (isAuto) setPotL(11);
              }}
              className={cn(
                'w-[132px] rounded-2xl border p-3',
                active ? 'border-[#34D88A]/50 bg-[#34D88A]/[0.12]' : 'border-white/[0.08] bg-white/[0.03]',
              )}
            >
              <T className="font-inter-sb text-[13px]" numberOfLines={1}>
                {c.name}
              </T>
              <T className="mt-0.5 text-2xs text-[#8A9A93]">
                {isAuto ? 'Autofiorente' : 'Fotoperiodica'} · {c.dominance}
              </T>
              <T className="mt-1 text-2xs text-[#56655F]">
                Fioritura {c.floweringDays[0]}–{c.floweringDays[1]} gg
              </T>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="px-5">
        <Eyebrow className="mt-5">Dove cresce</Eyebrow>
        <Segmented
          className="mt-2"
          value={env}
          onChange={(v) => {
            setEnv(v);
            setSpace(SPACES.find((s) => s.indoor === (v === 'indoor'))!.label);
            if (v === 'outdoor' && medium === 'Cocco') setMedium('Terra');
          }}
          options={[
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
          ]}
        />
        <View className="mt-3 flex-row flex-wrap gap-2">
          {spaces.map((s) => (
            <Chip key={s.id} label={s.label} active={space === s.label} onPress={() => setSpace(s.label)} />
          ))}
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {MEDIA.filter((m) => (env === 'indoor' ? m !== 'Terra piena' : m !== 'Idroponica')).map((m) => (
            <Chip key={m} label={m} active={medium === m} onPress={() => setMedium(m)} color={C.amber} />
          ))}
        </View>
        {medium !== 'Terra piena' && (
          <Stepper className="mt-3" label="Volume vaso" value={potL} onChange={setPotL} step={1} min={1} max={200} unit="L" />
        )}

        <Eyebrow className="mt-5">Fase attuale</Eyebrow>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {LIVING.map((s) => (
            <Chip
              key={s}
              label={stageById(s)?.name ?? s}
              active={stage === s}
              color={STAGE_COLOR[s]}
              onPress={() => {
                setStage(s);
                if (s === 'germinazione') {
                  setSinceSow(0);
                  setInStage(0);
                }
              }}
            />
          ))}
        </View>
        <View className="mt-3 flex-row gap-2">
          <Stepper
            className="flex-1"
            label="Giorni dalla semina"
            value={sinceSow}
            onChange={(v) => setSinceSow(Math.max(v, inStage))}
            min={0}
            max={300}
          />
          <Stepper
            className="flex-1"
            label="Giorni in questa fase"
            value={Math.min(inStage, sinceSow)}
            onChange={(v) => setInStage(Math.min(v, sinceSow))}
            min={0}
            max={200}
            color={STAGE_COLOR[stage]}
          />
        </View>

        <Glass className="mt-5 p-4" glow={STAGE_COLOR[stage]}>
          <View className="flex-row items-center">
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: alpha(STAGE_COLOR[stage], 0.15) }}
            >
              <Sprout size={18} color={STAGE_COLOR[stage]} />
            </View>
            <View className="ml-3 flex-1">
              <T className="font-inter-sb text-[13px]">
                Semina {fmtDate(sow)} · {stageById(stage)?.name} dal {fmtDate(stageStart)}
              </T>
              <T className="mt-0.5 text-xs text-[#8A9A93]">
                {harvest
                  ? `Raccolta stimata ${fmtDate(harvest)} (tra ${Math.max(0, Math.round((harvest.getTime() - today.getTime()) / DAY))} giorni)`
                  : 'Raccolta non stimabile'}
              </T>
            </View>
          </View>
        </Glass>

        <Button className="mt-5" label="Aggiungi pianta" onPress={save} />
      </View>
    </Drawer>
  );
}

function Chip({ label, active, onPress, color = C.leaf }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      className="rounded-full px-3.5 py-2"
      style={{
        backgroundColor: active ? alpha(color, 0.16) : 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: active ? alpha(color, 0.45) : 'rgba(255,255,255,0.08)',
      }}
    >
      <T className={cn('text-xs', active ? 'font-inter-sb' : 'font-inter-md')} style={{ color: active ? '#F4FBF7' : '#A9B6B0' }}>
        {label}
      </T>
    </Pressable>
  );
}
