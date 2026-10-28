import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Dna, House, ScanLine, ShoppingBag, Sprout } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { stageById } from '../data/stages';
import { StageId } from '../data/types';
import { STAGE_COLOR } from '../theme/tokens';
import { Badge, cn, Eyebrow, T, tap } from './ui';

/**
 * Staggered entrance used across all screens.
 * The Reanimated view only gets plain styles (NativeWind's wrapper broke its animations on Android); the classes go on
 * an inner View, and the outer view copies the few classes that affect its own size in the parent.
 */
export function Enter({ i = 0, children, className }: { i?: number; children: ReactNode; className?: string }) {
  const width = className?.match(/\bw-\[(\d+(?:\.\d+)?%)\]/)?.[1];
  const outer = { flex: /\bflex-1\b/.test(className ?? '') ? 1 : undefined, width: width as `${number}%` | undefined };
  return (
    <Animated.View
      entering={FadeInDown.delay(60 + i * 55)
        .duration(520)
        .springify()
        .damping(20)}
      style={outer}
    >
      <View className={className} style={outer.flex ? { flex: 1 } : undefined}>
        {children}
      </View>
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
    <View style={{ flex: 1 }}>
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
      <StatusScrim height={insets.top} />
    </View>
  );
}

/** Fades content out under the translucent status bar so the clock never sits on top of text. */
export function StatusScrim({ height }: { height: number }) {
  if (!height) return null;
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#05080A', '#05080A', 'rgba(5,8,10,0)']}
      locations={[0, height / (height + 16), 1]}
      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: height + 16 }}
    />
  );
}

export function StageBadge({ stage }: { stage: StageId }) {
  return (
    <Badge color={STAGE_COLOR[stage]} dot>
      {stageById(stage)?.name ?? stage}
    </Badge>
  );
}

export type TabId = 'home' | 'piante' | 'kit' | 'genetiche' | 'guida' | 'strumenti';

export const TABS: { id: TabId; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'piante', label: 'Piante', Icon: Sprout },
  { id: 'kit', label: 'Kit', Icon: ShoppingBag },
  { id: 'genetiche', label: 'Genetiche', Icon: Dna },
  { id: 'guida', label: 'Guida', Icon: BookOpen },
  { id: 'strumenti', label: 'Strumenti', Icon: ScanLine },
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
        className={cn(
          'w-full max-w-[520px] flex-row overflow-hidden rounded-[28px] border border-white/10 px-1.5 py-1.5',
          // no blur on Android: keep the bar opaque so page text doesn't show through
          Platform.OS === 'android' ? 'bg-[#0B1316]' : 'bg-[#0B1316]/80',
        )}
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
              className={cn(
                'active:scale-[0.97] active:opacity-70',
                'flex-1 items-center rounded-[22px] py-2',
                active && 'bg-[#34D88A]/[0.14]',
              )}
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
                className={cn('mt-1 text-[9.5px]', active ? 'font-inter-sb' : 'font-inter-md')}
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
        'active:scale-[0.97] active:opacity-70',
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
