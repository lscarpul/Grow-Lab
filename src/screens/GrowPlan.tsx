import { Check, Download, FlaskConical, Info, Lightbulb, Sprout, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Enter } from '../components/layout';
import { Badge, Button, cn, Eyebrow, Glass, LevelScale, SectionHeader, Segmented, Stepper, T, tap, ToggleRow } from '../components/ui';
import { CULTIVARS, cultivarById } from '../data/cultivars';
import { KitConfig, Medium, SPACES } from '../data/kit';
import {
  feedingSheet,
  LEVEL_RANK,
  NUTRIENT_LINES,
  nutrientById,
  nutrientCost,
  PACK_LABEL,
  PackId,
  SUBSTRATE_DEMAND,
} from '../data/nutrients';
import { fmtEur } from '../data/shop';
import { energyPlan, estimateYield, lampPresets, TECHNIQUES, yieldLevel } from '../lib/growplan';
import { alpha, C } from '../theme/tokens';

type Props = { kit: KitConfig; set: (patch: Partial<KitConfig>) => void };

const eur = (v: number) => fmtEur(Math.round(v));
const LEVEL_COLOR = { Principiante: C.leaf, Intermedio: C.amber, Esperto: C.rose } as const;

/* ───────────────────────── Lamp ───────────────────────── */

export function LampSection({ kit, set }: Props) {
  const presets = lampPresets(kit.space);
  if (!presets.length) return null;
  const price = kit.kwhPrice ?? 0.3;
  const area = SPACES.find((s) => s.id === kit.space)!.short;
  return (
    <>
      <SectionHeader title="Scegli la lampada" caption={`Tre potenze adatte alla tenda ${area}: niente watt da indovinare`} />
      <Enter i={3} className="mx-5 gap-2">
        {presets.map((p) => {
          const active = kit.ledW === p.watts;
          const color = p.id === 'risparmio' ? C.lime : p.id === 'bilanciato' ? C.leaf : C.amber;
          // Monthly light cost in flowering (12/12) or for autos (20/4).
          const month = ((p.watts * (kit.kind === 'auto' ? 20 : 12) * 30) / 1000) * price;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                tap();
                set({ ledW: active ? undefined : p.watts });
              }}
              className={cn(
                'flex-row items-center rounded-2xl border p-3.5 active:scale-[0.98] active:opacity-80',
                active ? 'bg-white/[0.06]' : 'border-white/[0.08] bg-white/[0.03]',
              )}
              style={active ? { borderColor: alpha(color, 0.6) } : undefined}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: alpha(color, 0.15) }}>
                <Lightbulb size={18} color={color} />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <T className="font-inter-sb text-[14px]">{p.label}</T>
                  {p.id === 'bilanciato' && (
                    <View className="ml-2">
                      <Badge tone="leaf">Consigliata</Badge>
                    </View>
                  )}
                </View>
                <T className="mt-0.5 text-2xs text-[#8A9A93]">{p.tagline}</T>
                <T className="mt-1 text-2xs text-[#56655F]">
                  ~{p.ppfd} PPFD · luce {eur(month)}/mese
                </T>
              </View>
              <T className="font-grotesk-b text-[20px]" style={{ color }}>
                {p.watts} W
              </T>
              <View
                className="ml-3 h-6 w-6 items-center justify-center rounded-full border"
                style={{ borderColor: active ? color : 'rgba(255,255,255,0.2)', backgroundColor: active ? color : 'transparent' }}
              >
                {active && <Check size={13} color="#05080A" strokeWidth={3} />}
              </View>
            </Pressable>
          );
        })}
      </Enter>
    </>
  );
}

/* ───────────────────────── Electricity ───────────────────────── */

