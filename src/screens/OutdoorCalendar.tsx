import { CloudRain, ShoppingCart } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Enter } from '../components/layout';
import { Badge, Bullet, cn, Eyebrow, Glass, SectionHeader, T, tap } from '../components/ui';
import { DAYLIGHT, GANTT, MONTH_PLANS, MONTHS_LONG, TEMP_MEAN } from '../data/calendar';
import { fmtNum } from '../lib/math';
import { alpha, C, STAGE_COLOR } from '../theme/tokens';

const SHORT = MONTHS_LONG.map((m) => m.slice(0, 3));
const BAR_COLOR = { ...STAGE_COLOR };

/** Outdoor season planner for Italy: Gantt of sowing/flowering windows, day length vs flowering threshold, month-by-month plan. */
export function OutdoorCalendar() {
  const now = new Date().getMonth();
  const [month, setMonth] = useState(now);
  const plan = MONTH_PLANS[month];
  return (
    <>
      <SectionHeader
        title="Stagione outdoor in Italia"
        caption="Finestre indicative per il centro Italia: al nord sposta di 1–2 settimane più tardi"
      />
      <Enter i={2} className="mx-5">
        <Glass className="p-4">
          <View className="flex-row">
            <View style={{ width: 92 }} />
            {SHORT.map((m, i) => (
              <T key={m} className={cn('flex-1 text-center text-[8.5px]', i === now ? 'font-inter-b text-[#34D88A]' : 'text-[#56655F]')}>
                {m[0]}
              </T>
            ))}
          </View>
          {GANTT.map((row) => (
            <View key={row.label} className="mt-2.5 flex-row items-center">
              <View style={{ width: 92 }}>
                <T className="font-inter-sb text-[11px]">{row.label}</T>
                <T className="text-[9px] text-[#56655F]">{row.sub}</T>
              </View>
              <View className="h-4 flex-1 rounded-md bg-white/[0.04]">
                {row.bars.map((b) => (
                  <View
                    key={b.stage + b.from}
                    style={{
                      position: 'absolute',
                      left: `${(b.from / 12) * 100}%`,
                      width: `${((b.to - b.from) / 12) * 100}%`,
                      top: 2,
                      bottom: 2,
                      borderRadius: 4,
                      backgroundColor: BAR_COLOR[b.stage],
                    }}
                  />
                ))}
                <View
                  style={{
                    position: 'absolute',
                    left: `${((now + new Date().getDate() / 31) / 12) * 100}%`,
                    top: -3,
                    bottom: -3,
                    width: 1.5,
                    backgroundColor: '#fff',
                  }}
                />
              </View>
            </View>
          ))}
          <View className="mt-4 flex-row flex-wrap gap-x-3 gap-y-1">
            {(['germinazione', 'vegetativa', 'fioritura', 'raccolta'] as const).map((s) => (
              <View key={s} className="flex-row items-center">
                <View className="mr-1.5 h-2 w-2 rounded-sm" style={{ backgroundColor: BAR_COLOR[s] }} />
                <T className="text-2xs capitalize text-[#8A9A93]">{s}</T>
              </View>
            ))}
          </View>
        </Glass>
      </Enter>

      <SectionHeader
        title="Ore di luce e fioritura"
        caption="Le fotoperiodiche iniziano a fiorire quando il giorno scende sotto ~14,5 ore"
      />
      <Enter i={3} className="mx-5">
        <Glass className="p-4">
          <DaylightChart now={now} />
        </Glass>
      </Enter>

      <SectionHeader title="Mese per mese" caption="Tocca un mese per vedere cosa fare" />
      <Enter i={4} className="mx-5">
        <View className="flex-row flex-wrap justify-between gap-y-1.5">
          {SHORT.map((m, i) => {
            const active = i === month;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  tap();
                  setMonth(i);
                }}
                className="w-[15.5%] items-center rounded-xl py-2 active:opacity-70 active:scale-[0.97]"
                style={{
                  backgroundColor: active ? alpha(C.leaf, 0.16) : i === now ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  borderWidth: 1,
                  borderColor: active ? alpha(C.leaf, 0.45) : 'rgba(255,255,255,0.06)',
                }}
              >
                <T className={cn('text-[11px]', active ? 'font-inter-sb' : 'font-inter-md text-[#A9B6B0]')}>{m}</T>
              </Pressable>
            );
          })}
        </View>
        <Glass className="mt-3 p-4" glow={C.leaf}>
          <View className="flex-row items-center justify-between">
            <View>
              <Eyebrow>{MONTHS_LONG[month]}</Eyebrow>
              <T className="mt-1 font-grotesk-b text-[20px]">{plan.focus}</T>
            </View>
            {month === now && <Badge tone="leaf">Questo mese</Badge>}
          </View>
          <View className="mt-2 flex-row gap-4">
            <T className="text-2xs text-[#8A9A93]">☀ {fmtNum(DAYLIGHT[month], 1)} h di luce</T>
            <T className="text-2xs text-[#8A9A93]">🌡 media {TEMP_MEAN[month]} °C</T>
          </View>
          <View className="mt-3">
            {plan.tasks.map((t) => (
              <Bullet key={t}>{t}</Bullet>
            ))}
          </View>
          {plan.risk && (
            <View className="mt-1 flex-row items-start rounded-xl p-2.5" style={{ backgroundColor: alpha(C.rose, 0.08) }}>
              <CloudRain size={13} color={C.rose} />
              <T className="ml-2 flex-1 text-xs text-[#F3C6CE]">{plan.risk}</T>
            </View>
          )}
          {plan.shopping && (
            <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
              <ShoppingCart size={12} color={C.amber} />
              {plan.shopping.map((s) => (
                <Badge key={s} tone="amber">
                  {s}
                </Badge>
              ))}
            </View>
          )}
        </Glass>
      </Enter>
    </>
  );
}

