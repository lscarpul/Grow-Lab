import { ArrowRight, Check, ChevronLeft, Dna, FlaskConical, Lightbulb, LogIn, Ruler, Sprout, Tent, Wind } from 'lucide-react-native';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusScrim } from '../components/layout';
import { Badge, Button, cn, Eyebrow, Glass, LevelScale, Segmented, Stepper, T, tap, ToggleRow } from '../components/ui';
import { CULTIVARS, Cultivar, GENERIC_CULTIVARS } from '../data/cultivars';
import { Plant } from '../data/grows';
import { Budget, buildKit, itemTotal, KitCategory, KitConfig, KitItem, kitStats, Medium, SPACES, SpaceId } from '../data/kit';
import { LEVEL_RANK, NUTRIENT_LINES, nutrientById, nutrientCost, PACK_LABEL, PackId, SUBSTRATE_DEMAND } from '../data/nutrients';
import { fmtEur } from '../data/shop';
import { yieldLevel } from '../lib/growplan';
import { NewPlant, useStore } from '../state/store';
import { alpha, C } from '../theme/tokens';

/* ───────────── Setup helpers ───────────── */

// What "the environment" costs: the box, the light and the air, not pots, nutrients or tools.
const SETUP_CATEGORIES: KitCategory[] = ['Spazio', 'Luce', 'Aria e clima', 'Protezione'];
const setupItems = (c: KitConfig) => buildKit(c).filter((i) => SETUP_CATEGORIES.includes(i.category));
const sum = (items: KitItem[]) => Math.round(items.reduce((a, i) => a + itemTotal(i), 0));

const PRESETS: { id: Budget; label: string; tagline: string; color: string }[] = [
  { id: 'base', label: 'Base', tagline: 'Per iniziare spendendo poco', color: C.sky },
  { id: 'medio', label: 'Medio', tagline: 'Il miglior rapporto qualità/prezzo', color: C.leaf },
  { id: 'pro', label: 'Pro', tagline: 'Silenzioso, efficiente, più resa', color: C.violet },
];

/** Plants that fit comfortably, below the hard maximum of the space. */
const SUGGESTED: Record<SpaceId, number> = { tenda60: 1, tenda80: 2, tenda100: 4, tenda120: 4, balcone: 3, giardino: 3 };

/** Room for the plant itself: tent height minus pot (~30 cm) and lamp with its hanging distance (~40 cm). */
const usableHeight = (space: SpaceId) => {
  const s = SPACES.find((x) => x.id === space)!;
  return s.dims ? s.dims[2] - 70 : null;
};

type Option = { id: string; label: string; caption: string };
const optionalItems = (space: SpaceId): Option[] =>
  SPACES.find((s) => s.id === space)!.indoor
    ? [
        {
          id: 'filtro',
          label: 'Filtro a carboni attivi',
          caption: "Sì se l'odore può dare fastidio (casa, vicini). Senza, in fioritura la stanza profuma molto.",
        },
        {
          id: 'deumidificatore',
          label: 'Deumidificatore',
          caption: 'Sì se la stanza supera spesso il 55–60% di umidità: in fioritura previene la muffa.',
        },
      ]
    : [{ id: 'rete', label: 'Rete antiuccelli / antigrandine', caption: 'Sì se la zona ha uccelli o grandinate frequenti.' }];

const isOn = (c: KitConfig, id: string) =>
  id === 'deumidificatore' ? buildKit(c).some((i) => i.id === 'deumidificatore') : !c.skip?.includes(id);

const withOption = (c: KitConfig, id: string, on: boolean): KitConfig => {
  if (id === 'deumidificatore') return { ...c, dehumidifier: on };
  const skip = (c.skip ?? []).filter((x) => x !== id);
  return { ...c, skip: on ? skip : [...skip, id] };
};

const isAuto = (c: Cultivar) => c.tags.includes('autofiorente');
const DIFFICULTY = ['Facilissima', 'Facile', 'Media', 'Impegnativa', 'Difficile'];

const plantMedium = (c: KitConfig): Plant['medium'] => (c.space === 'giardino' ? 'Terra piena' : c.medium === 'cocco' ? 'Cocco' : 'Terra');

