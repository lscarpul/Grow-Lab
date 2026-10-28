import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildUserPlant, LogEntry, LogKind, Measurement, Plant, UserPlantSpec } from '../data/grows';
import { DEFAULT_KIT, KitConfig } from '../data/kit';
import { StageId } from '../data/types';
import { Diagnosis } from '../lib/diagnosis';
import { envScore, estimateHarvest } from '../lib/insights';

const K = {
  logs: 'growlab.userlogs.v1',
  done: 'growlab.tasksdone.v1',
  plants: 'growlab.userplants.v1',
  measures: 'growlab.measures.v1',
  owned: 'growlab.kitowned.v1',
  kit: 'growlab.kitconfig.v1',
  scans: 'growlab.scans.v1',
  aiKey: 'growlab.aikey.v1',
  device: 'growlab.device.v1',
  adult: 'growlab.adult.v1',
  onboarded: 'growlab.onboarded.v1',
};

interface StoredLog {
  id: string;
  plantId: string;
  date: string;
  kind: LogKind;
  title: string;
  detail: string;
  metrics?: { label: string; value: string }[];
}

export interface Scan {
  id: string;
  date: string;
  plantId: string | null;
  imageUri: string;
  result: Diagnosis;
  demo: boolean;
}

export type NewPlant = Omit<UserPlantSpec, 'id' | 'createdAt'>;

export type NewMeasurement = Omit<Measurement, 'id' | 'plantId' | 'date'>;

interface Store {
  plants: Plant[];
  userPlantCount: number;
  addPlant: (spec: NewPlant) => string;
  advanceStage: (plantId: string, stage: StageId) => void;
  deletePlant: (plantId: string) => void;
  addMeasurement: (plantId: string, m: NewMeasurement) => void;
  addLog: (plantId: string, kind: LogKind, title: string, detail: string, metrics?: StoredLog['metrics']) => void;
  doneTasks: string[];
  toggleTask: (id: string) => void;
  kit: KitConfig;
  setKit: (k: KitConfig) => void;
  owned: string[];
  toggleOwned: (id: string) => void;
  scans: Scan[];
  addScan: (s: Omit<Scan, 'id' | 'date'>) => void;
  aiKey: string;
  setAiKey: (k: string) => void;
  deviceId: string;
  adult: boolean | null; // null while loading
  confirmAdult: () => void;
  onboarded: boolean | null; // null while loading
  /** Saves the setup chosen in the guided funnel and puts its plants in the diary. */
  finishOnboarding: (kit: KitConfig, plants: NewPlant[]) => void;
  restartOnboarding: () => void;
}

