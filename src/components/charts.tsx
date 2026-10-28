import { ReactNode, useMemo, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, Platform, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { fmtDate, fmtNum, fmtWeekday } from '../lib/math';
import { alpha, C } from '../theme/tokens';
import { T } from './ui';

export interface Point {
  date: Date;
  value: number;
}

/** Catmull-Rom → cubic Bézier for smooth but faithful lines. */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function useWidth(initial = 0) {
  const [w, setW] = useState(initial);
  return [w, (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)] as const;
}

interface AreaChartProps {
  data: Point[];
  color: string;
  height?: number;
  unit?: string;
  digits?: number;
  ideal?: [number, number];
  extra?: (index: number) => { label: string; value: string; color?: string }[];
  showAxis?: boolean;
  id: string;
}

/** Interactive area chart: drag (or hover on web) to scrub; a glass tooltip reveals extra metrics. */
export function AreaChart({ data, color, height = 150, unit = '', digits = 1, ideal, extra, showAxis = true, id }: AreaChartProps) {
  const [width, onLayout] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const padTop = 14;
  const padBottom = showAxis ? 22 : 6;
  const plotH = height - padTop - padBottom;

  const geo = useMemo(() => {
    if (!width || data.length === 0) return null;
    const values = data.map((d) => d.value);
    let lo = Math.min(...values, ...(ideal ? [ideal[0]] : []));
    let hi = Math.max(...values, ...(ideal ? [ideal[1]] : []));
    const pad = (hi - lo || 1) * 0.15;
    lo -= pad;
    hi += pad;
    const x = (i: number) => (data.length === 1 ? width / 2 : (i / (data.length - 1)) * (width - 8) + 4);
    const y = (v: number) => padTop + (1 - (v - lo) / (hi - lo)) * plotH;
    const pts = data.map((d, i) => [x(i), y(d.value)] as [number, number]);
    const line = smoothPath(pts);
    const area = `${line} L${pts[pts.length - 1][0]},${padTop + plotH} L${pts[0][0]},${padTop + plotH} Z`;
    return { x, y, pts, line, area };
  }, [width, data, ideal, plotH]);

  const pick = (lx: number) => {
    if (!geo || data.length === 0) return;
    const i = Math.round(((lx - 4) / (width - 8)) * (data.length - 1));
    setActive(Math.max(0, Math.min(data.length - 1, i)));
  };

  const responder = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => pick(e.nativeEvent.locationX),
    onResponderMove: (e: GestureResponderEvent) => pick(e.nativeEvent.locationX),
    onResponderRelease: () => setTimeout(() => setActive(null), 1600),
  };
  const hover =
    Platform.OS === 'web'
      ? {
          onPointerMove: (e: { nativeEvent: { offsetX?: number; locationX?: number } }) =>
            pick(e.nativeEvent.offsetX ?? e.nativeEvent.locationX ?? 0),
          onPointerLeave: () => setActive(null),
        }
      : {};

  const a = active !== null && geo ? { d: data[active], p: geo.pts[active] } : null;
  const inIdeal = a && ideal ? a.d.value >= ideal[0] && a.d.value <= ideal[1] : null;
  const tipW = 168;

  return (
    <View onLayout={onLayout} style={{ height }} {...responder} {...(hover as object)}>
      {geo && (
        <Svg width={width} height={height} pointerEvents="none">
          <Defs>
            <LinearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.35" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {[0, 0.5, 1].map((f) => (
            <Line
              key={f}
              x1={0}
              x2={width}
              y1={padTop + f * plotH}
              y2={padTop + f * plotH}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}
          {ideal && (
            <G>
              <Rect
                x={0}
                width={width}
                y={geo.y(ideal[1])}
                height={Math.max(1, geo.y(ideal[0]) - geo.y(ideal[1]))}
                fill={alpha(C.leaf, 0.06)}
              />
              <Line
                x1={0}
                x2={width}
                y1={geo.y(ideal[1])}
                y2={geo.y(ideal[1])}
                stroke={alpha(C.leaf, 0.35)}
                strokeDasharray="3 4"
                strokeWidth={1}
              />
              <Line
                x1={0}
                x2={width}
                y1={geo.y(ideal[0])}
                y2={geo.y(ideal[0])}
                stroke={alpha(C.leaf, 0.35)}
                strokeDasharray="3 4"
                strokeWidth={1}
              />
            </G>
          )}
          <Path d={geo.area} fill={`url(#fill-${id})`} />
          <Path d={geo.line} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          {!a && (
            <G>
              <Circle cx={geo.pts[geo.pts.length - 1][0]} cy={geo.pts[geo.pts.length - 1][1]} r={7} fill={alpha(color, 0.2)} />
              <Circle cx={geo.pts[geo.pts.length - 1][0]} cy={geo.pts[geo.pts.length - 1][1]} r={3.5} fill={color} />
            </G>
          )}
          {a && (
            <G>
              <Line x1={a.p[0]} x2={a.p[0]} y1={padTop - 6} y2={padTop + plotH} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <Circle cx={a.p[0]} cy={a.p[1]} r={8} fill={alpha(color, 0.25)} />
              <Circle cx={a.p[0]} cy={a.p[1]} r={4} fill="#05080A" stroke={color} strokeWidth={2} />
            </G>
          )}
          {showAxis &&
            data.map((d, i) =>
              i % Math.max(1, Math.ceil(data.length / 5)) === 0 || i === data.length - 1 ? (
                <SvgText
                  key={i}
                  x={Math.min(width - 16, Math.max(14, geo.x(i)))}
                  y={height - 6}
                  fill="#56655F"
                  fontSize={9.5}
                  textAnchor="middle"
                >
                  {fmtDate(d.date)}
                </SvgText>
              ) : null,
            )}
        </Svg>
      )}
      {a && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: Math.max(0, Math.min(width - tipW, a.p[0] - tipW / 2)),
            width: tipW,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(14,22,27,0.94)',
            padding: 10,
            shadowColor: '#000',
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <T className="text-2xs uppercase tracking-[1.2px] text-[#8A9A93]">
            {fmtWeekday(a.d.date)} {fmtDate(a.d.date)}
          </T>
          <View className="mt-1 flex-row items-baseline">
            <T className="font-grotesk-b text-xl" style={{ color }}>
              {fmtNum(a.d.value, digits)}
            </T>
            <T className="ml-1 text-xs text-[#8A9A93]">{unit}</T>
            {inIdeal !== null && (
              <T className="ml-auto font-inter-sb text-2xs" style={{ color: inIdeal ? C.leaf : C.amber }}>
                {inIdeal ? '● nel range' : '● fuori range'}
              </T>
            )}
          </View>
          {extra?.(active!).map((row) => (
            <View key={row.label} className="mt-1 flex-row justify-between">
              <T className="text-2xs text-[#8A9A93]">{row.label}</T>
              <T className="font-inter-sb text-2xs" style={{ color: row.color ?? '#ECF3EF' }}>
                {row.value}
              </T>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function Sparkline({ data, color, width = 84, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return <View style={{ width, height }} />;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const pts = data.map(
    (v, i) => [(i / (data.length - 1)) * (width - 4) + 2, 3 + (1 - (v - lo) / (hi - lo || 1)) * (height - 6)] as [number, number],
  );
  const line = smoothPath(pts);
  const gid = `sp-${color.replace('#', '')}-${width}`;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={`${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`} fill={`url(#${gid})`} />
        <Path d={line} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.4} fill={color} />
      </Svg>
    </View>
  );
}

/** Circular progress with gradient stroke; children render centered. */
export function Ring({
  value,
  size = 120,
  stroke = 10,
  color = C.leaf,
  color2 = C.lime,
  children,
  track = 'rgba(255,255,255,0.06)',
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  color2?: string;
  children?: ReactNode;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const gid = `ring-${size}-${color.replace('#', '')}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color2} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ * v} ${circ}`}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}

/** Horizontal scale with the ideal window highlighted and an optional marker for the current value. */
export function RangeBar({
  scale,
  ideal,
  value,
  color = C.leaf,
  height = 8,
}: {
  scale: [number, number];
  ideal?: [number, number];
  value?: number | null;
  color?: string;
  height?: number;
}) {
  const [width, onLayout] = useWidth();
  const pos = (v: number) => ((Math.max(scale[0], Math.min(scale[1], v)) - scale[0]) / (scale[1] - scale[0])) * width;
  return (
    <View onLayout={onLayout} style={{ height: height + 10, justifyContent: 'center' }}>
      <View style={{ height, borderRadius: height, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      {width > 0 && ideal && (
        <View
          style={{
            position: 'absolute',
            left: pos(ideal[0]),
            width: Math.max(4, pos(ideal[1]) - pos(ideal[0])),
            height,
            borderRadius: height,
            backgroundColor: alpha(color, 0.55),
            borderWidth: 1,
            borderColor: alpha(color, 0.9),
          }}
        />
      )}
      {width > 0 && value !== undefined && value !== null && (
        <View
          style={{
            position: 'absolute',
            left: pos(value) - 1.5,
            width: 3,
            height: height + 10,
            borderRadius: 2,
            backgroundColor: '#F4FBF7',
            shadowColor: '#fff',
            shadowOpacity: 0.6,
            shadowRadius: 6,
          }}
        />
      )}
    </View>
  );
}

export interface RadarSeries {
  values: number[]; // 0–1
  color: string;
  label: string;
}

export function Radar({ axes, series, size = 240 }: { axes: string[]; series: RadarSeries[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const labelled = axes.some((a) => a);
  const r = size / 2 - (labelled ? 34 : 4);
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(ang) * r * v, cy + Math.sin(ang) * r * v] as const;
  };
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((lv) => (
          <Polygon
            key={lv}
            points={axes.map((_, i) => pt(i, lv).join(',')).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" />;
        })}
        {series.map((s) => (
          <G key={s.label}>
            <Polygon
              points={s.values.map((v, i) => pt(i, v).join(',')).join(' ')}
              fill={alpha(s.color, 0.18)}
              stroke={s.color}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            {s.values.map((v, i) => {
              const [x, y] = pt(i, v);
              return <Circle key={i} cx={x} cy={y} r={labelled ? 2.6 : 1.6} fill={s.color} />;
            })}
          </G>
        ))}
        {labelled &&
          axes.map((a, i) => {
            const [x, y] = pt(i, 1.2);
            return (
              <SvgText key={a} x={x} y={y + 3} fill="#8A9A93" fontSize={9.5} textAnchor="middle">
                {a}
              </SvgText>
            );
          })}
      </Svg>
    </View>
  );
}

export function Donut({
  segments,
  size = 108,
  stroke = 13,
  children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  const gap = 2.5;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const el = (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${Math.max(0, len - gap)} ${circ}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </Svg>
      {children}
    </View>
  );
}

/** Small vertical bars (e.g. litres of water per day). */
export function MiniBars({ data, color, height = 54, max }: { data: (number | null)[]; color: string; height?: number; max?: number }) {
  const m = max ?? Math.max(1, ...data.map((d) => d ?? 0));
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      {data.map((d, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: d ? Math.max(3, (d / m) * height) : 3,
            borderRadius: 3,
            backgroundColor: d ? (i === data.length - 1 ? color : alpha(color, 0.55)) : 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
    </View>
  );
}

/** Segmented horizontal bar for stacked shares (e.g. stage timeline, category split). */
export function StackBar({ parts, height = 10 }: { parts: { value: number; color: string }[]; height?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: height, overflow: 'hidden', gap: 2 }}>
      {parts.map((p, i) => (
        <View key={i} style={{ flex: p.value / total, backgroundColor: p.color }} />
      ))}
    </View>
  );
}