/** One diary entry per plant, all starting from germination today. */
function plantsFor(c: KitConfig, cultivar: Cultivar): NewPlant[] {
  const space = SPACES.find((s) => s.id === c.space)!;
  const now = new Date().toISOString();
  const auto = isAuto(cultivar);
  return Array.from({ length: c.plants }, (_, i) => ({
    nickname: `${cultivar.id.startsWith('generica') ? 'Pianta' : cultivar.name}${c.plants > 1 ? ` #${i + 1}` : ''}`,
    cultivarId: cultivar.id,
    env: space.indoor ? 'indoor' : 'outdoor',
    medium: plantMedium(c),
    potL: c.space === 'giardino' ? null : kitStats(c).potL,
    space: space.label,
    light: space.indoor ? 'LED' : 'Sole',
    photoperiod: !space.indoor ? 'Naturale' : auto ? '20/4' : '18/6',
    sowDate: now,
    timeline: [{ stage: 'germinazione', start: now }],
  }));
}

/* ───────────── Flow ───────────── */

type Step = 0 | 1 | 2 | 3;
const STEPS = [
  { title: 'Il tuo spazio', Icon: Tent },
  { title: 'La genetica', Icon: Dna },
  { title: 'Substrato e nutrienti', Icon: FlaskConical },
];

/** First launch: welcome, then a 3-step guided setup (space → strain → substrate & nutrients) before the dashboard. */
export function Onboarding() {
  const { kit, finishOnboarding, userPlantCount } = useStore();
  const [step, setStep] = useState<Step>(0);
  const dir = useRef(1);
  const go = (s: Step) => {
    dir.current = s >= step ? 1 : -1;
    setStep(s);
  };
  const [draft, setDraft] = useState<KitConfig>(() => ({
    ...kit,
    plants: SUGGESTED[kit.space],
    nutrient: kit.nutrient ?? { line: 'biobizz', pack: 'parziale' },
  }));
  const [cultivarId, setCultivarId] = useState<string | null>(kit.cultivarId ?? null);
  const cultivar = [...GENERIC_CULTIVARS, ...CULTIVARS].find((c) => c.id === cultivarId);
  const update = (patch: Partial<KitConfig>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      go((step - 1) as Step);
      return true;
    });
    return () => sub.remove();
  });

  const finish = () => {
    if (!cultivar) return;
    const config: KitConfig = { ...draft, cultivarId: cultivar.id, kind: isAuto(cultivar) ? 'auto' : 'foto' };
    finishOnboarding(config, plantsFor(config, cultivar));
  };

  return (
    <Animated.View key={step} entering={(dir.current > 0 ? FadeInRight : FadeInLeft).duration(260)} style={{ flex: 1 }}>
      {step === 0 ? (
        <Welcome onStart={() => go(1)} returning={userPlantCount > 0} />
      ) : (
        <StepFrame
          step={step}
          onBack={() => go((step - 1) as Step)}
          footer={
            step === 1 ? (
              <Footer
                label="Allestimento ambiente"
                value={fmtEur(sum(setupItems(draft)))}
                cta="Avanti: la genetica"
                onPress={() => go(2)}
              />
            ) : step === 2 ? (
              <Footer
                label={`${draft.plants} ${draft.plants === 1 ? 'pianta' : 'piante'}`}
                value={cultivar?.name ?? 'Scegli una genetica'}
                cta="Avanti: substrato"
                onPress={() => go(3)}
                disabled={!cultivar}
              />
            ) : (
              <Footer
                label="Nutrienti per il ciclo"
                value={draft.nutrient ? fmtEur(nutrientTotal(draft)) : 'Da scegliere'}
                cta="Entra in Grow Lab"
                onPress={finish}
                disabled={!draft.nutrient}
              />
            )
          }
        >
          {step === 1 && <SpaceStep draft={draft} update={update} />}
          {step === 2 && <StrainStep draft={draft} update={update} cultivarId={cultivarId} setCultivarId={setCultivarId} />}
          {step === 3 && <SubstrateStep draft={draft} update={update} />}
        </StepFrame>
      )}
    </Animated.View>
  );
}

const nutrientTotal = (c: KitConfig) => {
  const line = nutrientById(c.nutrient?.line);
  return line && c.nutrient ? Math.round(nutrientCost(line, c.nutrient.pack, c.medium, c.plants).total) : 0;
};

/* ───────────── Welcome ───────────── */

