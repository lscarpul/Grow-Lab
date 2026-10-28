import { ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Glass, T } from '../components/ui';
import { C } from '../theme/tokens';

/** Shown on first launch: the app is for adults only (cannabis content, Gemini API terms require 18+). */
export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 justify-center px-6" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Glass className="items-center p-6" glow={C.leaf}>
        <View className="h-14 w-14 items-center justify-center rounded-3xl bg-[#34D88A]/15">
          <ShieldCheck size={26} color={C.leaf} />
        </View>
        <T className="mt-4 font-grotesk-b text-[28px] tracking-[-0.8px]">Grow Lab</T>
        <T className="mt-2 text-center text-[14px] leading-5 text-[#C9D4CF]">
          Quest'app contiene informazioni sulla coltivazione di cannabis ed è riservata ai maggiorenni.
        </T>
        <T className="mt-3 text-center text-xs leading-[17px] text-[#8A9A93]">
          La coltivazione è regolata in modo diverso in ogni Paese: sei responsabile di rispettare le leggi in vigore dove vivi. Grow Lab
          non vende né facilita la vendita di cannabis.
        </T>
        <Button className="mt-6 self-stretch" label="Ho almeno 18 anni" onPress={onConfirm} />
      </Glass>
    </View>
  );
}
