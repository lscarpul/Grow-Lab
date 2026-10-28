import { Check, CircleCheck, CircleX, ExternalLink, Ruler, Sparkles, Store, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Donut, Ring } from '../components/charts';
import { Drawer } from '../components/Drawer';
import { openLink } from '../components/LinkSheet';
import { EnergySection, LampSection, NutrientSection, YieldSection } from './GrowPlan';
import { yieldLevel } from '../lib/growplan';
import { Disclaimer, Enter, Screen } from '../components/layout';
import { Badge, Bullet, Button, ChipRow, cn, Eyebrow, Glass, SectionHeader, Segmented, Stepper, T, tap } from '../components/ui';
import { Cultivar, CULTIVARS } from '../data/cultivars';
import { Budget, buildKit, itemTotal, KIT_CATEGORIES, KitCategory, KitConfig, KitItem, kitStats, Priority, SPACES } from '../data/kit';
import { fmtEur, PRICES_CHECKED, SEED_LINKS, SEEDS, seedSearchUrl, ShopPick } from '../data/shop';
import { adviseForCultivar, adviseForSetup, cycleDays, isAuto, Priority as Goal, SetupInput, SpaceOption, StrainFit } from '../lib/advisor';
import { fmtNum } from '../lib/math';
import { useStore } from '../state/store';
import { alpha, C } from '../theme/tokens';

type Mode = 'kit' | 'genetica' | 'attrezzatura';

const CAT_COLOR: Record<KitCategory, string> = {
  Spazio: '#9AA9A2',
  Luce: C.amber,
  'Aria e clima': C.sky,
  'Vasi e substrato': '#C08B5C',
  Nutrienti: C.leaf,
  'Misura e controllo': C.violet,
  'Cura e training': C.lime,
  Protezione: C.rose,
  'Raccolta e concia': '#F7B946',
};

const PRIORITY_TONE: Record<Priority, string> = { Essenziale: C.rose, Consigliato: C.amber, Extra: C.sky };
const BUDGET_LABEL: Record<Budget, string> = { base: 'Base', medio: 'Medio', pro: 'Pro' };
const KWH_EUR = 0.3;

const open = openLink;

export function KitScreen() {
  const [mode, setMode] = useState<Mode>('kit');
  return (
    <Screen
      eyebrow="Cosa comprare"
      title="Kit e consigli"
      subtitle={
        mode === 'kit'
          ? 'La lista della spesa per il tuo spazio, con prodotti e prezzi reali.'
          : mode === 'genetica'
            ? 'Scegli la genetica: ti diciamo spazio, attrezzatura e quanto costa.'
            : 'Dicci cosa hai già: ti consigliamo le genetiche più adatte.'
      }
    >
      <Enter i={1} className="mx-5 mt-5">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'kit', label: 'Lista kit' },
            { value: 'genetica', label: 'Da genetica' },
            { value: 'attrezzatura', label: 'Ho già' },
          ]}
        />
      </Enter>
      <View key={mode}>
        {mode === 'kit' && <KitList />}
        {mode === 'genetica' && <FromStrain onUseKit={() => setMode('kit')} />}
        {mode === 'attrezzatura' && <FromGear />}
      </View>
      <T className="mx-6 mt-6 text-center text-2xs leading-4 text-[#56655F]">
        Prezzi letti sui siti dei negozi il {PRICES_CHECKED}, IVA inclusa, spedizione esclusa. Possono cambiare: controlla sempre la pagina
        del prodotto. Dove non c'è un prodotto verificato mostriamo una stima.
      </T>
      <Disclaimer />
    </Screen>
  );
}

/* ───────────────────────── Kit list ───────────────────────── */