function Welcome({ onStart, returning }: { onStart: () => void; returning: boolean }) {
  const insets = useSafeAreaInsets();
  const [login, setLogin] = useState(false);
  return (
    <View className="flex-1 justify-between px-6" style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}>
      <View className="items-center">
        <Image source={require('../../assets/icon.png')} style={{ width: 96, height: 96, borderRadius: 26 }} />
        <T className="mt-6 font-grotesk-b text-[38px] tracking-[-1.2px]">Grow Lab</T>
        <T className="mt-2 text-center text-[15px] leading-[22px] text-[#C9D4CF]">
          {returning
            ? 'Configura una nuova coltivazione: le piante che hai già restano nel diario.'
            : 'Dalla tenda al barattolo, un passo alla volta.'}
        </T>
      </View>

      <View>
        <Eyebrow className="mb-3 text-center">In tre passi</Eyebrow>
        <View className="gap-2.5">
          {STEPS.map((s, i) => (
            <View key={s.title} className="flex-row items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#34D88A]/15">
                <s.Icon size={17} color={C.leaf} />
              </View>
              <T className="ml-3 flex-1 font-inter-sb text-[14px]">
                {i + 1}. {s.title}
              </T>
            </View>
          ))}
        </View>
        <T className="mt-3 text-center text-xs leading-[17px] text-[#8A9A93]">
          Poi entri nella tua dashboard, con solo le tue piante e il tuo setup.
        </T>
      </View>

      <View>
        <Button label="Inizia una nuova coltivazione" icon={<Sprout size={16} color="#05080A" />} onPress={onStart} />
        <Button
          className="mt-3"
          tone="ghost"
          color="#C9D4CF"
          label="Ho già un account · Accedi"
          icon={<LogIn size={16} color="#C9D4CF" />}
          onPress={() => setLogin((v) => !v)}
        />
        {login && (
          <Glass className="mt-3 p-4">
            <T className="font-inter-sb text-[13px]">Gli account arrivano presto</T>
            <T className="mt-1 text-xs leading-[17px] text-[#8A9A93]">
              Potrai ritrovare piante e setup su un altro telefono. Per ora i dati restano su questo dispositivo: inizia una nuova
              coltivazione per configurare l'app.
            </T>
          </Glass>
        )}
      </View>
    </View>
  );
}

/* ───────────── Step chrome ───────────── */

function StepFrame({ step, onBack, footer, children }: { step: 1 | 2 | 3; onBack: () => void; footer: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const s = STEPS[step - 1];
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 130 }}
      >
        <View className="flex-row items-center px-5">
          <Pressable
            accessibilityLabel="Indietro"
            onPress={() => {
              tap();
              onBack();
            }}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] active:scale-[0.97] active:opacity-70"
          >
            <ChevronLeft size={20} color="#C9D4CF" />
          </Pressable>
          <View className="ml-3 flex-1 flex-row gap-1.5">
            {STEPS.map((x, i) => (
              <View
                key={x.title}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: i < step ? C.leaf : 'rgba(255,255,255,0.10)' }}
              />
            ))}
          </View>
        </View>
        <View className="mt-5 px-5">
          <Eyebrow>Passo {step} di 3</Eyebrow>
          <T className="mt-1 font-grotesk-b text-[30px] leading-[34px] tracking-[-1px]">{s.title}</T>
        </View>
        {children}
      </ScrollView>
      <StatusScrim height={insets.top} />
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-white/[0.08] bg-[#05080A] px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {footer}
      </View>
    </View>
  );
}

function Footer({
  label,
  value,
  cta,
  onPress,
  disabled,
}: {
  label: string;
  value: string;
  cta: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center">
      <View className="flex-1 pr-3">
        <T className="text-2xs text-[#8A9A93]">{label}</T>
        <T className={cn('font-grotesk-b', value.length > 14 ? 'text-[15px]' : 'text-[19px]')} numberOfLines={1}>
          {value}
        </T>
      </View>
      <Button label={cta} icon={<ArrowRight size={16} color="#05080A" />} onPress={onPress} disabled={disabled} />
    </View>
  );
}

