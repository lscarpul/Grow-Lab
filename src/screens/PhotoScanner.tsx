import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ExternalLink, ImagePlus, KeyRound, Lock, ScanLine, Sparkles, Trash2, TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Drawer } from '../components/Drawer';
import { Enter } from '../components/layout';
import { Badge, Button, cn, Eyebrow, Glass, SectionHeader, T, tap } from '../components/ui';
import { cultivarById } from '../data/cultivars';
import { Plant } from '../data/grows';
import { PROBLEMS } from '../data/problems';
import { stageById } from '../data/stages';
import { Problem } from '../data/types';
import { Diagnosis, DiagnosisContext, DiagnosisError, diagnosePhoto, diagnosisMode, KEY_URL } from '../lib/diagnosis';
import { latest, stageProgress } from '../lib/insights';
import { fmtDate, fmtTime } from '../lib/math';
import { useStore } from '../state/store';
import { alpha, C, STAGE_COLOR } from '../theme/tokens';
import { CAT_COLOR, ProblemDrawer } from './DiagnoseScreen';

const OVERALL = {
  sana: { label: 'Pianta sana', color: C.leaf },
  attenzione: { label: "Da tenere d'occhio", color: C.amber },
  critica: { label: 'Intervieni subito', color: C.rose },
} as const;

function contextFor(p: Plant | undefined, note: string): DiagnosisContext {
  if (!p) return { note: note || undefined };
  const c = cultivarById(p.cultivarId);
  const r = latest(p);
  return {
    cultivar: c?.name,
    types: c?.tags,
    stage: stageById(p.stage)?.name ?? p.stage,
    dayInStage: stageProgress(p).day,
    environment: p.env,
    medium: `${p.medium}${p.potL ? ` ${p.potL} L` : ''}`,
    readings: r ? { temp: r.temp, rh: r.rh, vpd: r.vpd, ph: r.ph, ec: r.ec } : undefined,
    note: note || undefined,
  };
}

