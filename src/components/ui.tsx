import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ArrowDownRight, ArrowUpRight, Minus, Plus } from 'lucide-react-native';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, TextProps, View, ViewProps } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { alpha, C } from '../theme/tokens';
import { fmtSigned } from '../lib/math';

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
};

/** Text with the app's default typeface and color; any font-* class replaces the default font. */
export function T({ className, ...props }: TextProps & { className?: string }) {
  const hasFont = /\bfont-/.test(className ?? '');
  const hasColor = /\btext-(?!\[?\d|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|2xs|center|left|right)/.test(className ?? '');
  return <Text {...props} className={cn(!hasFont && 'font-inter', !hasColor && 'text-[#ECF3EF]', className)} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <T className={cn('font-inter-sb text-2xs uppercase tracking-[1.6px] text-[#8A9A93]', className)}>{children}</T>;
}

interface GlassProps extends ViewProps {
  className?: string;
  glow?: string;
  intensity?: number;
  children?: ReactNode;
}

/** Translucent card: blurred backdrop, hairline border and a soft inner highlight. */
export function Glass({ className, glow, intensity = 28, children, style, ...rest }: GlassProps) {
  return (
    <View
      {...rest}
      style={[
        {
          shadowColor: glow ?? '#000',
          shadowOpacity: glow ? 0.35 : 0.4,
          shadowRadius: glow ? 24 : 18,
          shadowOffset: { width: 0, height: 10 },
          // Android draws the elevation shadow through a translucent background as an offset dark rectangle.
          elevation: 0,
        },
        style,
      ]}
      className={cn(
        'overflow-hidden rounded-[26px] border border-white/[0.08]',
        Platform.OS === 'android' ? 'bg-[#0E161B]/90' : 'bg-[#0E161B]/70',
        className,
      )}
    >
      {Platform.OS !== 'android' && <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }}
      />
      {glow && (
        <Svg pointerEvents="none" width={220} height={220} style={{ position: 'absolute', top: -90, right: -90 }}>
          <Defs>
            <RadialGradient id="glassGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={glow} stopOpacity="0.16" />
              <Stop offset="1" stopColor={glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={110} cy={110} r={110} fill="url(#glassGlow)" />
        </Svg>
      )}
      {children}
    </View>
  );
}

export type Tone = 'leaf' | 'amber' | 'rose' | 'sky' | 'violet' | 'neutral' | 'lime';

export const TONE: Record<Tone, string> = {
  leaf: C.leaf,
  amber: C.amber,
  rose: C.rose,
  sky: C.sky,
  violet: C.violet,
  neutral: '#9AA9A2',
  lime: C.lime,
};

export function Badge({ tone = 'neutral', children, dot, color }: { tone?: Tone; children: ReactNode; dot?: boolean; color?: string }) {
  const c = color ?? TONE[tone];
  return (
    <View
      className="flex-row items-center self-start rounded-full px-2 py-[3px]"
      style={{ backgroundColor: alpha(c, 0.12), borderWidth: 1, borderColor: alpha(c, 0.25) }}
    >
      {dot && <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />}
      <T className="font-inter-sb text-2xs" style={{ color: c }}>
        {children}
      </T>
    </View>
  );
}

/** Trend indicator, e.g. "+14%". `goodWhenUp` decides the color semantics. */
export function TrendPill({
  value,
  suffix = '%',
  goodWhenUp = true,
  label,
  digits = 1,
}: {
  value: number;
  suffix?: string;
  goodWhenUp?: boolean;
  label?: string;
  digits?: number;
}) {
  const flat = Math.abs(value) < 0.5;
  const up = value > 0;
  const good = flat ? null : up === goodWhenUp;
  const color = good === null ? '#9AA9A2' : good ? C.leaf : C.rose;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <View className="flex-row items-center">
      <View className="flex-row items-center rounded-full px-1.5 py-[2px]" style={{ backgroundColor: alpha(color, 0.12) }}>
        <Icon size={11} color={color} strokeWidth={2.6} />
        <T className="ml-0.5 font-inter-sb text-2xs" style={{ color }}>
          {fmtSigned(value, digits)}
          {suffix}
        </T>
      </View>
      {label && <T className="ml-1.5 text-2xs text-[#56655F]">{label}</T>}
    </View>
  );
}

export function SectionHeader({ title, caption, right }: { title: string; caption?: string; right?: ReactNode }) {
  return (
    <View className="mb-3 mt-7 flex-row items-end justify-between px-5">
      <View className="flex-1 pr-3">
        <T className="font-grotesk text-[19px] tracking-[-0.3px]">{title}</T>
        {caption && <T className="mt-0.5 text-xs text-[#8A9A93]">{caption}</T>}
      </View>
      {right}
    </View>
  );
}

interface ChipOption<V extends string> {
  value: V;
  label: string;
  count?: number;
  color?: string;
}

