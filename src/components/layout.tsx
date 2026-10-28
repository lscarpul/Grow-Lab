import { BlurView } from 'expo-blur';
import { BookOpen, Dna, House, Sprout, Stethoscope } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import { stageById } from '../data/stages';
import { StageId } from '../data/types';
import { STAGE_COLOR } from '../theme/tokens';
import { Badge, cn, Eyebrow, T, tap } from './ui';

cssInterop(Animated.View, { className: 'style' });

/** Staggered entrance used across all screens. */
export function Enter({ i = 0, children, className }: { i?: number; children: ReactNode; className?: string }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(60 + i * 55)
        .duration(520)
        .springify()
        .damping(20)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

export function Screen({
  eyebrow,
  title,
  right,
  children,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <Enter className="flex-row items-end justify-between px-5">
        <View className="flex-1 pr-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <T className="mt-1 font-grotesk-b text-[32px] leading-[36px] tracking-[-1px]">{title}</T>
          {subtitle && <T className="mt-1.5 text-[13px] leading-[19px] text-[#8A9A93]">{subtitle}</T>}
        </View>
        {right}
      </Enter>
      {children}
    </ScrollView>
  );
}

export function StageBadge({ stage }: { stage: StageId }) {
  return (
    <Badge color={STAGE_COLOR[stage]} dot>
      {stageById(stage)?.name ?? stage}
    </Badge>
  );
}

export type TabId = 'home' | 'piante' | 'genetiche' | 'guida' | 'diagnosi';

const TABS: { id: TabId; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'piante', label: 'Piante', Icon: Sprout },
  { id: 'genetiche', label: 'Genetiche', Icon: Dna },
  { id: 'guida', label: 'Guida', Icon: BookOpen },
  { id: 'diagnosi', label: 'Diagnosi', Icon: Stethoscope },
];

export function TabBar({ tab, onChange, badges }: { tab: TabId; onChange: (t: TabId) => void; badges?: Partial<Record<TabId, number>> }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) }}
      className="items-center px-4"
    >
      <View
        className="w-full max-w-[520px] flex-row overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1316]/80 px-1.5 py-1.5"
        style={{ shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 14 }}
      >
        {Platform.OS !== 'android' && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
        {TABS.map(({ id, label, Icon }) => {
          const active = id === tab;
          const count = badges?.[id];
          return (
            <Pressable
              key={id}
              onPress={() => {
                tap();
                onChange(id);
              }}
              className={cn('flex-1 items-center rounded-[22px] py-2', active && 'bg-[#34D88A]/[0.14]')}
            >
              <View>
                <Icon size={20} color={active ? '#34D88A' : '#7D8C86'} strokeWidth={active ? 2.3 : 1.8} />
                {!!count && (
                  <View className="absolute -right-2 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FB7185] px-1">
                    <T className="font-inter-b text-[9px] text-white">{count}</T>
                  </View>
                )}
              </View>
              <T
                className={cn('mt-1 text-[10px]', active ? 'font-inter-sb' : 'font-inter-md')}
                style={{ color: active ? '#E6FFF1' : '#7D8C86' }}
              >
                {label}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function IconButton({ children, onPress, active }: { children: ReactNode; onPress?: () => void; active?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-2xl border',
        active ? 'border-[#34D88A]/40 bg-[#34D88A]/15' : 'border-white/10 bg-white/[0.05]',
      )}
    >
      {children}
    </Pressable>
  );
}

export function Disclaimer() {
  return (
    <T className="mx-6 mt-8 text-center text-[11px] leading-4 text-[#56655F]">
      Contenuti a scopo informativo. La coltivazione di cannabis è regolata in modo diverso in ogni Paese: verifica sempre le leggi in
      vigore dove vivi.
    </T>
  );
}