export function PhotoScanner() {
  const { plants, aiKey, scans, addScan, deviceId } = useStore();
  const mode = diagnosisMode(aiKey);
  const [remaining, setRemaining] = useState<number | null>(null);
  const living = plants.filter((p) => ['germinazione', 'piantina', 'vegetativa', 'fioritura'].includes(p.stage));
  const [plantId, setPlantId] = useState<string | null>(living[0]?.id ?? null);
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ d: Diagnosis; demo: boolean; model?: string } | null>(null);
  const [settings, setSettings] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const abort = useRef<AbortController | null>(null);
  const plant = plants.find((p) => p.id === plantId);

  useEffect(() => () => abort.current?.abort(), []);

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    const perm =
      source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(source === 'camera' ? 'Serve il permesso per la fotocamera.' : 'Serve il permesso per la galleria.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9, allowsEditing: false };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]) return;
    await analyse(res.assets[0]);
  };

  const analyse = async (asset: ImagePicker.ImagePickerAsset) => {
    setBusy(true);
    setResult(null);
    try {
      // Downscale to keep the upload small and fast; 1280 px is plenty to see leaf detail.
      const ctx = ImageManipulator.manipulate(asset.uri);
      if (asset.width > 1280) ctx.resize({ width: 1280 });
      const rendered = await ctx.renderAsync();
      const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true });
      setImage(saved.uri);
      const context = contextFor(plant, note);
      abort.current = new AbortController();
      const out = await diagnosePhoto({ deviceId, devKey: aiKey, imageBase64: saved.base64!, context }, abort.current.signal);
      if (out.remaining !== undefined) setRemaining(out.remaining);
      const demo = mode === 'demo';
      setResult({ d: out.result, demo, model: out.model });
      addScan({ plantId, imageUri: saved.uri, result: out.result, demo });
    } catch (e) {
      setError(e instanceof DiagnosisError ? e.message : "Analisi non riuscita. Riprova con un'altra foto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Status */}
      <Enter i={1} className="mx-5 mt-4">
        <Pressable className="active:opacity-70 active:scale-[0.97]" disabled={mode === 'server'} onPress={() => setSettings(true)}>
          <Glass className="flex-row items-center p-4" glow={mode === 'demo' ? C.amber : C.leaf}>
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: alpha(mode === 'demo' ? C.amber : C.leaf, 0.15) }}
            >
              {mode === 'demo' ? <KeyRound size={18} color={C.amber} /> : <Sparkles size={18} color={C.leaf} />}
            </View>
            <View className="ml-3 flex-1">
              <T className="font-inter-sb text-[13px]">
                {mode === 'server' ? 'Analisi AI attiva' : mode === 'dev' ? 'AI attiva · modalità sviluppatore' : 'Modalità esempio'}
              </T>
              <T className="mt-0.5 text-xs leading-[17px] text-[#8A9A93]">
                {mode === 'server'
                  ? remaining !== null
                    ? `Ti restano ${remaining} analisi oggi.`
                    : 'Le foto vengono analizzate in modo anonimo e non salvate sul server.'
                  : mode === 'dev'
                    ? 'Usa la tua chiave Gemini personale, solo per i test.'
                    : 'Servizio di analisi non configurato: vedrai un risultato di prova.'}
              </T>
            </View>
            {mode !== 'server' && <Badge tone={mode === 'dev' ? 'leaf' : 'amber'}>{mode === 'dev' ? 'Test' : 'Configura'}</Badge>}
          </Glass>
        </Pressable>
      </Enter>

      {/* Plant context */}
      <SectionHeader title="Quale pianta?" caption="Genetica, fase e misure aiutano l'AI a distinguere cause simili" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {[...living, null].map((p) => {
          const active = (p?.id ?? null) === plantId;
          const color = p ? STAGE_COLOR[p.stage] : '#9AA9A2';
          return (
            <Pressable
              key={p?.id ?? 'none'}
              onPress={() => {
                tap();
                setPlantId(p?.id ?? null);
              }}
              className="w-[140px] rounded-2xl p-3 active:opacity-70 active:scale-[0.97]"
              style={{
                backgroundColor: active ? alpha(color, 0.14) : 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: active ? alpha(color, 0.5) : 'rgba(255,255,255,0.08)',
              }}
            >
              <T className="font-inter-sb text-[13px]" numberOfLines={1}>
                {p ? p.nickname : 'Altra pianta'}
              </T>
              <T className="mt-0.5 text-2xs text-[#8A9A93]" numberOfLines={1}>
                {p ? `${cultivarById(p.cultivarId)?.name} · ${stageById(p.stage)?.name}` : 'Senza contesto'}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>
      <View className="mx-5 mt-3">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Nota facoltativa: es. ho concimato ieri, macchie da 3 giorni"
          placeholderTextColor="#56655F"
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-inter text-[13px] text-[#ECF3EF]"
        />
      </View>

      {/* Capture */}
      <Enter i={2} className="mx-5 mt-4">
        <Glass className="overflow-hidden p-0" glow={C.violet}>
          {image ? (
            <View>
              <Image source={{ uri: image }} style={{ width: '100%', aspectRatio: 4 / 3 }} resizeMode="cover" />
              {busy && <ScanOverlay />}
            </View>
          ) : (
            <View className="items-center px-5 py-8">
              <View className="h-14 w-14 items-center justify-center rounded-3xl" style={{ backgroundColor: alpha(C.violet, 0.15) }}>
                <ScanLine size={26} color={C.violet} />
              </View>
              <T className="mt-3 font-grotesk text-[17px]">Fotografa il problema</T>
              <T className="mt-1 text-center text-xs leading-[17px] text-[#8A9A93]">
                Luce bianca (spegni il LED viola), 20–30 cm dalle foglie colpite, una foto nitida per volta.
              </T>
            </View>
          )}
          <View className="flex-row gap-2 p-3">
            <Button
              className="flex-1"
              color={C.violet}
              label="Scatta"
              icon={<Camera size={16} color="#05080A" />}
              onPress={() => pick('camera')}
              disabled={busy}
            />
            <Button
              className="flex-1"
              tone="ghost"
              color={C.violet}
              label="Galleria"
              icon={<ImagePlus size={16} color={C.violet} />}
              onPress={() => pick('library')}
              disabled={busy}
            />
          </View>
        </Glass>
      </Enter>

      {busy && (
        <T className="mx-5 mt-3 text-center text-xs text-[#8A9A93]">
          {mode === 'demo' ? 'Preparo un risultato di esempio…' : 'Analisi in corso…'}
        </T>
      )}
      {error && (
        <View
          className="mx-5 mt-3 flex-row rounded-2xl p-3.5"
          style={{ backgroundColor: alpha(C.rose, 0.08), borderWidth: 1, borderColor: alpha(C.rose, 0.25) }}
        >
          <TriangleAlert size={16} color={C.rose} />
          <T className="ml-2.5 flex-1 text-xs leading-[17px] text-[#F3C6CE]">{error}</T>
        </View>
      )}

      {result && (
        <ResultCard d={result.d} demo={result.demo} model={result.model} onProblem={setProblem} onConfigure={() => setSettings(true)} />
      )}

      {/* History */}
      {scans.length > 0 && (
        <>
          <SectionHeader title="Analisi recenti" caption={`${scans.length} salvate su questo telefono`} />
          <View className="mx-5 gap-2">
            {scans.slice(0, 6).map((s) => {
              const o = OVERALL[s.result.overall];
              const p = plants.find((x) => x.id === s.plantId);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    setImage(s.imageUri);
                    setResult({ d: s.result, demo: s.demo });
                  }}
                  className="flex-row items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 active:opacity-70 active:scale-[0.97]"
                >
                  <Image source={{ uri: s.imageUri }} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#0E161B' }} />
                  <View className="ml-3 flex-1">
                    <T className="font-inter-sb text-[13px]" numberOfLines={1}>
                      {s.result.findings[0]?.name ?? o.label}
                    </T>
                    <T className="text-2xs text-[#8A9A93]">
                      {p?.nickname ?? 'Altra pianta'} · {fmtDate(new Date(s.date))} {fmtTime(new Date(s.date))}
                      {s.demo ? ' · esempio' : ''}
                    </T>
                  </View>
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: o.color }} />
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <KeySettings open={settings} onClose={() => setSettings(false)} />
      <ProblemDrawer problem={problem} onClose={() => setProblem(null)} />
    </>
  );
}

function ScanOverlay() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(y);
  }, [y]);
  const line = useAnimatedStyle(() => ({ top: `${y.value * 100}%` }));
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(5,8,10,0.35)' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: C.violet,
            shadowColor: C.violet,
            shadowOpacity: 1,
            shadowRadius: 12,
          },
          line,
        ]}
      />
    </View>
  );
}

