import { Calculator, ScanLine, Stethoscope } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Disclaimer, Enter, Screen } from '../components/layout';
import { Segmented } from '../components/ui';
import { C } from '../theme/tokens';
import { Calculators } from './Calculators';
import { SymptomFinder } from './DiagnoseScreen';
import { PhotoScanner } from './PhotoScanner';

export type ToolsMode = 'foto' | 'sintomi' | 'calcoli';
type Mode = ToolsMode;

const SUB: Record<Mode, string> = {
  foto: "Scatta una foto: l'AI riconosce carenze, parassiti e muffe tenendo conto di genetica e fase.",
  sintomi: 'Scegli dove vedi il problema o descrivi il sintomo: ti mostriamo cause e soluzioni.',
  calcoli: 'VPD, luce, bolletta e dosi dei concimi: i conti che servono ogni settimana.',
};

export function ToolsScreen({ initial = 'foto' }: { initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const icon = (m: Mode, Icon: typeof ScanLine) => <Icon size={14} color={mode === m ? C.leaf : '#8A9A93'} />;
  return (
    <Screen eyebrow="Strumenti" title="Diagnosi e calcoli" subtitle={SUB[mode]}>
      <Enter i={1} className="mx-5 mt-5">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'foto', label: 'Foto AI', icon: icon('foto', ScanLine) },
            { value: 'sintomi', label: 'Sintomi', icon: icon('sintomi', Stethoscope) },
            { value: 'calcoli', label: 'Calcoli', icon: icon('calcoli', Calculator) },
          ]}
        />
      </Enter>
      <View key={mode}>
        {mode === 'foto' && <PhotoScanner />}
        {mode === 'sintomi' && <SymptomFinder />}
        {mode === 'calcoli' && <Calculators />}
      </View>
      <Disclaimer />
    </Screen>
  );
}
