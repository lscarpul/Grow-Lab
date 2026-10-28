import { ArrowRight, Building2, CircleAlert, Droplets, Package, Scissors, Stethoscope, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { RangeBar } from '../components/charts';
import { Drawer } from '../components/Drawer';
import { Disclaimer, Enter, Screen } from '../components/layout';
import { OutdoorCalendar } from './OutdoorCalendar';
import { Badge, Bullet, ChipRow, cn, Divider, Eyebrow, Glass, KeyValue, SectionHeader, Segmented, T, tap } from '../components/ui';
import { CULTIVARS } from '../data/cultivars';
import { METRICS, MetricKey, STAGE_DAYS, STAGE_ORDER, STAGE_RANGES, STAGE_SHORT } from '../data/ranges';
import { STAGES } from '../data/stages';
import { STRAINS } from '../data/strains';
import { Guide, GUIDES, GuideId, guideById } from '../data/guides';
import { Stage, StrainType } from '../data/types';
import { fmtNum } from '../lib/math';
import { alpha, C, METRIC_COLOR, STAGE_COLOR, TYPE_COLOR } from '../theme/tokens';

const DIFF_LEVEL = { Facile: 1, Media: 2, Impegnativa: 3 } as const;

const HUB: { id: GuideId | 'diagnosi'; label: string; caption: string; color: string; Icon: typeof Sun }[] = [
  { id: 'diagnosi', label: 'Diagnostica', caption: 'Trova il problema dai sintomi', color: C.rose, Icon: Stethoscope },
  { id: 'raccolta', label: 'Raccolta', caption: 'Quando tagliare: i tricomi', color: C.amber, Icon: Scissors },
  { id: 'essiccazione', label: 'Essiccazione', caption: '7–14 giorni al buio', color: C.sky, Icon: Droplets },
  { id: 'concia', label: 'Concia', caption: 'Barattoli e burping', color: C.violet, Icon: Package },
];

export function GuideScreen({ onOpenDiagnosis }: { onOpenDiagnosis?: () => void }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [mode, setMode] = useState<'fasi' | 'tipi' | 'calendario'>('fasi');
  const [metric, setMetric] = useState<MetricKey>('temp');
  const [stage, setStage] = useState<Stage | null>(null);
  const [strain, setStrain] = useState<StrainType | null>(null);
  const maxDays = 100;

  return (
    <>
      <Screen
        eyebrow="Manuale del coltivatore"
        title="Guida"
        subtitle="Tutto il ciclo, dal seme al barattolo, con i parametri ideali per ogni fase e tipologia."
      >
        <Enter i={1} className="mx-5 mt-5 flex-row flex-wrap justify-between gap-y-2.5">
          {HUB.map((h) => (
            <Pressable
              key={h.id}
              onPress={() => {
                tap();
                if (h.id === 'diagnosi') onOpenDiagnosis?.();
                else setGuide(guideById(h.id));
              }}
              className="w-[48.5%] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0E161B] p-3.5 active:scale-[0.97] active:opacity-80"
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: alpha(h.color, 0.16) }}>
                <h.Icon size={17} color={h.color} />
              </View>
              <T className="mt-2.5 font-inter-sb text-[14px]">{h.label}</T>
              <T className="mt-0.5 text-2xs text-[#8A9A93]" numberOfLines={1}>
                {h.caption}
              </T>
              <View className="absolute right-3 top-3.5">
                <ArrowRight size={14} color="#56655F" />
              </View>
            </Pressable>
          ))}
        </Enter>
        <Enter i={2} className="mx-5 mt-5">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'fasi', label: 'Fasi' },
              { value: 'tipi', label: 'Tipologie' },
              { value: 'calendario', label: 'Calendario' },
            ]}
          />
        </Enter>

        {mode === 'fasi' ? (
          <>
            <SectionHeader title="Come cambiano i parametri" caption="Fascia ideale per fase sulla scala completa del parametro" />
            <Enter i={2}>
              <ChipRow
                options={(['temp', 'rh', 'vpd', 'ph', 'ec', 'ppfd'] as MetricKey[]).map((k) => ({
                  value: k,
                  label: METRICS[k].short,
                  color: METRIC_COLOR[k],
                }))}
                selected={[metric]}
                onToggle={setMetric}
              />
            </Enter>
            <Enter i={3} className="mx-5 mt-3">
              <Glass className="p-4">
                <View className="flex-row items-baseline justify-between">
                  <T className="font-inter-sb text-sm">{METRICS[metric].label}</T>
                  <T className="text-2xs text-[#56655F]">
                    scala {fmtNum(METRICS[metric].scale[0], 0)}–{fmtNum(METRICS[metric].scale[1], METRICS[metric].digits > 1 ? 1 : 0)}{' '}
                    {METRICS[metric].unit}
                  </T>
                </View>
                <View className="mt-3 gap-2.5">
                  {STAGE_ORDER.map((s) => {
                    const r = STAGE_RANGES[s][metric];
                    return (
                      <View key={s} className="flex-row items-center">
                        <T className="w-[52px] text-2xs text-[#A9B6B0]">{STAGE_SHORT[s]}</T>
                        <View className="flex-1">
                          {r ? (
                            <RangeBar scale={METRICS[metric].scale} ideal={r} color={STAGE_COLOR[s]} height={7} />
                          ) : (
                            <View className="h-[17px] justify-center">
                              <View className="h-px bg-white/[0.06]" />
                            </View>
                          )}
                        </View>
                        <T className="w-[74px] text-right font-grotesk-md text-2xs" style={{ color: r ? '#ECF3EF' : '#3E4C46' }}>
                          {r ? `${fmtNum(r[0], METRICS[metric].digits)}–${fmtNum(r[1], METRICS[metric].digits)}` : 'n/d'}
                        </T>
                      </View>
                    );
                  })}
                </View>
              </Glass>
            </Enter>

            <SectionHeader title="Durata delle fasi" caption="Minimo e massimo tipici, in giorni" />
            <Enter i={4} className="mx-5">
              <Glass className="p-4">
                {STAGE_ORDER.map((s, i) => {
                  const [lo, hi] = STAGE_DAYS[s];
                  return (
                    <View key={s} className={cn('flex-row items-center', i > 0 && 'mt-2.5')}>
                      <T className="w-[52px] text-2xs text-[#A9B6B0]">{STAGE_SHORT[s]}</T>
                      <View className="h-3 flex-1 justify-center">
                        <View className="h-px bg-white/[0.06]" />
                        <View
                          style={{
                            position: 'absolute',
                            left: `${(lo / maxDays) * 100}%`,
                            width: `${Math.max(1.5, ((hi - lo) / maxDays) * 100)}%`,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: alpha(STAGE_COLOR[s], 0.75),
                          }}
                        />
                      </View>
                      <T className="w-[56px] text-right font-grotesk-md text-2xs">
                        {lo}–{hi} gg
                      </T>
                    </View>
                  );
                })}
                <View className="ml-[52px] mr-[56px] mt-2 flex-row justify-between">
                  {[0, 25, 50, 75, 100].map((d) => (
                    <T key={d} className="text-[9px] text-[#56655F]">
                      {d}
                    </T>
                  ))}
                </View>
              </Glass>
            </Enter>

            <SectionHeader title="Le 7 fasi" caption="Tocca una fase per la guida passo passo" />
            <View className="mx-5">
              {STAGES.map((s, i) => (
                <Enter i={5 + i} key={s.id}>
                  <Pressable onPress={() => setStage(s)} className="flex-row active:scale-[0.97] active:opacity-70">
                    <View className="items-center" style={{ width: 34 }}>
                      <View
                        className="h-[34px] w-[34px] items-center justify-center rounded-full"
                        style={{
                          backgroundColor: alpha(STAGE_COLOR[s.id], 0.14),
                          borderWidth: 1,
                          borderColor: alpha(STAGE_COLOR[s.id], 0.45),
                        }}
                      >
                        <T className="font-grotesk-b text-sm" style={{ color: STAGE_COLOR[s.id] }}>
                          {i + 1}
                        </T>
                      </View>
                      {i < STAGES.length - 1 && (
                        <View className="w-[2px] flex-1" style={{ backgroundColor: alpha(STAGE_COLOR[s.id], 0.25) }} />
                      )}
                    </View>
                    <Glass className="mb-3 ml-3 flex-1 p-4">
                      <View className="flex-row items-center justify-between">
                        <T className="font-grotesk-b text-[17px]">{s.name}</T>
                        <ArrowRight size={15} color="#56655F" />
                      </View>
                      <T className="mt-0.5 font-inter-sb text-2xs" style={{ color: STAGE_COLOR[s.id] }}>
                        {s.duration}
                      </T>
                      <T className="mt-1.5 text-xs leading-[17px] text-[#9FB0A9]">{s.goal}</T>
                      <View className="mt-2.5 flex-row flex-wrap gap-1.5">
                        {s.params.slice(0, 3).map((p) => (
                          <View key={p.label} className="max-w-full rounded-lg bg-white/[0.04] px-2 py-1">
                            <T className="text-[9.5px] text-[#8A9A93]">
                              {p.label} <T className="font-inter-sb text-[9.5px] text-[#ECF3EF]">{p.value}</T>
                            </T>
                          </View>
                        ))}
                      </View>
                    </Glass>
                  </Pressable>
                </Enter>
              ))}
            </View>
          </>
        ) : mode === 'tipi' ? (
          <>
            <SectionHeader title="Tipologie di cannabis" caption="Caratteristiche, tempi e regole di coltivazione" />
            <View className="mx-5 flex-row flex-wrap justify-between gap-y-3">
              {STRAINS.map((s, i) => {
                const color = TYPE_COLOR[s.id];
                const wide = i === 0 || i === 3;
                const n = CULTIVARS.filter((c) => c.tags.includes(s.id)).length;
                return (
                  <Enter i={2 + i} key={s.id} className={wide ? 'w-full' : 'w-[48.5%]'}>
                    <Pressable className="active:scale-[0.97] active:opacity-70" onPress={() => setStrain(s)}>
                      <Glass className="p-4" glow={color}>
                        <View className="flex-row items-center justify-between">
                          <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: alpha(color, 0.15) }}>
                            <T className="text-lg">{s.emoji}</T>
                          </View>
                          <Badge color={color}>{s.difficulty}</Badge>
                        </View>
                        <T className="mt-3 font-grotesk-b text-[18px]">{s.name}</T>
                        <T className="mt-1 text-xs leading-[17px] text-[#9FB0A9]" numberOfLines={wide ? 3 : 4}>
                          {s.summary}
                        </T>
                        <View className="mt-3">
                          <View className="mb-1 flex-row justify-between">
                            <T className="text-[9.5px] text-[#8A9A93]">Fioritura</T>
                            <T className="font-grotesk-md text-[10px]">
                              {s.floweringWeeks[0]}–{s.floweringWeeks[1]} sett.
                            </T>
                          </View>
                          <RangeBar scale={[4, 15]} ideal={s.floweringWeeks} color={color} height={6} />
                        </View>
                        <View className="mt-2 flex-row items-center justify-between">
                          <View className="flex-row gap-[3px]">
                            {[1, 2, 3].map((k) => (
                              <View
                                key={k}
                                className="h-1.5 w-4 rounded-full"
                                style={{ backgroundColor: k <= DIFF_LEVEL[s.difficulty] ? color : 'rgba(255,255,255,0.08)' }}
                              />
                            ))}
                          </View>
                          <T className="text-[9.5px] text-[#56655F]">{n} genetiche</T>
                        </View>
                      </Glass>
                    </Pressable>
                  </Enter>
                );
              })}
            </View>
          </>
        ) : (
          <OutdoorCalendar />
        )}
        <Disclaimer />
      </Screen>
      <StageDrawer stage={stage} onClose={() => setStage(null)} />
      <StrainDrawer strain={strain} onClose={() => setStrain(null)} />
      <GuideDrawer guide={guide} onClose={() => setGuide(null)} />
    </>
  );
}