function KitList() {
  const { kit, setKit, owned, toggleOwned } = useStore();
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [hideOwned, setHideOwned] = useState(false);
  const [item, setItem] = useState<KitItem | null>(null);
  const space = SPACES.find((s) => s.id === kit.space)!;
  const items = useMemo(() => buildKit(kit), [kit]);
  const stats = useMemo(() => kitStats(kit), [kit]);
  const total = items.reduce((a, i) => a + itemTotal(i), 0);
  const ownedItems = items.filter((i) => owned.includes(i.id));
  const left = total - ownedItems.reduce((a, i) => a + itemTotal(i), 0);
  const essentialsLeft = items.filter((i) => i.priority === 'Essenziale' && !owned.includes(i.id));
  const verified = items.filter((i) => i.picks?.length).length;
  const byCat = KIT_CATEGORIES.map((c) => ({ c, v: items.filter((i) => i.category === c).reduce((a, i) => a + itemTotal(i), 0) })).filter(
    (x) => x.v > 0,
  );
  const visible = items.filter(
    (i) => (priorities.length ? priorities.includes(i.priority) : true) && (!hideOwned || !owned.includes(i.id)),
  );
  const set = (patch: Partial<KitConfig>) => setKit({ ...kit, ...patch });

  return (
    <>
      {/* Configuration */}
      <SectionHeader title="Il tuo spazio" caption="Cambia i parametri: lista, quantità e prezzi si aggiornano" />
      <ChipRow
        options={SPACES.map((s) => ({ value: s.id, label: s.label, color: s.indoor ? C.violet : C.amber }))}
        selected={[kit.space]}
        onToggle={(v) => {
          const s = SPACES.find((x) => x.id === v)!;
          set({
            space: v,
            plants: Math.min(kit.plants, s.maxPlants),
            medium: s.indoor || kit.medium !== 'cocco' ? kit.medium : 'terra',
            ledW: undefined,
          });
        }}
      />
      <Enter i={2} className="mx-5 mt-3 gap-2">
        <View className="flex-row gap-2">
          <Segmented
            className="flex-1"
            value={kit.budget}
            onChange={(b) => set({ budget: b })}
            options={(['base', 'medio', 'pro'] as Budget[]).map((b) => ({ value: b, label: BUDGET_LABEL[b] }))}
          />
          <Segmented
            className="flex-1"
            value={kit.kind}
            onChange={(k) => set({ kind: k })}
            options={[
              { value: 'foto', label: 'Foto' },
              { value: 'auto', label: 'Auto' },
            ]}
          />
        </View>
        <View className="flex-row gap-2">
          <Stepper
            className="flex-1"
            label={`Piante (max ${space.maxPlants})`}
            value={kit.plants}
            onChange={(n) => set({ plants: n })}
            min={1}
            max={space.maxPlants}
          />
        </View>
      </Enter>

      {/* KPIs */}
      <View className="mx-5 mt-4 flex-row gap-3">
        <Enter i={3} className="flex-1">
          <Glass className="flex-1 p-4" glow={C.amber}>
            <Eyebrow>Totale kit</Eyebrow>
            <T className="mt-1 font-grotesk-b text-[28px] leading-[32px]" style={{ color: C.amber }}>
              {fmtEur(Math.round(total))}
            </T>
            <T className="text-2xs text-[#8A9A93]">
              {items.length} articoli · {verified} con prezzo reale
            </T>
            <View className="mt-3 border-t border-white/[0.06] pt-3">
              <T className="text-2xs text-[#8A9A93]">Ti mancano</T>
              <T className="font-grotesk-b text-lg">{fmtEur(Math.round(left))}</T>
              <T className="text-2xs" style={{ color: essentialsLeft.length ? C.rose : C.leaf }}>
                {essentialsLeft.length ? `${essentialsLeft.length} essenziali da prendere` : "Hai tutto l'essenziale"}
              </T>
            </View>
          </Glass>
        </Enter>
        <Enter i={4} className="flex-1 gap-3">
          <Glass className="flex-row items-center p-3.5">
            <Ring value={items.length ? ownedItems.length / items.length : 0} size={54} stroke={6} color={C.leaf} color2={C.lime}>
              <T className="font-grotesk-b text-xs">{items.length ? Math.round((ownedItems.length / items.length) * 100) : 0}%</T>
            </Ring>
            <View className="ml-3 flex-1">
              <Eyebrow>Già presi</Eyebrow>
              <T className="font-grotesk text-[15px]">
                {ownedItems.length}/{items.length}
              </T>
            </View>
          </Glass>
          {space.indoor ? (
            <Glass className="p-3.5">
              <View className="flex-row items-center justify-between">
                <Eyebrow>Luce</Eyebrow>
                <Sparkles size={12} color={C.amber} />
              </View>
              <T className="mt-0.5 font-grotesk text-[15px]">
                {stats.ledW} W · {stats.ppfd} PPFD
              </T>
              <View className="mt-1 flex-row items-center">
                <Zap size={11} color={C.lime} />
                <T className="ml-1 text-2xs text-[#8A9A93]">
                  ~{stats.monthlyKwh} kWh/mese · {fmtEur(Math.round(stats.monthlyKwh * (kit.kwhPrice ?? KWH_EUR)))}
                </T>
              </View>
            </Glass>
          ) : (
            <Glass className="p-3.5">
              <Eyebrow>Outdoor</Eyebrow>
              <T className="mt-0.5 font-grotesk text-[15px]">Zero bolletta</T>
              <T className="text-2xs text-[#8A9A93]">Vaso {stats.potL} L · sole diretto 6 h+</T>
            </Glass>
          )}
        </Enter>
      </View>

      <LampSection kit={kit} set={set} />
      <EnergySection kit={kit} set={set} />
      <NutrientSection kit={kit} set={set} />
      <YieldSection kit={kit} set={set} />

      {/* Category split */}
      <Enter i={5} className="mx-5 mt-3">
        <Glass className="flex-row items-center p-4">
          <Donut segments={byCat.map((x) => ({ value: x.v, color: CAT_COLOR[x.c] }))} size={96} stroke={12}>
            <T className="font-grotesk-b text-[13px]">{byCat.length}</T>
            <T className="text-[9px] text-[#8A9A93]">categorie</T>
          </Donut>
          <View className="ml-4 flex-1 gap-1">
            {byCat
              .sort((a, b) => b.v - a.v)
              .slice(0, 6)
              .map((x) => (
                <View key={x.c} className="flex-row items-center">
                  <View className="mr-1.5 h-2 w-2 rounded-sm" style={{ backgroundColor: CAT_COLOR[x.c] }} />
                  <T className="flex-1 text-2xs text-[#A9B6B0]" numberOfLines={1}>
                    {x.c}
                  </T>
                  <T className="font-inter-sb text-2xs">{Math.round((x.v / total) * 100)}%</T>
                </View>
              ))}
          </View>
        </Glass>
      </Enter>

      {/* Filters */}
      <SectionHeader
        title="Lista della spesa"
        caption="Spunta quello che hai già · tocca per prodotti e consigli"
        right={
          <Pressable
            className="active:scale-[0.97] active:opacity-70"
            onPress={() => {
              tap();
              setHideOwned(!hideOwned);
            }}
          >
            <Badge tone={hideOwned ? 'leaf' : 'neutral'}>{hideOwned ? 'Solo mancanti' : 'Tutti'}</Badge>
          </Pressable>
        }
      />
      <ChipRow<Priority>
        options={(['Essenziale', 'Consigliato', 'Extra'] as Priority[]).map((p) => ({
          value: p,
          label: p,
          color: PRIORITY_TONE[p],
          count: items.filter((i) => i.priority === p).length,
        }))}
        selected={priorities}
        onToggle={(p) => setPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))}
      />

      <View className="mx-5 mt-3 gap-4">
        {KIT_CATEGORIES.map((cat) => {
          const list = visible.filter((i) => i.category === cat);
          if (!list.length) return null;
          return (
            <View key={cat}>
              <View className="mb-2 flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: CAT_COLOR[cat] }} />
                <Eyebrow>{cat}</Eyebrow>
              </View>
              <Glass className="px-1.5 py-1">
                {list.map((i, idx) => {
                  const has = owned.includes(i.id);
                  const pick = i.picks?.[0];
                  return (
                    <View key={i.id} className={cn('flex-row items-center px-2 py-3', idx > 0 && 'border-t border-white/[0.05]')}>
                      <Pressable
                        accessibilityLabel={`Già preso: ${i.name}`}
                        onPress={() => {
                          tap();
                          toggleOwned(i.id);
                        }}
                        hitSlop={8}
                        className="mr-3 h-6 w-6 items-center justify-center rounded-lg border active:scale-[0.97] active:opacity-70"
                        style={{ borderColor: has ? C.leaf : 'rgba(255,255,255,0.2)', backgroundColor: has ? C.leaf : 'transparent' }}
                      >
                        {has && (
                          <Animated.View entering={ZoomIn.springify().damping(11).stiffness(260)}>
                            <Check size={14} color="#05080A" strokeWidth={3} />
                          </Animated.View>
                        )}
                      </Pressable>
                      <Pressable
                        className={cn('flex-1 active:scale-[0.97] active:opacity-70', has && 'opacity-50')}
                        onPress={() => setItem(i)}
                      >
                        <View className="flex-row items-center">
                          <T className={cn('flex-1 font-inter-sb text-[13px]', has && 'text-[#56655F] line-through')} numberOfLines={1}>
                            {i.name}
                          </T>
                          <T className="ml-2 font-grotesk text-[14px]" style={{ color: has ? '#56655F' : '#ECF3EF' }}>
                            {fmtEur(Math.round(itemTotal(i) * 100) / 100)}
                          </T>
                        </View>
                        <T className="mt-0.5 text-2xs text-[#8A9A93]" numberOfLines={1}>
                          {i.qty > 1 ? `${i.qty} ${i.unit} · ` : ''}
                          {i.spec}
                        </T>
                        <View className="mt-1 flex-row items-center gap-1.5">
                          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIORITY_TONE[i.priority] }} />
                          <T className="text-2xs" style={{ color: PRIORITY_TONE[i.priority] }}>
                            {i.priority}
                          </T>
                          {pick ? (
                            <T className="flex-1 text-2xs text-[#56655F]" numberOfLines={1}>
                              · {pick.name} ({pick.shop})
                            </T>
                          ) : (
                            <T className="text-2xs text-[#56655F]">· prezzo stimato</T>
                          )}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </Glass>
            </View>
          );
        })}
      </View>
      <ItemDrawer item={item} budget={kit.budget} onClose={() => setItem(null)} />
    </>
  );
}