function ResultCard({
  d,
  demo,
  model,
  onProblem,
  onConfigure,
}: {
  d: Diagnosis;
  demo: boolean;
  model?: string;
  onProblem: (p: Problem) => void;
  onConfigure: () => void;
}) {
  const o = OVERALL[d.overall];
  return (
    <Enter i={0} className="mx-5 mt-4">
      {demo && (
        <Pressable
          onPress={onConfigure}
          className="mb-2 flex-row items-center rounded-2xl px-3.5 py-2.5 active:opacity-70 active:scale-[0.97]"
          style={{ backgroundColor: alpha(C.amber, 0.1), borderWidth: 1, borderColor: alpha(C.amber, 0.3) }}
        >
          <TriangleAlert size={14} color={C.amber} />
          <T className="ml-2 flex-1 text-xs text-[#F7D9A0]">Risultato di esempio, non basato sulla tua foto.</T>
        </Pressable>
      )}
      <Glass className="p-4" glow={o.color}>
        <View className="flex-row items-center justify-between">
          <Badge color={o.color} dot>
            {o.label}
          </Badge>
          <T className="text-2xs text-[#56655F]">Foto {d.photoQuality}</T>
        </View>
        {!d.isCannabisPlant && <T className="mt-3 font-inter-sb text-[13px] text-[#F7B946]">Non sembra una pianta di cannabis.</T>}
        <T className="mt-3 text-[13.5px] leading-5 text-[#DCE6E1]">{d.summary}</T>
        {!!d.photoNote && d.photoQuality !== 'buona' && <T className="mt-2 text-xs leading-[17px] text-[#8A9A93]">📷 {d.photoNote}</T>}

        {d.findings.length > 0 && (
          <>
            <Eyebrow className="mt-5">Problemi probabili</Eyebrow>
            <View className="mt-3 gap-3">
              {d.findings.map((f) => {
                const p = PROBLEMS.find((x) => x.id === f.problemId);
                const color = p ? CAT_COLOR[p.category] : '#9AA9A2';
                return (
                  <Pressable className="active:opacity-70 active:scale-[0.97]" key={`${f.problemId}-${f.name}`} disabled={!p} onPress={() => p && onProblem(p)}>
                    <View className="flex-row items-baseline justify-between">
                      <T className="flex-1 font-inter-sb text-[13px]">{f.name}</T>
                      <T className="font-grotesk-b text-[15px]" style={{ color }}>
                        {f.confidence}%
                      </T>
                    </View>
                    <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <View style={{ width: `${f.confidence}%`, height: '100%', borderRadius: 6, backgroundColor: color }} />
                    </View>
                    <T className="mt-1.5 text-xs leading-[17px] text-[#9FB0A9]">{f.evidence}</T>
                    {p && <T className="mt-1 font-inter-sb text-2xs text-[#34D88A]">Apri scheda: cause, soluzioni, prevenzione ›</T>}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {d.actions.length > 0 && (
          <>
            <Eyebrow className="mt-5">Cosa fare</Eyebrow>
            <View className="mt-3 gap-2">
              {d.actions.map((a, i) => (
                <View key={a} className="flex-row">
                  <View className="mr-3 h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: alpha(C.leaf, 0.16) }}>
                    <T className="font-grotesk-b text-xs text-[#34D88A]">{i + 1}</T>
                  </View>
                  <T className="flex-1 text-[13px] leading-5 text-[#C9D4CF]">{a}</T>
                </View>
              ))}
            </View>
          </>
        )}
        {!!d.followUp && (
          <View className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            <T className="text-xs leading-[17px] text-[#9FB0A9]">
              <T className="font-inter-sb text-xs text-[#ECF3EF]">Controllo: </T>
              {d.followUp}
            </T>
          </View>
        )}
        <T className="mt-3 text-2xs leading-4 text-[#56655F]">
          Diagnosi indicativa{model ? ` · ${model}` : ''}. In caso di dubbio confronta con le schede dei sintomi e verifica pH ed EC prima
          di intervenire.
        </T>
      </Glass>
    </Enter>
  );
}

function KeySettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { aiKey, setAiKey } = useStore();
  const [draft, setDraft] = useState(aiKey);
  useEffect(() => setDraft(aiKey), [aiKey, open]);
  const valid = /^AIza[0-9A-Za-z_-]{30,}$/.test(draft.trim());
  return (
    <Drawer
      open={open}
      onClose={onClose}
      accent={C.violet}
      header={
        <View>
          <Badge tone="violet" dot>
            Sviluppatore
          </Badge>
          <T className="mt-2 font-grotesk-b text-[26px] tracking-[-0.6px]">Chiave di test</T>
          <T className="text-[13px] text-[#8A9A93]">
            Solo per provare l'analisi prima di pubblicare il server. Nella versione in vendita le foto passano dal server Grow Lab.
          </T>
        </View>
      }
    >
      <View className="px-5">
        {[
          { n: 1, t: 'Apri Google AI Studio e accedi con il tuo account Google.' },
          { n: 2, t: 'Tocca "Create API key" e copia la chiave (inizia con AIza…).' },
          { n: 3, t: 'Incollala qui sotto e salva. Fatto.' },
        ].map((s) => (
          <View key={s.n} className="mb-3 flex-row">
            <View className="mr-3 h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: alpha(C.violet, 0.18) }}>
              <T className="font-grotesk-b text-xs" style={{ color: C.violet }}>
                {s.n}
              </T>
            </View>
            <T className="flex-1 text-[13.5px] leading-5 text-[#C9D4CF]">{s.t}</T>
          </View>
        ))}
        <Button
          tone="ghost"
          color={C.violet}
          label="Apri Google AI Studio"
          icon={<ExternalLink size={15} color={C.violet} />}
          onPress={() => Linking.openURL(KEY_URL)}
        />
        <Eyebrow className="mt-5">La tua chiave</Eyebrow>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="AIza…"
          placeholderTextColor="#56655F"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          className={cn(
            'mt-2 rounded-2xl border bg-white/[0.04] px-4 py-3 font-inter text-[14px] text-[#ECF3EF]',
            draft && !valid ? 'border-[#FB7185]/50' : 'border-white/10',
          )}
        />
        {draft.length > 0 && !valid && (
          <T className="mt-1.5 text-2xs text-[#FB7185]">Non sembra una chiave Gemini: dovrebbe iniziare con "AIza".</T>
        )}
        <View className="mt-3 flex-row gap-2">
          {aiKey ? (
            <Button
              className="flex-1"
              tone="ghost"
              color={C.rose}
              label="Rimuovi"
              icon={<Trash2 size={15} color={C.rose} />}
              onPress={() => {
                setAiKey('');
                setDraft('');
              }}
            />
          ) : null}
          <Button
            className="flex-[2]"
            color={C.violet}
            label="Salva chiave"
            disabled={!valid}
            onPress={() => {
              setAiKey(draft);
              onClose();
            }}
          />
        </View>

        <Glass className="mt-6 p-4">
          <View className="flex-row items-center">
            <Lock size={14} color="#9AA9A2" />
            <Eyebrow className="ml-2">Da sapere</Eyebrow>
          </View>
          <T className="mt-2 text-xs leading-[18px] text-[#9FB0A9]">
            • La chiave resta solo su questo telefono e la foto va direttamente da qui a Google.{'\n'}• Il piano gratuito di Gemini va bene
            per i tuoi test, ma i termini Google non lo permettono per un'app offerta a utenti nell'UE: per la versione in vendita serve il
            server con chiave a pagamento.{'\n'}• Con il piano gratuito Google può usare le immagini inviate per migliorare i suoi servizi.
            {'\n'}• L'AI può sbagliare: usala come secondo parere insieme alle schede dei sintomi.
          </T>
        </Glass>
      </View>
    </Drawer>
  );
}
