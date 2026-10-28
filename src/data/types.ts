export type Environment = 'indoor' | 'outdoor';

export type StrainTypeId = 'indica' | 'sativa' | 'ibrida' | 'autofiorente' | 'fotoperiodica' | 'cbd';

export type StageId = 'germinazione' | 'piantina' | 'vegetativa' | 'fioritura' | 'raccolta' | 'essiccazione' | 'concia';

export interface Param {
  label: string;
  value: string;
}

export interface EnvNotes {
  params: Param[];
  tips: string[];
}

export interface StrainType {
  id: StrainTypeId;
  name: string;
  emoji: string;
  summary: string;
  difficulty: 'Facile' | 'Media' | 'Impegnativa';
  floweringWeeks: [number, number];
  traits: Param[];
  indoor: EnvNotes;
  outdoor: EnvNotes;
  mistakes: string[];
}

export interface Stage {
  id: StageId;
  name: string;
  emoji: string;
  duration: string;
  goal: string;
  params: Param[];
  steps: string[];
  indoor: string[];
  outdoor: string[];
  autoNotes?: string[];
  mistakes: string[];
  nextWhen: string;
}

export type ProblemCategory = 'Carenze' | 'Eccessi e stress' | 'Parassiti' | 'Muffe e malattie';

export interface Problem {
  id: string;
  name: string;
  category: ProblemCategory;
  where: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
  prevention: string[];
}
