import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildPlants, LogEntry, LogKind, Plant } from '../data/grows';

const KEY = 'growlab.userlogs.v1';
const DONE_KEY = 'growlab.tasksdone.v1';

interface StoredLog {
  id: string;
  plantId: string;
  date: string;
  kind: LogKind;
  title: string;
  detail: string;
}

interface Store {
  plants: Plant[];
  addLog: (plantId: string, kind: LogKind, title: string, detail: string) => void;
  doneTasks: string[];
  toggleTask: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const base = useMemo(() => buildPlants(), []);
  const [userLogs, setUserLogs] = useState<StoredLog[]>([]);
  const [doneTasks, setDoneTasks] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setUserLogs(JSON.parse(raw)))
      .catch(() => undefined);
    AsyncStorage.getItem(DONE_KEY)
      .then((raw) => raw && setDoneTasks(JSON.parse(raw)))
      .catch(() => undefined);
  }, []);

  const addLog = useCallback((plantId: string, kind: LogKind, title: string, detail: string) => {
    setUserLogs((prev) => {
      const next = [{ id: `u-${Date.now()}`, plantId, date: new Date().toISOString(), kind, title, detail }, ...prev];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setDoneTasks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(DONE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const plants = useMemo(
    () =>
      base.map((p) => {
        const extra: LogEntry[] = userLogs
          .filter((l) => l.plantId === p.id)
          .map((l) => ({ id: l.id, date: new Date(l.date), kind: l.kind, title: l.title, detail: l.detail }));
        return extra.length ? { ...p, logs: [...extra, ...p.logs] } : p;
      }),
    [base, userLogs],
  );

  return <Ctx.Provider value={{ plants, addLog, doneTasks, toggleTask }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}