export function EnergySection({ kit, set }: Props) {
  const plan = energyPlan(kit);
  if (!plan.devices.length) return null;
  const max = Math.max(...plan.devices.map((d) => Math.max(d.eurVeg, d.eurFlower)));
  return (
    <>
      <SectionHeader title="Bolletta della growbox" caption="Spesa elettrica mensile di luce, aria e clima" />
      <Enter i={4} className="mx-5">
        <Glass className="p-4" glow={C.lime}>
          <View className="flex-row">
            <View className="flex-1">
              <Eyebrow>{kit.kind === 'auto' ? 'Al mese (20/4)' : 'Al mese in fioritura'}</Eyebrow>
              <T className="mt-1 font-grotesk-b text-[28px] leading-[32px]" style={{ color: C.lime }}>
                {eur(kit.kind === 'auto' ? plan.monthVeg : plan.monthFlower)}
              </T>
              <T className="text-2xs text-[#8A9A93]">~{Math.round(plan.kwhMonth)} kWh</T>
            </View>
            <View className="flex-1 border-l border-white/[0.06] pl-4">
              {kit.kind !== 'auto' && (
                <>
                  <Eyebrow>In vegetativa</Eyebrow>
                  <T className="mt-1 font-grotesk text-[17px]">{eur(plan.monthVeg)}/mese</T>
                </>
              )}
              <Eyebrow className={kit.kind !== 'auto' ? 'mt-2' : ''}>Ciclo completo</Eyebrow>
              <T className="mt-1 font-grotesk text-[17px]">{eur(plan.cycle)}</T>
            </View>
          </View>

          <View className="mt-4 gap-2.5">
            {plan.devices.map((d) => {
              const v = kit.kind === 'auto' ? d.eurVeg : d.eurFlower;
              return (
                <View key={d.id}>
                  <View className="flex-row items-center justify-between">
                    <T className="flex-1 text-xs text-[#C9D4CF]" numberOfLines={1}>
                      {d.label}
                    </T>
                    <T className="font-inter-sb text-xs">{eur(v)}</T>
                  </View>
                  <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <View style={{ width: `${(v / (max || 1)) * 100}%`, height: '100%', borderRadius: 6, backgroundColor: C.lime }} />
                  </View>
                </View>
              );
            })}
          </View>
        </Glass>
      </Enter>
      <Enter i={5} className="mx-5 mt-2 gap-2">
        <Stepper
          label="Prezzo energia (€/kWh, media Italia)"
          value={plan.price}
          onChange={(v) => set({ kwhPrice: v })}
          step={0.01}
          min={0.1}
          max={0.8}
          digits={2}
          unit="€"
          color={C.lime}
        />
        <ToggleRow
          label="Deumidificatore"
          caption="200 W · utile in fioritura sopra il 55% di umidità"
          value={!!kit.dehumidifier}
          onChange={(v) => set({ dehumidifier: v })}
          color={C.sky}
        />
        <ToggleRow
          label="Riscaldatore"
          caption="400 W · solo se la stanza scende sotto i 18 °C"
          value={!!kit.heater}
          onChange={(v) => set({ heater: v })}
          color={C.rose}
        />
      </Enter>
    </>
  );
}

/* ───────────────────────── Nutrients ───────────────────────── */

const MEDIA: { value: Medium; label: string }[] = [
  { value: 'terra-ricca', label: 'Terra ricca' },
  { value: 'terra', label: 'Terra leggera' },
  { value: 'cocco', label: 'Cocco' },
];