function Choice({
  active,
  onPress,
  color = C.leaf,
  className,
  children,
}: {
  active: boolean;
  onPress: () => void;
  color?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      className={cn('rounded-2xl p-3.5 active:scale-[0.98] active:opacity-80', className)}
      style={{
        backgroundColor: active ? alpha(color, 0.12) : 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: active ? alpha(color, 0.5) : 'rgba(255,255,255,0.08)',
      }}
    >
      {children}
      {active && (
        <View className="absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
          <Check size={12} color="#05080A" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

/* ───────────── Step 1: space ───────────── */

function SpaceStep({ draft, update }: { draft: KitConfig; update: (p: Partial<KitConfig>) => void }) {
  const space = SPACES.find((s) => s.id === draft.space)!;
  const env = space.indoor ? 'indoor' : 'outdoor';
  const stats = kitStats(draft);
  const items = setupItems(draft);
  const height = usableHeight(draft.space);
  const setSpace = (id: SpaceId) => {
    const s = SPACES.find((x) => x.id === id)!;
    // A new space resets the lamp choice and proposes the plant count that fits it.
    update({ space: id, ledW: undefined, plants: SUGGESTED[id], medium: !s.indoor && draft.medium === 'cocco' ? 'terra' : draft.medium });
  };

  return (
    <View className="px-5">
      <T className="mt-1.5 text-[13px] leading-[19px] text-[#8A9A93]">
        Scegli dove coltivi e il livello dell'attrezzatura: calcoliamo luce, aerazione e quanto spendi.
      </T>

      <Segmented
        className="mt-5"
        value={env}
        onChange={(v) => setSpace(v === 'indoor' ? 'tenda80' : 'balcone')}
        options={[
          { value: 'indoor', label: 'Indoor (growbox)' },
          { value: 'outdoor', label: 'Outdoor' },
        ]}
      />
      <View className="mt-3 flex-row flex-wrap gap-2">
        {SPACES.filter((s) => s.indoor === space.indoor).map((s) => (
          <Choice key={s.id} active={s.id === draft.space} onPress={() => setSpace(s.id)} className="w-[48.5%]">
            <T className="font-grotesk text-[17px]">{s.short}</T>
            <T className="mt-0.5 text-2xs text-[#8A9A93]">
              {s.dims ? `${((s.dims[0] * s.dims[1]) / 10000).toFixed(2).replace('.', ',')} m² · h ${s.dims[2]} cm` : s.label}
            </T>
            <T className="mt-0.5 text-2xs text-[#56655F]">fino a {s.maxPlants} piante</T>
          </Choice>
        ))}
      </View>

      <Eyebrow className="mt-6">Livello attrezzatura</Eyebrow>
      <View className="mt-2 gap-2">
        {PRESETS.map((p) => {
          const c = { ...draft, budget: p.id, ledW: undefined };
          const st = kitStats(c);
          return (
            <Choice key={p.id} active={draft.budget === p.id} color={p.color} onPress={() => update({ budget: p.id, ledW: undefined })}>
              <View className="flex-row items-end pr-7">
                <T className="font-grotesk-b text-[19px]" style={{ color: draft.budget === p.id ? p.color : '#ECF3EF' }}>
                  {p.label}
                </T>
                <T className="ml-auto font-grotesk text-[17px]">{fmtEur(sum(setupItems(c)))}</T>
              </View>
              <T className="mt-0.5 text-xs text-[#8A9A93]">{p.tagline}</T>
              {space.indoor && (
                <View className="mt-2 flex-row gap-3">
                  <Spec Icon={Lightbulb} text={`LED ${st.ledW} W`} />
                  <Spec Icon={Wind} text={p.id === 'base' ? 'Estrattore base' : 'Estrattore EC silenzioso'} />
                </View>
              )}
            </Choice>
          );
        })}
      </View>

      <Eyebrow className="mt-6">Opzionali</Eyebrow>
      <View className="mt-2 gap-2">
        {optionalItems(draft.space).map((o) => {
          const price = sum(buildKit(withOption({ ...draft, skip: [] }, o.id, true)).filter((i) => i.id === o.id));
          return (
            <ToggleRow
              key={o.id}
              label={`${o.label}${price ? ` · ${fmtEur(price)}` : ''}`}
              caption={`${o.caption} ${isOn(draft, o.id) ? 'Già compreso nel totale.' : 'Escluso dal totale.'}`}
              value={isOn(draft, o.id)}
              onChange={(v) => update(withOption(draft, o.id, v))}
            />
          );
        })}
      </View>

      <Glass className="mt-6 p-4" glow={C.lime}>
        <View className="flex-row items-center">
          <Ruler size={16} color={C.lime} />
          <T className="ml-2 font-inter-sb text-[13px]">Le piante giuste per questo spazio</T>
        </View>
        <View className="mt-3 flex-row">
          <Fact label="Piante consigliate" value={`${SUGGESTED[draft.space]}`} sub={`max ${space.maxPlants}`} />
          <Fact
            label="Altezza utile"
            value={height ? `~${height} cm` : 'Libera'}
            sub={height ? 'vaso e lampada esclusi' : 'occhio ai vicini'}
          />
          <Fact label="Vasi" value={draft.space === 'giardino' ? 'Terra piena' : `${stats.potL} L`} sub="per pianta" />
        </View>
        <T className="mt-3 text-2xs leading-4 text-[#8A9A93]">
          Al passo successivo ti segnaliamo le genetiche che restano entro questa altezza.
        </T>
      </Glass>

      <Eyebrow className="mt-6">Cosa comprende l'allestimento</Eyebrow>
      <Glass className="mt-2 px-4 py-1">
        {items.map((i, idx) => (
          <View key={i.id} className={cn('flex-row items-center py-2.5', idx > 0 && 'border-t border-white/[0.06]')}>
            <View className="flex-1 pr-3">
              <T className="font-inter-sb text-[13px]">
                {i.qty > 1 ? `${i.qty}× ` : ''}
                {i.name}
              </T>
              <T className="mt-0.5 text-2xs text-[#8A9A93]" numberOfLines={1}>
                {i.spec}
              </T>
            </View>
            <T className="font-inter-sb text-[13px]">{fmtEur(Math.round(itemTotal(i)))}</T>
          </View>
        ))}
      </Glass>
      <T className="mt-2 text-2xs leading-4 text-[#56655F]">
        Prezzi indicativi dei negozi italiani. Vasi, nutrienti e strumenti li trovi poi nella sezione Kit.
      </T>
    </View>
  );
}

function Spec({ Icon, text }: { Icon: typeof Lightbulb; text: string }) {
  return (
    <View className="flex-row items-center">
      <Icon size={12} color="#8A9A93" />
      <T className="ml-1 text-2xs text-[#A9B6B0]">{text}</T>
    </View>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View className="flex-1">
      <T className="text-2xs text-[#8A9A93]">{label}</T>
      <T className="mt-0.5 font-grotesk-b text-[18px]">{value}</T>
      <T className="text-2xs text-[#56655F]">{sub}</T>
    </View>
  );
}

/* ───────────── Step 2: strain ───────────── */

type KindFilter = 'tutte' | 'auto' | 'foto';

function StrainStep({
  draft,
  update,
  cultivarId,
  setCultivarId,
}: {
  draft: KitConfig;
  update: (p: Partial<KitConfig>) => void;
  cultivarId: string | null;
  setCultivarId: (id: string) => void;
}) {
  const space = SPACES.find((s) => s.id === draft.space)!;
  const height = usableHeight(draft.space);
  const [filter, setFilter] = useState<KindFilter>('tutte');
  const list = useMemo(() => {
    const all = [...GENERIC_CULTIVARS, ...CULTIVARS].filter((c) =>
      filter === 'tutte' ? true : filter === 'auto' ? isAuto(c) : !isAuto(c),
    );
    // Strains that fit the tent first, then the easiest.
    const fits = (c: Cultivar) => !height || c.heightIndoor[1] <= height;
    return all.sort((a, b) => Number(fits(b)) - Number(fits(a)) || a.difficulty - b.difficulty);
  }, [filter, height]);

  return (
    <View className="px-5">
      <T className="mt-1.5 text-[13px] leading-[19px] text-[#8A9A93]">
        Ora la pianta. Le autofiorenti sono più semplici e veloci; le fotoperiodiche rendono di più ma richiedono di cambiare le ore di
        luce.
      </T>

      <Stepper
        className="mt-5"
        label={`Quante piante? Per ${space.short} ne consigliamo ${SUGGESTED[draft.space]}`}
        value={draft.plants}
        onChange={(v) => update({ plants: v })}
        min={1}
        max={space.maxPlants}
      />

      <Segmented
        className="mt-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'tutte', label: 'Tutte' },
          { value: 'auto', label: 'Autofiorenti' },
          { value: 'foto', label: 'Fotoperiodiche' },
        ]}
      />

      <View className="mt-3 gap-2">
        {list.map((c) => {
          const fits = !height || c.heightIndoor[1] <= height;
          const y = yieldLevel(c);
          return (
            <Choice key={c.id} active={c.id === cultivarId} onPress={() => setCultivarId(c.id)}>
              <View className="pr-7">
                <T className="font-grotesk text-[17px]">{c.name}</T>
                <T className="mt-0.5 text-2xs text-[#8A9A93]">
                  {isAuto(c) ? 'Autofiorente' : 'Fotoperiodica'} · {c.dominance} · fioritura {c.floweringDays[0]}–{c.floweringDays[1]} gg
                </T>
              </View>
              <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
                <LevelScale level={y.level} label={`Resa ${y.label.toLowerCase()}`} small />
                <Badge tone="neutral">{DIFFICULTY[c.difficulty - 1]}</Badge>
                {height ? (
                  <Badge tone={fits ? 'leaf' : 'amber'} dot>
                    {fits ? `Sta nei ${height} cm` : `Fino a ${c.heightIndoor[1]} cm: serve training`}
                  </Badge>
                ) : null}
              </View>
            </Choice>
          );
        })}
      </View>
    </View>
  );
}

/* ───────────── Step 3: substrate & nutrients ───────────── */

const MEDIA: Medium[] = ['terra-ricca', 'terra', 'cocco'];

function SubstrateStep({ draft, update }: { draft: KitConfig; update: (p: Partial<KitConfig>) => void }) {
  const indoor = SPACES.find((s) => s.id === draft.space)!.indoor;
  const media = MEDIA.filter((m) => indoor || m !== 'cocco');
  const lines = NUTRIENT_LINES.filter((l) => l.media.includes(draft.medium)).sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
  const chosen = nutrientById(draft.nutrient?.line);

  const setMedium = (m: Medium) => {
    const ok = chosen?.media.includes(m);
    const first = NUTRIENT_LINES.find((l) => l.media.includes(m))!;
    update({ medium: m, nutrient: ok ? draft.nutrient : { line: first.id, pack: draft.nutrient?.pack ?? 'parziale' } });
  };

  return (
    <View className="px-5">
      <T className="mt-1.5 text-[13px] leading-[19px] text-[#8A9A93]">
        Il substrato decide quanto concime serve. Poi scegli la linea di nutrienti: ti mostriamo quanto spendi per tutto il ciclo.
      </T>

      <Eyebrow className="mt-5">Substrato</Eyebrow>
      <View className="mt-2 gap-2">
        {media.map((m) => {
          const d = SUBSTRATE_DEMAND[m];
          return (
            <Choice key={m} active={draft.medium === m} onPress={() => setMedium(m)}>
              <T className="pr-7 font-grotesk text-[17px]">{d.label}</T>
              <T className="mt-0.5 text-xs leading-[17px] text-[#8A9A93]">{d.note}</T>
            </Choice>
          );
        })}
      </View>

      <Eyebrow className="mt-6">Nutrienti</Eyebrow>
      <View className="mt-2 gap-2">
        {lines.map((l) => {
          const active = draft.nutrient?.line === l.id;
          const pack: PackId = active ? draft.nutrient!.pack : 'parziale';
          const cost = nutrientCost(l, pack, draft.medium, draft.plants);
          return (
            <Choice
              key={l.id}
              active={active}
              color={l.type === 'Organico' ? C.leaf : C.sky}
              onPress={() => update({ nutrient: { line: l.id, pack } })}
            >
              <View className="pr-7">
                <T className="font-grotesk text-[17px]">{l.brand}</T>
                <T className="text-2xs text-[#8A9A93]">{l.line}</T>
              </View>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Badge tone={l.type === 'Organico' ? 'leaf' : 'sky'}>{l.type}</Badge>
                <Badge tone="neutral">{l.level}</Badge>
                <Badge tone={l.type === 'Minerale' ? 'amber' : 'neutral'}>pH {l.type === 'Minerale' ? 'obbligatorio' : 'opzionale'}</Badge>
              </View>
              <T className="mt-2 text-xs leading-[17px] text-[#A9B6B0]">{l.note}</T>
              {active && (
                <View className="mt-3">
                  <Segmented
                    value={pack}
                    onChange={(p) => update({ nutrient: { line: l.id, pack: p } })}
                    options={l.packs.map((p) => ({ value: p.id, label: PACK_LABEL[p.id] }))}
                  />
                  <T className="mt-2 text-2xs leading-4 text-[#8A9A93]">{l.packs.find((p) => p.id === pack)!.items.join(' · ')}</T>
                  <T className="mt-1.5 font-inter-sb text-xs">
                    {cost.packs > 1 ? `${cost.packs} confezioni · ` : ''}
                    {fmtEur(Math.round(cost.total))} per {draft.plants} {draft.plants === 1 ? 'pianta' : 'piante'}
                    {cost.calmag ? ' (Cal-Mag incluso)' : ''}
                  </T>
                </View>
              )}
            </Choice>
          );
        })}
      </View>
    </View>
  );
}