function PickRow({ p, link = true }: { p: ShopPick; link?: boolean }) {
  return (
    <Pressable
      disabled={!link}
      onPress={() => open(p.url)}
      className="flex-row items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 active:scale-[0.97] active:opacity-70"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: alpha(C.amber, 0.12) }}>
        <Store size={16} color={C.amber} />
      </View>
      <View className="ml-3 flex-1">
        <T className="font-inter-sb text-[13px]">{p.name}</T>
        <T className="text-2xs text-[#8A9A93]">
          {p.shop}
          {p.note ? ` · ${p.note}` : ''}
        </T>
      </View>
      <View className="ml-2 items-end">
        <T className="font-grotesk-b text-[15px]" style={{ color: C.amber }}>
          {fmtEur(p.price)}
        </T>
        {link && <ExternalLink size={12} color="#8A9A93" />}
      </View>
    </Pressable>
  );
}

function ItemDrawer({ item: i, budget, onClose }: { item: KitItem | null; budget: Budget; onClose: () => void }) {
  if (!i)
    return (
      <Drawer open={false} onClose={onClose} header={null}>
        {null}
      </Drawer>
    );
  const color = CAT_COLOR[i.category];
  return (
    <Drawer
      open
      onClose={onClose}
      accent={color}
      header={
        <View>
          <View className="flex-row gap-1.5">
            <Badge color={color} dot>
              {i.category}
            </Badge>
            <Badge color={PRIORITY_TONE[i.priority]}>{i.priority}</Badge>
          </View>
          <T className="mt-2 font-grotesk-b text-[24px] tracking-[-0.5px]">{i.name}</T>
          <T className="text-[13px] text-[#8A9A93]">
            {i.qty} {i.unit} · {i.spec}
          </T>
        </View>
      }
    >
      <View className="px-5">
        <Glass className="p-4" glow={color}>
          <Eyebrow>Perché serve</Eyebrow>
          <T className="mt-2 text-[13.5px] leading-5 text-[#DCE6E1]">{i.why}</T>
          <T className="mt-2 text-xs text-[#8A9A93]">Quando: {i.when}</T>
        </Glass>

        {i.picks && i.picks.length > 0 ? (
          <>
            <Eyebrow className="mt-5">Prodotti consigliati · budget {BUDGET_LABEL[budget].toLowerCase()}</Eyebrow>
            <View className="mt-2 gap-2">
              {i.picks.map((p) => (
                <PickRow key={p.name + p.shop} p={p} />
              ))}
            </View>
          </>
        ) : (
          <Glass className="mt-4 p-4">
            <Eyebrow>Prezzo stimato</Eyebrow>
            <View className="mt-2 flex-row justify-between">
              {(['base', 'medio', 'pro'] as Budget[]).map((b) => (
                <View key={b} className={cn('items-center', b === budget && 'opacity-100')}>
                  <T className="text-2xs text-[#8A9A93]">{BUDGET_LABEL[b]}</T>
                  <T className="font-grotesk text-[16px]" style={{ color: b === budget ? C.amber : '#ECF3EF' }}>
                    {fmtEur(i.unitPrice[b])}
                  </T>
                </View>
              ))}
            </View>
            <T className="mt-2 text-2xs text-[#56655F]">
              Prezzo unitario medio di mercato: cerca nei growshop o nei negozi di giardinaggio.
            </T>
          </Glass>
        )}

        <Eyebrow className="mt-5">Cosa guardare</Eyebrow>
        <View className="mt-2">
          {i.lookFor.map((t) => (
            <Bullet key={t}>{t}</Bullet>
          ))}
        </View>
        <Eyebrow className="mt-3">Da evitare</Eyebrow>
        <View className="mt-2">
          {i.avoid.map((t) => (
            <Bullet key={t} color={C.rose}>
              {t}
            </Bullet>
          ))}
        </View>
      </View>
    </Drawer>
  );
}