function EnvToggle({ env, setEnv }: { env: 'indoor' | 'outdoor'; setEnv: (e: 'indoor' | 'outdoor') => void }) {
  return (
    <Segmented
      value={env}
      onChange={setEnv}
      options={[
        { value: 'indoor', label: 'Indoor', icon: <Building2 size={14} color={env === 'indoor' ? C.leaf : '#8A9A93'} /> },
        { value: 'outdoor', label: 'Outdoor', icon: <Sun size={14} color={env === 'outdoor' ? C.leaf : '#8A9A93'} /> },
      ]}
    />
  );
}

function StageDrawer({ stage: s, onClose }: { stage: Stage | null; onClose: () => void }) {
  const [env, setEnv] = useState<'indoor' | 'outdoor'>('indoor');
  if (!s)
    return (
      <Drawer open={false} onClose={onClose} header={null}>
        {null}
      </Drawer>
    );
  const color = STAGE_COLOR[s.id];
  const ranges = STAGE_RANGES[s.id];
  const idx = STAGE_ORDER.indexOf(s.id);
  return (
    <Drawer
      open
      onClose={onClose}
      accent={color}
      header={
        <View>
          <Badge color={color} dot>
            Fase {idx + 1} di 7 · {s.duration}
          </Badge>
          <T className="mt-2 font-grotesk-b text-[28px] tracking-[-0.8px]">{s.name}</T>
          <T className="text-[13px] leading-[19px] text-[#9FB0A9]">{s.goal}</T>
        </View>
      }
    >
      {Object.keys(ranges).length > 0 && (
        <Glass className="mx-5 p-4">
          <Eyebrow>Fasce ideali</Eyebrow>
          <View className="mt-3 gap-3">
            {(Object.keys(ranges) as MetricKey[]).map((k) => (
              <View key={k}>
                <View className="mb-1 flex-row justify-between">
                  <T className="text-xs text-[#A9B6B0]">{METRICS[k].label}</T>
                  <T className="font-inter-sb text-xs" style={{ color: METRIC_COLOR[k] }}>
                    {fmtNum(ranges[k]![0], METRICS[k].digits)}–{fmtNum(ranges[k]![1], METRICS[k].digits)} {METRICS[k].unit}
                  </T>
                </View>
                <RangeBar scale={METRICS[k].scale} ideal={ranges[k]} color={METRIC_COLOR[k]} />
              </View>
            ))}
          </View>
        </Glass>
      )}

      <Glass className="mx-5 mt-3 px-4 py-1">
        {s.params.map((p, i) => (
          <View key={p.label}>
            {i > 0 && <Divider />}
            <KeyValue label={p.label} value={p.value} />
          </View>
        ))}
      </Glass>

      <View className="mx-5 mt-6">
        <Eyebrow>Passo dopo passo</Eyebrow>
        <View className="mt-3 gap-2.5">
          {s.steps.map((step, i) => (
            <View key={step} className="flex-row rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5">
              <View className="mr-3 h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: alpha(color, 0.16) }}>
                <T className="font-grotesk-b text-xs" style={{ color }}>
                  {i + 1}
                </T>
              </View>
              <T className="flex-1 text-[13px] leading-5 text-[#C9D4CF]">{step}</T>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-5 mt-6">
        <EnvToggle env={env} setEnv={setEnv} />
      </View>
      <Glass className="mx-5 mt-3 p-4">
        {(env === 'indoor' ? s.indoor : s.outdoor).map((t) => (
          <Bullet key={t} color={color}>
            {t}
          </Bullet>
        ))}
        {s.autoNotes?.map((t) => (
          <Bullet key={t} color={C.sky}>
            {t}
          </Bullet>
        ))}
      </Glass>

      <View
        className="mx-5 mt-3 rounded-[22px] p-4"
        style={{ backgroundColor: alpha(C.rose, 0.07), borderWidth: 1, borderColor: alpha(C.rose, 0.2) }}
      >
        <View className="flex-row items-center">
          <CircleAlert size={14} color={C.rose} />
          <Eyebrow className="ml-2 text-[#FB7185]">Errori da evitare</Eyebrow>
        </View>
        <View className="mt-3">
          {s.mistakes.map((m) => (
            <Bullet key={m} color={C.rose}>
              {m}
            </Bullet>
          ))}
        </View>
      </View>

      <View
        className="mx-5 mt-3 rounded-[22px] p-4"
        style={{ backgroundColor: alpha(C.leaf, 0.07), borderWidth: 1, borderColor: alpha(C.leaf, 0.2) }}
      >
        <Eyebrow className="text-[#34D88A]">Passa alla fase successiva quando</Eyebrow>
        <T className="mt-2 text-[13px] leading-5">{s.nextWhen}</T>
      </View>
    </Drawer>
  );
}

function StrainDrawer({ strain: s, onClose }: { strain: StrainType | null; onClose: () => void }) {
  const [env, setEnv] = useState<'indoor' | 'outdoor'>('indoor');
  if (!s)
    return (
      <Drawer open={false} onClose={onClose} header={null}>
        {null}
      </Drawer>
    );
  const color = TYPE_COLOR[s.id];
  const examples = CULTIVARS.filter((c) => c.tags.includes(s.id)).slice(0, 5);
  return (
    <Drawer
      open
      onClose={onClose}
      accent={color}
      header={
        <View>
          <Badge color={color} dot>
            Difficoltà {s.difficulty.toLowerCase()}
          </Badge>
          <T className="mt-2 font-grotesk-b text-[28px] tracking-[-0.8px]">
            {s.emoji} {s.name}
          </T>
          <T className="text-[13px] leading-[19px] text-[#9FB0A9]">{s.summary}</T>
        </View>
      }
    >
      <Glass className="mx-5 px-4 py-1">
        {s.traits.map((t, i) => (
          <View key={t.label}>
            {i > 0 && <Divider />}
            <KeyValue label={t.label} value={t.value} />
          </View>
        ))}
      </Glass>

      <View className="mx-5 mt-5">
        <EnvToggle env={env} setEnv={setEnv} />
      </View>
      <Glass className="mx-5 mt-3 px-4 py-1">
        {s[env].params.map((p, i) => (
          <View key={p.label}>
            {i > 0 && <Divider />}
            <KeyValue label={p.label} value={p.value} accent={color} />
          </View>
        ))}
      </Glass>
      <Glass className="mx-5 mt-3 p-4">
        <Eyebrow>Consigli {env}</Eyebrow>
        <View className="mt-3">
          {s[env].tips.map((t) => (
            <Bullet key={t} color={color}>
              {t}
            </Bullet>
          ))}
        </View>
      </Glass>

      <View
        className="mx-5 mt-3 rounded-[22px] p-4"
        style={{ backgroundColor: alpha(C.rose, 0.07), borderWidth: 1, borderColor: alpha(C.rose, 0.2) }}
      >
        <Eyebrow className="text-[#FB7185]">Errori comuni</Eyebrow>
        <View className="mt-3">
          {s.mistakes.map((m) => (
            <Bullet key={m} color={C.rose}>
              {m}
            </Bullet>
          ))}
        </View>
      </View>

      {examples.length > 0 && (
        <View className="mx-5 mt-6">
          <Eyebrow>Genetiche di questo tipo nel catalogo</Eyebrow>
          <View className="mt-3 gap-2">
            {examples.map((c) => (
              <View
                key={c.id}
                className="flex-row items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3"
              >
                <View className="flex-1">
                  <T className="font-inter-sb text-[13px]">{c.name}</T>
                  <T className="text-2xs text-[#8A9A93]">{c.lineage}</T>
                </View>
                <T className="font-grotesk text-xs" style={{ color }}>
                  {c.floweringDays[0]}–{c.floweringDays[1]} gg
                </T>
              </View>
            ))}
          </View>
        </View>
      )}
    </Drawer>
  );
}

const GUIDE_COLOR: Record<GuideId, string> = { raccolta: C.amber, essiccazione: C.sky, concia: C.violet };

function GuideDrawer({ guide: g, onClose }: { guide: Guide | null; onClose: () => void }) {
  // Keep the last guide while the sheet animates out.
  const [last, setLast] = useState<Guide | null>(g);
  if (g && g !== last) setLast(g);
  const shown = g ?? last;
  const color = shown ? GUIDE_COLOR[shown.id] : C.leaf;
  return (
    <Drawer
      open={!!g}
      onClose={onClose}
      accent={color}
      header={
        shown && (
          <View>
            <Badge color={color} dot>
              {shown.duration}
            </Badge>
            <T className="mt-2 font-grotesk-b text-[26px] tracking-[-0.6px]">{shown.title}</T>
            <T className="text-[13px] text-[#8A9A93]">{shown.subtitle}</T>
          </View>
        )
      }
    >
      {shown && (
        <View className="px-5">
          <Glass className="p-4">
            <Eyebrow>Valori da tenere</Eyebrow>
            <View className="mt-2">
              {shown.target.map((t) => (
                <KeyValue key={t.label} label={t.label} value={t.value} accent={color} />
              ))}
            </View>
          </Glass>
          <Eyebrow className="mt-5">Passo per passo</Eyebrow>
          <View className="mt-3 gap-3">
            {shown.steps.map((st, i) => (
              <View key={st.title} className="flex-row">
                <View className="mr-3 h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: alpha(color, 0.16) }}>
                  <T className="font-grotesk-b text-xs" style={{ color }}>
                    {i + 1}
                  </T>
                </View>
                <View className="flex-1">
                  <T className="font-inter-sb text-[14px]">{st.title}</T>
                  <T className="mt-0.5 text-[13px] leading-5 text-[#B7C3BE]">{st.text}</T>
                </View>
              </View>
            ))}
          </View>
          <Eyebrow className="mt-5">Cosa preparare</Eyebrow>
          <View className="mt-2 gap-1.5">
            {shown.checks.map((c) => (
              <Bullet key={c} color={color}>
                {c}
              </Bullet>
            ))}
          </View>
          <Eyebrow className="mt-5">Errori da evitare</Eyebrow>
          <View className="mt-2 gap-1.5">
            {shown.mistakes.map((m) => (
              <Bullet key={m} color={C.rose}>
                {m}
              </Bullet>
            ))}
          </View>
        </View>
      )}
    </Drawer>
  );
}