const newDeviceId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const Ctx = createContext<Store | null>(null);

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => raw && setValue(JSON.parse(raw)))
      .catch(() => undefined);
  }, [key]);
  const update = useCallback(
    (fn: (prev: T) => T) =>
      setValue((prev) => {
        const next = fn(prev);
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => undefined);
        return next;
      }),
    [key],
  );
  return [value, update] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [userLogs, setUserLogs] = usePersisted<StoredLog[]>(K.logs, []);
  const [doneTasks, setDoneTasks] = usePersisted<string[]>(K.done, []);
  const [userPlants, setUserPlants] = usePersisted<UserPlantSpec[]>(K.plants, []);
  const [measures, setMeasures] = usePersisted<Measurement[]>(K.measures, []);
  const [owned, setOwned] = usePersisted<string[]>(K.owned, []);
  const [kit, setKitState] = usePersisted<KitConfig>(K.kit, DEFAULT_KIT);
  const [scans, setScans] = usePersisted<Scan[]>(K.scans, []);
  const [aiKey, setAiKeyState] = usePersisted<string>(K.aiKey, '');
  const [deviceId, setDeviceId] = usePersisted<string>(K.device, '');
  const [adult, setAdult] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(K.adult)
      .then((v) => setAdult(v === 'true'))
      .catch(() => setAdult(false));
  }, []);
  const confirmAdult = useCallback(() => {
    setAdult(true);
    AsyncStorage.setItem(K.adult, 'true').catch(() => undefined);
  }, []);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(K.onboarded)
      .then((v) => setOnboarded(v === 'true'))
      .catch(() => setOnboarded(false));
  }, []);
  const saveOnboarded = useCallback((v: boolean) => {
    setOnboarded(v);
    AsyncStorage.setItem(K.onboarded, String(v)).catch(() => undefined);
  }, []);
  // Anonymous random id used only for the daily photo limit on the diagnosis server.
  useEffect(() => {
    const t = setTimeout(() => setDeviceId((prev) => prev || newDeviceId()), 400);
    return () => clearTimeout(t);
  }, [setDeviceId]);

  const addLog = useCallback<Store['addLog']>(
    (plantId, kind, title, detail, metrics) =>
      setUserLogs((prev) => [{ id: `u-${Date.now()}`, plantId, date: new Date().toISOString(), kind, title, detail, metrics }, ...prev]),
    [setUserLogs],
  );

  const addPlant = useCallback<Store['addPlant']>(
    (spec) => {
      const id = `up-${Date.now()}`;
      setUserPlants((prev) => [...prev, { ...spec, id, createdAt: new Date().toISOString() }]);
      setUserLogs((prev) => [
        {
          id: `u-${Date.now()}`,
          plantId: id,
          date: new Date().toISOString(),
          kind: 'osservazione',
          title: 'Pianta aggiunta al diario',
          detail: `${spec.space} · ${spec.medium}${spec.potL ? ` ${spec.potL} L` : ''}`,
        },
        ...prev,
      ]);
      return id;
    },
    [setUserPlants, setUserLogs],
  );

  const finishOnboarding = useCallback<Store['finishOnboarding']>(
    (config, specs) => {
      const now = new Date().toISOString();
      const added = specs.map((spec, i) => ({ ...spec, id: `up-${Date.now()}-${i}`, createdAt: now }));
      setKitState(() => config);
      setUserPlants((prev) => [...prev, ...added]);
      setUserLogs((prev) => [
        ...added.map((p) => ({
          id: `u-${p.id}`,
          plantId: p.id,
          date: now,
          kind: 'osservazione' as const,
          title: 'Coltivazione iniziata',
          detail: `${p.space} · ${p.medium}${p.potL ? ` ${p.potL} L` : ''}`,
        })),
        ...prev,
      ]);
      saveOnboarded(true);
    },
    [setKitState, setUserPlants, setUserLogs, saveOnboarded],
  );
  const restartOnboarding = useCallback(() => saveOnboarded(false), [saveOnboarded]);

  const advanceStage = useCallback<Store['advanceStage']>(
    (plantId, stage) => {
      setUserPlants((prev) =>
        prev.map((p) => (p.id === plantId ? { ...p, timeline: [...p.timeline, { stage, start: new Date().toISOString() }] } : p)),
      );
      addLog(plantId, 'osservazione', 'Cambio fase', `Inizio della fase: ${stage}.`);
    },
    [setUserPlants, addLog],
  );

  const deletePlant = useCallback<Store['deletePlant']>(
    (plantId) => {
      setUserPlants((prev) => prev.filter((p) => p.id !== plantId));
      setMeasures((prev) => prev.filter((m) => m.plantId !== plantId));
      setUserLogs((prev) => prev.filter((l) => l.plantId !== plantId));
    },
    [setUserPlants, setMeasures, setUserLogs],
  );

  const addMeasurement = useCallback<Store['addMeasurement']>(
    (plantId, m) => {
      setMeasures((prev) => [...prev, { ...m, id: `m-${Date.now()}`, plantId, date: new Date().toISOString() }]);
      const fmt = (v: number, d = 1) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
      addLog(plantId, 'osservazione', 'Misure registrate', 'Valori inseriti manualmente.', [
        { label: 'Temp', value: `${fmt(m.temp)} °C` },
        { label: 'UR', value: `${Math.round(m.rh)}%` },
        ...(m.ph !== null ? [{ label: 'pH', value: fmt(m.ph) }] : []),
        ...(m.ec !== null ? [{ label: 'EC', value: fmt(m.ec) }] : []),
        ...(m.height !== null ? [{ label: 'Altezza', value: `${m.height} cm` }] : []),
      ]);
    },
    [setMeasures, addLog],
  );

  const toggleTask = useCallback(
    (id: string) => setDoneTasks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setDoneTasks],
  );
  const toggleOwned = useCallback(
    (id: string) => setOwned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setOwned],
  );
  const setKit = useCallback((k: KitConfig) => setKitState(() => k), [setKitState]);
  const setAiKey = useCallback((k: string) => setAiKeyState(() => k.trim()), [setAiKeyState]);
  const addScan = useCallback<Store['addScan']>(
    (s) => setScans((prev) => [{ ...s, id: `s-${Date.now()}`, date: new Date().toISOString() }, ...prev].slice(0, 20)),
    [setScans],
  );

  const plants = useMemo(() => {
    const logsFor = (id: string): LogEntry[] =>
      userLogs
        .filter((l) => l.plantId === id)
        .map((l) => ({ id: l.id, date: new Date(l.date), kind: l.kind, title: l.title, detail: l.detail, metrics: l.metrics }));
    const mine = userPlants.map((spec) => {
      const last = spec.timeline[spec.timeline.length - 1];
      const p = buildUserPlant(
        spec,
        measures.filter((m) => m.plantId === spec.id),
        estimateHarvest(last.stage, new Date(last.start), spec.cultivarId),
      );
      const withLogs = { ...p, logs: logsFor(p.id) };
      return p.readings.length ? { ...withLogs, health: envScore(withLogs) } : withLogs;
    });
    return mine;
  }, [userPlants, measures, userLogs]);

  // Older saved configs miss the newer fields.
  const kitFull = useMemo(() => ({ ...DEFAULT_KIT, ...kit }), [kit]);

  return (
    <Ctx.Provider
      value={{
        plants,
        userPlantCount: userPlants.length,
        addPlant,
        advanceStage,
        deletePlant,
        addMeasurement,
        addLog,
        doneTasks,
        toggleTask,
        kit: kitFull,
        setKit,
        owned,
        toggleOwned,
        scans,
        addScan,
        aiKey,
        setAiKey,
        deviceId,
        adult,
        confirmAdult,
        onboarded,
        finishOnboarding,
        restartOnboarding,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}