/* ───────────────────────── Strain → space ───────────────────────── */

function SeedCard({ c }: { c: Cultivar }) {
  const s = SEEDS[c.id];
  if (!s)
    return (
      <Glass className="mt-3 p-4">
        <Eyebrow>Semi</Eyebrow>
        <T className="mt-1 text-xs text-[#8A9A93]">Nessuna offerta verificata per questa genetica.</T>
        {SEED_LINKS && (
          <Button className="mt-3" tone="ghost" color={C.amber} label="Cerca i prezzi online" onPress={() => open(seedSearchUrl(c.name))} />
        )}
      </Glass>
    );
  return (
    <View className="mt-3">
      <Eyebrow>Semi · {s.exact ? 'stessa genetica' : 'alternativa più vicina'}</Eyebrow>
      <View className="mt-2">
        <PickRow p={{ ...s, name: `${s.name} · ${s.seeds} ${s.seeds > 1 ? 'semi' : 'seme'}` }} link={SEED_LINKS} />
      </View>
    </View>
  );
}

function FromStrain({ onUseKit }: { onUseKit: () => void }) {
  const { kit, setKit } = useStore();
  const [id, setId] = useState(CULTIVARS[0].id);
  const [budget, setBudget] = useState<Budget>('medio');
  const c = CULTIVARS.find((x) => x.id === id)!;
  const options = useMemo(() => adviseForCultivar(c, budget), [c, budget]);
  const best = options.find((o) => o.recommended)!;
  return (
    <>
      <SectionHeader title="Che genetica vuoi coltivare?" caption={`${CULTIVARS.length} genetiche del catalogo`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {CULTIVARS.map((x) => {
          const active = x.id === id;
          return (
            <Pressable
              key={x.id}
              onPress={() => {
                tap();
                setId(x.id);
              }}
              className={cn(
                'active:scale-[0.97] active:opacity-70',
                'w-[128px] rounded-2xl border p-3',
                active ? 'border-[#34D88A]/50 bg-[#34D88A]/[0.12]' : 'border-white/[0.08] bg-white/[0.03]',
              )}
            >
              <T className="font-inter-sb text-[13px]" numberOfLines={1}>
                {x.name}
              </T>
              <T className="mt-0.5 text-2xs text-[#8A9A93]">
                {isAuto(x) ? 'Auto' : 'Foto'} · {x.heightIndoor[0]}–{x.heightIndoor[1]} cm
              </T>
              <T className="mt-1 font-inter-sb text-2xs" style={{ color: C.amber }}>
                {SEEDS[x.id] ? `da ${fmtEur(SEEDS[x.id].price)}` : 'prezzo n/d'}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>

      <Enter i={2} className="mx-5 mt-4">
        <Glass className="p-4" glow={C.leaf}>
          <View className="flex-row items-center justify-between">
            <Badge tone="leaf" dot>
              Consiglio
            </Badge>
            <T className="text-2xs text-[#8A9A93]">Ciclo ~{cycleDays(c)} giorni dalla semina</T>
          </View>
          <T className="mt-2 font-grotesk-b text-[22px] leading-[26px]">{best.label}</T>
          <T className="mt-1 text-[13px] leading-[19px] text-[#C9D4CF]">
            {best.plants} {best.plants > 1 ? 'piante' : 'pianta'} di {c.name}.{' '}
            {best.heightOk
              ? `Altezza finale ${c.heightIndoor[0]}–${c.heightIndoor[1]} cm: ci stanno comode nei ${best.heightRoom} cm utili.`
              : `Arriva a ${c.heightIndoor[1]} cm: con topping e rete SCROG resta nei ${best.heightRoom} cm utili.`}
          </T>
          <View className="mt-4 flex-row border-t border-white/[0.06] pt-3">
            {[
              ['Kit', fmtEur(best.kitCost)],
              ['Semi', fmtEur(Math.round(best.seedCost * 100) / 100)],
              ['Luce/ciclo', fmtEur(best.energyCost)],
              ['Resa', yieldLevel(c).label],
            ].map(([k, v], i) => (
              <View key={k} className={cn('flex-1', i > 0 && 'border-l border-white/[0.06] pl-2.5')}>
                <T className="text-2xs text-[#8A9A93]">{k}</T>
                <T className="mt-0.5 font-grotesk text-[14px]">{v}</T>
              </View>
            ))}
          </View>
          <Button
            className="mt-4"
            label="Usa questo kit"
            onPress={() => {
              setKit({ ...kit, ...best.config, cultivarId: c.id, ledW: undefined });
              onUseKit();
            }}
          />
        </Glass>
        <SeedCard c={c} />
        <View className="mt-3 flex-row gap-2">
          <Segmented
            className="flex-1"
            value={budget}
            onChange={setBudget}
            options={(['base', 'medio', 'pro'] as Budget[]).map((b) => ({ value: b, label: `Budget ${BUDGET_LABEL[b].toLowerCase()}` }))}
          />
        </View>
      </Enter>

      <SectionHeader title="Tutte le opzioni" caption="Costo del primo ciclo con tutto incluso, diviso per i grammi attesi" />
      <View className="mx-5 gap-2">
        {options.map((o, i) => (
          <Enter i={3 + i} key={o.space}>
            <OptionRow o={o} onUse={() => (setKit({ ...kit, ...o.config, cultivarId: c.id, ledW: undefined }), onUseKit())} />
          </Enter>
        ))}
      </View>
      <T className="mx-6 mt-3 text-2xs leading-4 text-[#56655F]">
        Rese stimate da dati medi dei breeder, ridotte per un coltivatore alle prime armi. Bolletta calcolata a {fmtNum(KWH_EUR, 2)} €/kWh.
      </T>
    </>
  );
}

function OptionRow({ o, onUse }: { o: SpaceOption; onUse: () => void }) {
  const status = o.heightOk
    ? { c: C.leaf, t: 'Altezza ok' }
    : o.needsTraining
      ? { c: C.amber, t: 'Serve training' }
      : { c: C.rose, t: 'Troppo bassa' };
  const outdoor = o.energyCost === 0 && o.heightRoom === 999;
  return (
    <Pressable className="active:scale-[0.97] active:opacity-70" onPress={onUse}>
      <View
        className="rounded-2xl p-3.5"
        style={{
          backgroundColor: o.recommended ? alpha(C.leaf, 0.08) : 'rgba(255,255,255,0.03)',
          borderWidth: 1,
          borderColor: o.recommended ? alpha(C.leaf, 0.35) : 'rgba(255,255,255,0.07)',
        }}
      >
        <View className="flex-row items-center">
          <T className="flex-1 font-inter-sb text-[13px]">{o.label}</T>
          {o.recommended && <Badge tone="leaf">Consigliato</Badge>}
          {!outdoor && !o.recommended && <Badge color={status.c}>{status.t}</Badge>}
          {outdoor && <Badge tone="amber">Outdoor</Badge>}
        </View>
        <View className="mt-2 flex-row">
          {[
            ['Piante', `${o.plants}`],
            ['Spesa', fmtEur(Math.round(o.kitCost + o.seedCost + o.energyCost))],
            ['Luce/ciclo', o.energyCost ? fmtEur(o.energyCost) : '—'],
          ].map(([k, v]) => (
            <View key={k} className="flex-1">
              <T className="text-2xs text-[#56655F]">{k}</T>
              <T className="font-grotesk text-[13px]">{v}</T>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/* ───────────────────────── Gear → strains ───────────────────────── */

const GOALS: { value: Goal; label: string }[] = [
  { value: 'facile', label: 'Facile' },
  { value: 'resa', label: 'Più resa' },
  { value: 'veloce', label: 'Veloce' },
  { value: 'discreta', label: 'Bassa e discreta' },
  { value: 'cbd', label: 'CBD' },
];

function FromGear() {
  const [input, setInput] = useState<SetupInput>({
    env: 'indoor',
    w: 80,
    d: 80,
    h: 180,
    ledW: 200,
    experience: 1,
    priority: 'facile',
    kind: 'tutte',
    climate: 'centro',
  });
  const set = (patch: Partial<SetupInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const fits = useMemo(() => adviseForSetup(input), [input]);
  const area = (input.w * input.d) / 10000;

  return (
    <>
      <SectionHeader title="La tua attrezzatura" caption="Misure interne della tenda e potenza reale della lampada" />
      <Enter i={2} className="mx-5 gap-2">
        <Segmented
          value={input.env}
          onChange={(env) => set(env === 'outdoor' ? { env, w: 300, d: 200 } : { env, w: 80, d: 80, h: 180 })}
          options={[
            { value: 'indoor', label: 'Indoor · tenda' },
            { value: 'outdoor', label: 'Outdoor' },
          ]}
        />
        {input.env === 'indoor' ? (
          <>
            <View className="flex-row gap-2">
              <Stepper
                className="flex-1"
                label="Larghezza"
                value={input.w}
                onChange={(w) => set({ w })}
                step={10}
                min={40}
                max={300}
                unit="cm"
              />
              <Stepper
                className="flex-1"
                label="Profondità"
                value={input.d}
                onChange={(d) => set({ d })}
                step={10}
                min={40}
                max={300}
                unit="cm"
              />
            </View>
            <View className="flex-row gap-2">
              <Stepper
                className="flex-1"
                label="Altezza"
                value={input.h}
                onChange={(h) => set({ h })}
                step={10}
                min={80}
                max={250}
                unit="cm"
              />
              <Stepper
                className="flex-1"
                label="LED (W reali)"
                value={input.ledW}
                onChange={(ledW) => set({ ledW })}
                step={10}
                min={20}
                max={1000}
                unit="W"
                color={C.amber}
              />
            </View>
          </>
        ) : (
          <>
            <View className="flex-row gap-2">
              <Stepper
                className="flex-1"
                label="Spazio largo"
                value={input.w}
                onChange={(w) => set({ w })}
                step={50}
                min={50}
                max={2000}
                unit="cm"
              />
              <Stepper
                className="flex-1"
                label="Spazio profondo"
                value={input.d}
                onChange={(d) => set({ d })}
                step={50}
                min={50}
                max={2000}
                unit="cm"
              />
            </View>
            <Segmented
              value={input.climate}
              onChange={(climate) => set({ climate })}
              options={[
                { value: 'nord', label: 'Nord' },
                { value: 'centro', label: 'Centro' },
                { value: 'sud', label: 'Sud e isole' },
              ]}
            />
          </>
        )}
        <Segmented
          value={String(input.experience) as '1' | '2' | '3'}
          onChange={(v) => set({ experience: Number(v) as 1 | 2 | 3 })}
          options={[
            { value: '1', label: 'Principiante' },
            { value: '2', label: 'Qualche ciclo' },
            { value: '3', label: 'Esperto' },
          ]}
        />
        <Segmented
          value={input.kind}
          onChange={(kind) => set({ kind })}
          options={[
            { value: 'tutte', label: 'Tutte' },
            { value: 'auto', label: 'Autofiorenti' },
            { value: 'foto', label: 'Fotoperiodiche' },
          ]}
        />
      </Enter>
      <ChipRow className="mt-3" options={GOALS} selected={[input.priority]} onToggle={(priority) => set({ priority })} />

      {input.env === 'indoor' && (
        <Enter i={3} className="mx-5 mt-3">
          <Glass className="flex-row items-center p-3.5">
            <Ruler size={15} color={C.sky} />
            <T className="ml-2 flex-1 text-xs text-[#C9D4CF]">
              {fmtNum(area, 2)} m² · {input.h - 70} cm utili per la pianta · ~{fits[0]?.ppfd ?? 0} PPFD
              {fits[0] && fits[0].ppfd < 450
                ? ' (poca luce)'
                : fits[0] && fits[0].ppfd > 1000
                  ? ' (molta luce: dimmera in vegetativa)'
                  : ''}
            </T>
          </Glass>
        </Enter>
      )}

      <SectionHeader
        title="Genetiche consigliate"
        caption="Ordinate per compatibilità con il tuo spazio, la tua esperienza e l'obiettivo"
      />
      <View className="mx-5 gap-3">
        {fits.slice(0, 6).map((f, i) => (
          <Enter i={4 + i} key={f.cultivar.id}>
            <FitCard f={f} rank={i + 1} />
          </Enter>
        ))}
      </View>
    </>
  );
}

function FitCard({ f, rank }: { f: StrainFit; rank: number }) {
  const color = f.score >= 75 ? C.leaf : f.score >= 55 ? C.amber : C.rose;
  const seed = SEEDS[f.cultivar.id];
  return (
    <Glass className="p-4" glow={rank === 1 ? color : undefined}>
      <View className="flex-row items-center">
        <Ring value={f.score / 100} size={54} stroke={6} color={color} color2={C.lime}>
          <T className="font-grotesk-b text-[14px]">{f.score}</T>
        </Ring>
        <View className="ml-3 flex-1">
          <T className="font-grotesk-b text-[17px]">
            {rank}. {f.cultivar.name}
          </T>
          <T className="text-2xs text-[#8A9A93]">
            {isAuto(f.cultivar) ? 'Autofiorente' : 'Fotoperiodica'} · {f.cultivar.dominance} · THC {f.cultivar.thc[0]}–{f.cultivar.thc[1]}%
          </T>
        </View>
      </View>
      <View className="mt-3 gap-1.5">
        {f.reasons.slice(0, 4).map((r) => (
          <View key={r.text} className="flex-row items-start">
            {r.ok ? <CircleCheck size={13} color={C.leaf} /> : <CircleX size={13} color={C.amber} />}
            <T className="ml-2 flex-1 text-xs leading-[17px] text-[#B7C3BE]">{r.text}</T>
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row border-t border-white/[0.06] pt-3">
        {[
          ['Piante', `${f.plants}`],
          ['Resa', yieldLevel(f.cultivar).label],
          ['Semi', f.seedCost !== null ? fmtEur(Math.round(f.seedCost * 100) / 100) : 'n/d'],
        ].map(([k, v]) => (
          <View key={k} className="flex-1">
            <T className="text-2xs text-[#56655F]">{k}</T>
            <T className="font-grotesk text-[13px]">{v}</T>
          </View>
        ))}
      </View>
      {seed && (
        <Pressable
          disabled={!SEED_LINKS}
          onPress={() => open(seed.url)}
          className="mt-2 flex-row items-center active:scale-[0.97] active:opacity-70"
        >
          <Store size={12} color="#8A9A93" />
          <T className="ml-1.5 flex-1 text-2xs text-[#8A9A93]" numberOfLines={1}>
            {seed.name} · {seed.seeds} {seed.seeds > 1 ? 'semi' : 'seme'} {fmtEur(seed.price)} su {seed.shop}
          </T>
          {SEED_LINKS && <ExternalLink size={11} color="#8A9A93" />}
        </Pressable>
      )}
    </Glass>
  );
}