function DaylightChart({ now }: { now: number }) {
  const W = 320;
  const H = 150;
  const pad = { l: 26, r: 8, t: 10, b: 20 };
  const min = 8;
  const max = 16;
  const x = (i: number) => pad.l + (i / 11) * (W - pad.l - pad.r);
  const y = (h: number) => pad.t + (1 - (h - min) / (max - min)) * (H - pad.t - pad.b);
  const path = DAYLIGHT.map((h, i) => `${i ? 'L' : 'M'}${x(i)},${y(h)}`).join(' ');
  const threshold = 14.5;
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect
          x={pad.l}
          y={y(threshold)}
          width={W - pad.l - pad.r}
          height={y(min) - y(threshold)}
          fill={alpha(STAGE_COLOR.fioritura, 0.08)}
        />
        <Line
          x1={pad.l}
          x2={W - pad.r}
          y1={y(threshold)}
          y2={y(threshold)}
          stroke={STAGE_COLOR.fioritura}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <SvgText x={W - pad.r} y={y(threshold) - 4} fill={STAGE_COLOR.fioritura} fontSize={9} textAnchor="end">
          soglia fioritura 14,5 h
        </SvgText>
        {[8, 10, 12, 14, 16].map((h) => (
          <SvgText key={h} x={pad.l - 6} y={y(h) + 3} fill="#56655F" fontSize={9} textAnchor="end">
            {h}
          </SvgText>
        ))}
        <Path d={path} stroke={C.amber} strokeWidth={2.5} fill="none" />
        {DAYLIGHT.map((h, i) => (
          <Circle key={i} cx={x(i)} cy={y(h)} r={i === now ? 5 : 2.5} fill={i === now ? '#fff' : C.amber} />
        ))}
        {SHORT.map((m, i) => (
          <SvgText key={m} x={x(i)} y={H - 4} fill={i === now ? C.leaf : '#56655F'} fontSize={9} textAnchor="middle">
            {m[0]}
          </SvgText>
        ))}
      </Svg>
      <T className="mt-1 text-2xs leading-4 text-[#56655F]">
        Da fine luglio le giornate si accorciano sotto la soglia e le fotoperiodiche passano alla fioritura. Le autofiorenti non dipendono
        dalla luce.
      </T>
    </View>
  );
}