export function ChipRow<V extends string>({
  options,
  selected,
  onToggle,
  className,
}: {
  options: ChipOption<V>[];
  selected: V[];
  onToggle: (v: V) => void;
  className?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={className}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {options.map((o) => {
        const active = selected.includes(o.value);
        const c = o.color ?? C.leaf;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onToggle(o.value);
            }}
            className="flex-row items-center rounded-full px-3.5 py-2 active:opacity-70 active:scale-[0.97]"
            style={{
              backgroundColor: active ? alpha(c, 0.16) : 'rgba(255,255,255,0.04)',
              borderWidth: 1,
              borderColor: active ? alpha(c, 0.45) : 'rgba(255,255,255,0.08)',
            }}
          >
            {o.color && <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: o.color }} />}
            <T className={cn('text-xs', active ? 'font-inter-sb' : 'font-inter-md')} style={{ color: active ? '#F4FBF7' : '#A9B6B0' }}>
              {o.label}
            </T>
            {o.count !== undefined && (
              <T className="ml-1.5 font-grotesk-md text-2xs" style={{ color: active ? c : '#56655F' }}>
                {o.count}
              </T>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Segmented control with a sliding spring indicator. */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: V; label: string; icon?: ReactNode }[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  // Core Animated so the highlight also slides inside drawers (Modals) on Android.
  const x = useRef(new Animated.Value(0)).current;
  const seg = Math.max(0, width - 8) / options.length;
  const placed = useRef(false);
  useEffect(() => {
    if (!seg) return;
    if (!placed.current) {
      x.setValue(index * seg);
      placed.current = true;
    } else Animated.spring(x, { toValue: index * seg, damping: 18, stiffness: 180, mass: 0.8, useNativeDriver: true }).start();
  }, [index, seg, x]);
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      className={cn('flex-row rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1', className)}
    >
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 4,
            width: seg,
            borderRadius: 12,
            backgroundColor: 'rgba(52,216,138,0.16)',
            borderWidth: 1,
            borderColor: 'rgba(52,216,138,0.35)',
            transform: [{ translateX: x }],
          }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            className="flex-1 flex-row items-center justify-center py-2 active:opacity-70 active:scale-[0.97]"
          >
            {o.icon}
            <T
              className={cn('text-xs', o.icon ? 'ml-1.5' : '', active ? 'font-inter-sb' : 'font-inter-md')}
              style={{ color: active ? '#F4FBF7' : '#8A9A93' }}
            >
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={cn('h-px bg-white/[0.06]', className)} />;
}

export function KeyValue({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View className="flex-row items-start justify-between py-2.5">
      <T className="flex-1 pr-4 text-[13px] text-[#8A9A93]">{label}</T>
      <T className="max-w-[60%] text-right font-inter-sb text-[13px]" style={accent ? { color: accent } : undefined}>
        {value}
      </T>
    </View>
  );
}

export function Bullet({ children, color = C.leaf }: { children: ReactNode; color?: string }) {
  return (
    <View className="mb-2 flex-row">
      <View className="mr-3 mt-[7px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <T className="flex-1 text-[13.5px] leading-5 text-[#C9D4CF]">{children}</T>
    </View>
  );
}

/** Thin horizontal progress bar with gradient-like two-tone fill. */
export function Progress({
  value,
  color = C.leaf,
  height = 6,
  track = 'rgba(255,255,255,0.06)',
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(2, Math.min(100, value * 100))}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

/** Compact numeric stepper: tap −/+ or hold for repeated steps. */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = -Infinity,
  max = Infinity,
  digits = 0,
  unit,
  color = C.leaf,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  digits?: number;
  unit?: string;
  color?: string;
  className?: string;
}) {
  const set = (v: number) => {
    tap();
    onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)));
  };
  const atMin = value - step < min - 1e-9;
  const atMax = value + step > max + 1e-9;
  const btn = 'h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] active:scale-90 active:bg-white/[0.12]';
  return (
    <View className={cn('rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5', className)}>
      <T className="text-2xs text-[#8A9A93]">{label}</T>
      <View className="mt-1.5 flex-row items-center justify-between">
        <Pressable
          accessibilityLabel={`Diminuisci ${label}`}
          accessibilityState={{ disabled: atMin }}
          disabled={atMin}
          onPress={() => set(value - step)}
          hitSlop={6}
          className={cn('active:opacity-70 active:scale-[0.97]', btn, atMin && 'opacity-40')}
        >
          <Minus size={14} color="#C9D4CF" />
        </Pressable>
        {/* keyed on the value so the number is redrawn on every change */}
        <T key={value} className="mx-1 font-grotesk-b text-[17px]" style={{ color }}>
          {value.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits })}
          {unit ? ` ${unit}` : ''}
        </T>
        <Pressable
          accessibilityLabel={`Aumenta ${label}`}
          accessibilityState={{ disabled: atMax }}
          disabled={atMax}
          onPress={() => set(value + step)}
          hitSlop={6}
          className={cn('active:opacity-70 active:scale-[0.97]', btn, atMax && 'opacity-40')}
        >
          <Plus size={14} color="#C9D4CF" />
        </Pressable>
      </View>
    </View>
  );
}

/** Pill-shaped primary/secondary button. */
export function Button({
  label,
  onPress,
  icon,
  tone = 'primary',
  color = C.leaf,
  className,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  tone?: 'primary' | 'ghost';
  color?: string;
  className?: string;
  disabled?: boolean;
}) {
  const primary = tone === 'primary';
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      className={cn('active:opacity-70 active:scale-[0.97]', 'flex-row items-center justify-center rounded-2xl px-4 py-3', disabled && 'opacity-40', className)}
      style={{
        backgroundColor: primary ? color : alpha(color, 0.1),
        borderWidth: 1,
        borderColor: primary ? color : alpha(color, 0.3),
      }}
    >
      {icon}
      <T className={cn('font-inter-b text-[13px]', icon ? 'ml-2' : '')} style={{ color: primary ? '#05080A' : color }}>
        {label}
      </T>
    </Pressable>
  );
}