export function NutrientSection({ kit, set }: Props) {
  const indoor = SPACES.find((s) => s.id === kit.space)!.indoor;
  const demand = SUBSTRATE_DEMAND[kit.medium];
  const chosen = nutrientById(kit.nutrient?.line);
  const lines = [...NUTRIENT_LINES].sort(
    (a, b) => Number(b.media.includes(kit.medium)) - Number(a.media.includes(kit.medium)) || LEVEL_RANK[a.level] - LEVEL_RANK[b.level],
  );
  const pct = Math.round((demand.factor - 1) * 100);

  const share = async (lineId: string, pack: PackId) => {
    const line = nutrientById(lineId)!;
    tap();
    await Share.share({
      title: `Scheda nutrizione ${line.brand}`,
      message: feedingSheet(line, { medium: kit.medium, pack, plants: kit.plants, advanced: !!kit.advanced }),
    }).catch(() => undefined);
  };

  return (
    <>
      <SectionHeader title="Nutrienti" caption="Substrato e linea di concimi: una sola marca, senza mescolare" />
      <Enter i={6} className="mx-5 gap-2">
        <Segmented
          value={kit.medium}
          onChange={(m) => set({ medium: m })}
          options={(indoor ? MEDIA : MEDIA.filter((m) => m.value !== 'cocco')).map((m) => ({ value: m.value, label: m.label }))}
        />
        <View
          className="flex-row items-center rounded-2xl px-3.5 py-2.5"
          style={{
            backgroundColor: alpha(pct > 0 ? C.amber : C.leaf, 0.1),
            borderWidth: 1,
            borderColor: alpha(pct > 0 ? C.amber : C.leaf, 0.3),
          }}
        >
          <Sprout size={15} color={pct > 0 ? C.amber : C.leaf} />
          <T className="ml-2 flex-1 text-xs leading-[17px] text-[#DCE6E1]">{demand.note}</T>
          <T className="ml-2 font-grotesk-b text-[13px]" style={{ color: pct > 0 ? C.amber : C.leaf }}>
            {pct === 0 ? 'Base' : `${pct > 0 ? '+' : ''}${pct}%`}
          </T>
        </View>

        {/* pH / EC rules follow the chosen line */}
        <Glass className="p-3.5">
          <View className="flex-row items-center">
            <FlaskConical size={14} color={C.violet} />
            <Eyebrow className="ml-2">Controlli</Eyebrow>
          </View>
          <View className="mt-2.5 flex-row items-center justify-between">
            <T className="text-[13px]">pH dell'acqua</T>
            {chosen ? (
              <Badge tone={chosen.type === 'Minerale' ? 'rose' : 'neutral'} dot>
                {chosen.type === 'Minerale' ? 'Obbligatorio' : 'Opzionale'}
              </Badge>
            ) : (
              <T className="text-2xs text-[#56655F]">Scegli una linea</T>
            )}
          </View>
          <T className="mt-1 text-2xs leading-4 text-[#8A9A93]">
            {chosen?.type === 'Minerale'
              ? 'Con i minerali il pH fuori range blocca subito i nutrienti: misuralo a ogni annaffiatura (terra 6,2–6,8 · cocco 5,8–6,2).'
              : chosen
                ? 'Con gli organici la vita del terreno tampona il pH: controllalo solo se compaiono carenze.'
                : 'Minerale = pH obbligatorio · Organico = pH opzionale.'}
          </T>
          <View className="mt-3 flex-row items-center justify-between">
            <T className="text-[13px]">EC (carica di sali)</T>
            <Badge tone={kit.advanced ? 'sky' : 'neutral'}>{kit.advanced ? 'Attivo' : 'Bloccato'}</Badge>
          </View>
        </Glass>
        <ToggleRow
          label="Modalità avanzata"
          caption="Sblocca il controllo dell'EC: valori per settimana nella scheda e campo EC nelle misure"
          value={!!kit.advanced}
          onChange={(v) => set({ advanced: v })}
          color={C.sky}
        />
      </Enter>

      <View className="mx-5 mt-3 gap-3">
        {lines.map((l, idx) => {
          const fits = l.media.includes(kit.medium);
          const selected = kit.nutrient?.line === l.id;
          const pack = selected ? kit.nutrient!.pack : 'essenziale';
          const cost = nutrientCost(l, pack, kit.medium, kit.plants);
          const p = l.packs.find((x) => x.id === pack)!;
          return (
            <Enter key={l.id} i={7 + idx}>
              <Glass className={cn('p-4', !fits && 'opacity-60')} glow={selected ? C.leaf : undefined}>
                <View className="flex-row items-start">
                  <View className="flex-1">
                    <T className="font-grotesk-b text-[17px]">{l.brand}</T>
                    <T className="text-xs text-[#8A9A93]">{l.line}</T>
                  </View>
                  {selected && (
                    <Badge tone="leaf" dot>
                      Scelta
                    </Badge>
                  )}
                </View>
                <View className="mt-2.5 flex-row flex-wrap gap-1.5">
                  <Badge tone={l.type === 'Organico' ? 'lime' : 'sky'}>{l.type}</Badge>
                  <Badge color={LEVEL_COLOR[l.level]}>{l.level}</Badge>
                  {!fits && <Badge tone="rose">Non pensata per {SUBSTRATE_DEMAND[kit.medium].label.toLowerCase()}</Badge>}
                </View>
                <T className="mt-2.5 text-xs leading-[17px] text-[#9FB0A9]">{l.note}</T>

                <View className="mt-3 flex-row gap-1.5">
                  {l.packs.map((x) => {
                    const on = selected && kit.nutrient!.pack === x.id;
                    return (
                      <Pressable
                        key={x.id}
                        onPress={() => {
                          tap();
                          set({ nutrient: on ? undefined : { line: l.id, pack: x.id } });
                        }}
                        className={cn(
                          'flex-1 items-center rounded-xl border px-1 py-2.5 active:scale-[0.96] active:opacity-80',
                          on ? 'border-[#34D88A]/60 bg-[#34D88A]/[0.14]' : 'border-white/[0.08] bg-white/[0.03]',
                        )}
                      >
                        <T className="text-2xs text-[#8A9A93]">{PACK_LABEL[x.id]}</T>
                        <T className="mt-0.5 font-grotesk-b text-[15px]" style={{ color: on ? C.leaf : '#ECF3EF' }}>
                          {fmtEur(x.price)}
                        </T>
                      </Pressable>
                    );
                  })}
                </View>
                <View className="mt-2.5 gap-1">
                  {p.items.map((it) => (
                    <T key={it} className="text-2xs leading-4 text-[#8A9A93]">
                      • {it}
                    </T>
                  ))}
                </View>
                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2">
                  <T className="flex-1 text-2xs text-[#9FB0A9]">
                    Per {kit.plants} {kit.plants === 1 ? 'pianta' : 'piante'} in {SUBSTRATE_DEMAND[kit.medium].label.toLowerCase()}:{' '}
                    {cost.packs} {cost.packs === 1 ? 'pacchetto' : 'pacchetti'}
                    {cost.calmag ? ' + Cal-Mag' : ''}
                  </T>
                  <T className="font-grotesk-b text-[15px]" style={{ color: C.amber }}>
                    {eur(cost.total)}
                  </T>
                </View>
                <Button
                  className="mt-3"
                  tone="ghost"
                  color={C.sky}
                  label="Scarica scheda nutrizione"
                  icon={<Download size={15} color={C.sky} />}
                  onPress={() => share(l.id, pack)}
                />
              </Glass>
            </Enter>
          );
        })}
      </View>
      <T className="mx-6 mt-3 text-2xs leading-4 text-[#56655F]">
        Prezzi indicativi dei grow shop italiani per bottiglie da 1 L (dove non indicato). Il costo per il tuo ciclo stima il consumo dalle
        tabelle dei produttori, ridotte del 20–30%.
      </T>
    </>
  );
}

/* ───────────────────────── Yield ───────────────────────── */

export function YieldSection({ kit, set }: Props) {
  const [info, setInfo] = useState<string | null>(null);
  const indoor = SPACES.find((s) => s.id === kit.space)!.indoor;
  if (!indoor) return null;
  const cultivar = cultivarById(kit.cultivarId ?? '');
  const result = estimateYield(kit, cultivar);
  const auto = kit.kind === 'auto';
  const missing = [!kit.ledW && 'la lampada', !kit.technique && 'la tecnica'].filter(Boolean) as string[];
  const strains = CULTIVARS.filter((c) => c.tags.includes('autofiorente') === auto);

  return (
    <>
      <SectionHeader title="Resa stimata" caption="I grammi compaiono solo quando hai scelto spazio, lampada e tecnica" />
      <Enter i={3} className="mx-5">
        <Eyebrow>Tecnica</Eyebrow>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {TECHNIQUES.map((t) => {
            const on = kit.technique === t.id;
            const off = auto && !t.autoOk;
            return (
              <View key={t.id} className="flex-row items-center">
                <Pressable
                  disabled={off}
                  onPress={() => {
                    tap();
                    set({ technique: on ? undefined : t.id });
                  }}
                  className={cn(
                    'rounded-full border py-2 pl-3.5 pr-2.5 active:scale-[0.96] active:opacity-80',
                    on ? 'border-[#34D88A]/60 bg-[#34D88A]/[0.14]' : 'border-white/10 bg-white/[0.03]',
                    off && 'opacity-40',
                  )}
                >
                  <View className="flex-row items-center">
                    <T className="font-inter-sb text-xs" style={{ color: on ? C.leaf : '#C9D4CF' }}>
                      {t.label}
                    </T>
                    <Pressable
                      accessibilityLabel={`Cos'è ${t.label}`}
                      hitSlop={8}
                      onPress={() => {
                        tap();
                        setInfo(info === t.id ? null : t.id);
                      }}
                      className="ml-1.5 active:opacity-60"
                    >
                      <Info size={14} color={info === t.id ? C.sky : '#8A9A93'} />
                    </Pressable>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
        {info && (
          <View className="mt-2 rounded-2xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 p-3">
            <T className="font-inter-sb text-xs text-[#38BDF8]">{TECHNIQUES.find((t) => t.id === info)!.label}</T>
            <T className="mt-1 text-xs leading-[17px] text-[#DCE6E1]">{TECHNIQUES.find((t) => t.id === info)!.info}</T>
            {auto && !TECHNIQUES.find((t) => t.id === info)!.autoOk && (
              <T className="mt-1 text-2xs text-[#F7B946]">
                Non adatta alle autofiorenti: non c'è tempo per la vegetativa lunga o per le talee.
              </T>
            )}
          </View>
        )}

        <Eyebrow className="mt-4">Genetica (facoltativa)</Eyebrow>
      </Enter>
      <View className="mt-2">
        <View className="flex-row flex-wrap gap-2 px-5">
          {strains.slice(0, 8).map((c) => {
            const on = kit.cultivarId === c.id;
            const y = yieldLevel(c);
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  tap();
                  set({ cultivarId: on ? undefined : c.id });
                }}
                className={cn(
                  'w-[48.5%] rounded-2xl border p-3 active:scale-[0.97] active:opacity-80',
                  on ? 'border-[#34D88A]/50 bg-[#34D88A]/[0.12]' : 'border-white/[0.08] bg-white/[0.03]',
                )}
              >
                <T className="font-inter-sb text-[13px]" numberOfLines={1}>
                  {c.name}
                </T>
                <View className="mt-1.5">
                  <LevelScale level={y.level} label={y.label} small />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Enter i={4} className="mx-5 mt-3">
        {result ? (
          <Glass className="p-4" glow={C.leaf}>
            <Eyebrow>Raccolto stimato per ciclo</Eyebrow>
            <T className="mt-1 font-grotesk-b text-[34px] leading-[38px]" style={{ color: C.leaf }}>
              {result.range[0]}–{result.range[1]} g
            </T>
            <T className="text-xs text-[#8A9A93]">
              {result.perPlant[0]}–{result.perPlant[1]} g per pianta · {result.gpw[0].toFixed(2).replace('.', ',')}–
              {result.gpw[1].toFixed(2).replace('.', ',')} g/W
            </T>
            <View className="mt-3 flex-row flex-wrap gap-1.5">
              <Badge tone="violet">{SPACES.find((s) => s.id === kit.space)!.short}</Badge>
              <Badge tone="amber">{kit.ledW} W</Badge>
              <Badge tone="leaf">{result.tech.label}</Badge>
              {cultivar && <Badge tone="neutral">{cultivar.name}</Badge>}
            </View>
            <T className="mt-3 text-2xs leading-4 text-[#56655F]">
              Range realistico per chi coltiva in casa: il valore basso è un primo raccolto con qualche errore, quello alto una coltivazione
              ben seguita. Clima, genetica e esperienza contano quanto la lampada.
            </T>
          </Glass>
        ) : (
          <Glass className="flex-row items-center p-4">
            <Zap size={18} color="#56655F" />
            <T className="ml-3 flex-1 text-xs leading-[17px] text-[#8A9A93]">
              Scegli {missing.join(' e ')} per vedere i grammi stimati. Fino ad allora la resa resta una scala da 1 a 5.
            </T>
          </Glass>
        )}
      </Enter>
    </>
  );
}
