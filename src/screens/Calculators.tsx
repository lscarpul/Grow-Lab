import { Droplets, Gauge, Sun, Zap } from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import { View } from 'react-native';
import { Enter } from '../components/layout';
import { Badge, cn, Eyebrow, Glass, Segmented, Stepper, T } from '../components/ui';
import { dli, fmtNum, vpd } from '../lib/math';
import { alpha, C } from '../theme/tokens';

type VpdZone = { max: number; label: string; color: string };
const VPD_ZONES: VpdZone[] = [
  { max: 0.4, label: 'Troppo umido', color: '#4F6BFF' },
  { max: 0.8, label: 'Piantine e talee', color: C.sky },
  { max: 1.2, label: 'Vegetativa', color: C.leaf },
  { max: 1.6, label: 'Fioritura', color: C.amber },
  { max: 99, label: 'Troppo secco', color: C.rose },
];
const zoneOf = (v: number) => VPD_ZONES.find((z) => v < z.max)!;

function Card({ title, Icon, color, children, i }: { title: string; Icon: typeof Gauge; color: string; children: ReactNode; i: number }) {
  return (
    <Enter i={i} className="mx-5 mt-4">
      <Glass className="p-4" glow={color}>
        <View className="flex-row items-center">
          <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: alpha(color, 0.15) }}>
            <Icon size={15} color={color} />
          </View>
          <T className="ml-2.5 font-grotesk text-[17px]">{title}</T>
        </View>
        {children}
      </Glass>
    </Enter>
  );
}

function Result({ value, unit, label, color }: { value: string; unit: string; label: string; color: string }) {
  return (
    <View className="mt-4 flex-row items-end justify-between">
      <T className="font-grotesk-b text-[34px] leading-[38px]" style={{ color }}>
        {value}
        <T className="font-inter text-sm text-[#8A9A93]"> {unit}</T>
      </T>
      <Badge color={color} dot>
        {label}
      </Badge>
    </View>
  );
}

export function Calculators() {
  return (
    <>
      <VpdCalc />
      <LightCalc />
      <EnergyCalc />
      <MixCalc />
    </>
  );
}

function VpdCalc() {
  const [t, setT] = useState(25);
  const [rh, setRh] = useState(55);
  const [offset, setOffset] = useState(-2);
  const v = vpd(t, rh, offset);
  const z = zoneOf(v);
  const temps = [18, 20, 22, 24, 26, 28, 30, 32];
  const rhs = [80, 75, 70, 65, 60, 55, 50, 45, 40, 35];
  const nearest = <N extends number>(xs: N[], x: number) => xs.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
  const ct = nearest(temps, t);
  const cr = nearest(rhs, rh);
  return (
    <Card title="VPD · deficit di pressione di vapore" Icon={Gauge} color={C.violet} i={1}>
      <T className="mt-2 text-xs leading-[17px] text-[#8A9A93]">
        Dice quanto la pianta traspira: troppo basso favorisce le muffe, troppo alto chiude gli stomi.
      </T>
      <View className="mt-3 flex-row gap-2">
        <Stepper
          className="flex-1"
          label="Temp aria"
          value={t}
          onChange={setT}
          step={0.5}
          min={10}
          max={40}
          digits={1}
          unit="°C"
          color={C.amber}
        />
        <Stepper className="flex-1" label="Umidità" value={rh} onChange={setRh} min={20} max={95} unit="%" color={C.sky} />
      </View>
      <Stepper
        className="mt-2"
        label="Foglia rispetto all'aria (LED: −1/−2 °C)"
        value={offset}
        onChange={setOffset}
        step={0.5}
        min={-5}
        max={2}
        digits={1}
        unit="°C"
      />
      <Result value={fmtNum(v, 2)} unit="kPa" label={z.label} color={z.color} />
      <Eyebrow className="mt-5">Mappa VPD · temperatura × umidità</Eyebrow>
      <View className="mt-2">
        <View className="flex-row">
          <View style={{ width: 30 }} />
          {temps.map((x) => (
            <T key={x} className="flex-1 text-center text-[9px] text-[#56655F]">
              {x}°
            </T>
          ))}
        </View>
        {rhs.map((r) => (
          <View key={r} className="mt-[2px] flex-row items-center">
            <T className="text-[9px] text-[#56655F]" style={{ width: 30 }}>
              {r}%
            </T>
            {temps.map((x) => {
              const cell = vpd(x, r, offset);
              const zc = zoneOf(cell).color;
              const here = x === ct && r === cr;
              return (
                <View
                  key={x}
                  className={cn('mx-[1px] h-[18px] flex-1 items-center justify-center rounded-[4px]', here && 'border border-white')}
                  style={{ backgroundColor: alpha(zc, here ? 0.9 : 0.42) }}
                >
                  {here && <View className="h-1.5 w-1.5 rounded-full bg-white" />}
                </View>
              );
            })}
          </View>
        ))}
        <View className="mt-3 flex-row flex-wrap gap-x-3 gap-y-1">
          {VPD_ZONES.map((zz) => (
            <View key={zz.label} className="flex-row items-center">
              <View className="mr-1.5 h-2 w-2 rounded-sm" style={{ backgroundColor: zz.color }} />
              <T className="text-2xs text-[#8A9A93]">{zz.label}</T>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const DLI_TARGET = [
  { stage: 'Piantina', range: [10, 20] as [number, number] },
  { stage: 'Vegetativa', range: [20, 40] as [number, number] },
  { stage: 'Fioritura', range: [35, 50] as [number, number] },
];

function LightCalc() {
  const [ppfd, setPpfd] = useState(650);
  const [hours, setHours] = useState(18);
  const value = dli(ppfd, hours);
  const match = DLI_TARGET.find((d) => value >= d.range[0] && value <= d.range[1]);
  return (
    <Card title="Luce · DLI giornaliero" Icon={Sun} color={C.amber} i={2}>
      <T className="mt-2 text-xs leading-[17px] text-[#8A9A93]">
        La quantità totale di luce ricevuta in un giorno: unisce intensità (PPFD) e ore di accensione.
      </T>
      <View className="mt-3 flex-row gap-2">
        <Stepper
          className="flex-1"
          label="PPFD"
          value={ppfd}
          onChange={setPpfd}
          step={25}
          min={50}
          max={1500}
          unit="µmol"
          color={C.amber}
        />
        <Stepper className="flex-1" label="Ore di luce" value={hours} onChange={setHours} min={1} max={24} unit="h" />
      </View>
      <Result
        value={fmtNum(value, 1)}
        unit="mol/m²/g"
        label={match ? `Ideale ${match.stage.toLowerCase()}` : value < 10 ? 'Troppo poca' : value > 50 ? 'Eccessiva' : 'Tra due fasi'}
        color={match ? C.leaf : C.amber}
      />
      <View className="mt-4 gap-2">
        {DLI_TARGET.map((d) => {
          const pct = Math.min(1, value / 60);
          return (
            <View key={d.stage}>
              <View className="flex-row justify-between">
                <T className="text-2xs text-[#A9B6B0]">{d.stage}</T>
                <T className="text-2xs text-[#56655F]">
                  {d.range[0]}–{d.range[1]} · PPFD a {hours} h: {Math.round((d.range[0] * 1e6) / (hours * 3600))}–
                  {Math.round((d.range[1] * 1e6) / (hours * 3600))}
                </T>
              </View>
              <View className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <View
                  style={{
                    position: 'absolute',
                    left: `${(d.range[0] / 60) * 100}%`,
                    width: `${((d.range[1] - d.range[0]) / 60) * 100}%`,
                    top: 0,
                    bottom: 0,
                    backgroundColor: alpha(C.leaf, 0.35),
                  }}
                />
                <View style={{ position: 'absolute', left: `${pct * 100}%`, width: 2, top: 0, bottom: 0, backgroundColor: '#fff' }} />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function EnergyCalc() {
  const [watt, setWatt] = useState(200);
  const [hours, setHours] = useState(18);
  const [fan, setFan] = useState(40);
  const [days, setDays] = useState(110);
  const [price, setPrice] = useState(0.3);
  const kwhDay = (watt * hours + fan * 24) / 1000;
  const total = kwhDay * days * price;
  return (
    <Card title="Bolletta · costo del ciclo" Icon={Zap} color={C.lime} i={3}>
      <T className="mt-2 text-xs leading-[17px] text-[#8A9A93]">
        Lampada + estrattore sempre acceso. Per le fotoperiodiche usa 18 h in vegetativa e 12 h in fioritura (media ~14,5 h).
      </T>
      <View className="mt-3 flex-row gap-2">
        <Stepper
          className="flex-1"
          label="LED reali"
          value={watt}
          onChange={setWatt}
          step={10}
          min={10}
          max={1500}
          unit="W"
          color={C.amber}
        />
        <Stepper className="flex-1" label="Ore/giorno" value={hours} onChange={setHours} step={0.5} min={1} max={24} digits={1} unit="h" />
      </View>
      <View className="mt-2 flex-row gap-2">
        <Stepper className="flex-1" label="Estrattore" value={fan} onChange={setFan} step={5} min={0} max={300} unit="W" />
        <Stepper className="flex-1" label="Durata" value={days} onChange={setDays} step={5} min={10} max={240} unit="gg" />
      </View>
      <Stepper
        className="mt-2"
        label="Prezzo energia"
        value={price}
        onChange={setPrice}
        step={0.01}
        min={0.1}
        max={0.8}
        digits={2}
        unit="€/kWh"
      />
      <Result value={fmtNum(total, 0)} unit="€" label={`${fmtNum(kwhDay * days, 0)} kWh`} color={C.lime} />
      <View className="mt-3 flex-row justify-between">
        {[
          ['Al giorno', `${fmtNum(kwhDay * price, 2)} €`],
          ['Al mese', `${fmtNum(kwhDay * 30 * price, 0)} €`],
          ['kWh/giorno', fmtNum(kwhDay, 2)],
        ].map(([k, v]) => (
          <View key={k}>
            <T className="text-2xs text-[#56655F]">{k}</T>
            <T className="font-grotesk text-[15px]">{v}</T>
          </View>
        ))}
      </View>
    </Card>
  );
}

type MixMode = 'crescita' | 'fioritura';
const MIX: Record<MixMode, { name: string; dose: number; color: string }[]> = {
  crescita: [
    { name: 'Concime crescita', dose: 2, color: C.leaf },
    { name: 'Cal-Mag', dose: 0.5, color: C.sky },
    { name: 'Stimolatore radici', dose: 1, color: C.violet },
  ],
  fioritura: [
    { name: 'Concime fioritura', dose: 3, color: C.amber },
    { name: 'Cal-Mag', dose: 0.5, color: C.sky },
    { name: 'Booster PK', dose: 1, color: C.rose },
  ],
};

function MixCalc() {
  const [mode, setMode] = useState<MixMode>('crescita');
  const [litres, setLitres] = useState(10);
  const [doses, setDoses] = useState<Record<MixMode, number[]>>({
    crescita: MIX.crescita.map((m) => m.dose),
    fioritura: MIX.fioritura.map((m) => m.dose),
  });
  const list = MIX[mode];
  return (
    <Card title="Diluizione dei concimi" Icon={Droplets} color={C.sky} i={4}>
      <T className="mt-2 text-xs leading-[17px] text-[#8A9A93]">
        Inserisci la dose in ml/L indicata sull'etichetta (inizia da metà dose): ti dico quanti ml versare nella tanica.
      </T>
      <Segmented
        className="mt-3"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'crescita', label: 'Crescita' },
          { value: 'fioritura', label: 'Fioritura' },
        ]}
      />
      <Stepper
        className="mt-3"
        label="Acqua nella tanica"
        value={litres}
        onChange={setLitres}
        step={0.5}
        min={0.5}
        max={200}
        digits={1}
        unit="L"
        color={C.sky}
      />
      <View className="mt-3 gap-2">
        {list.map((m, i) => (
          <View key={m.name} className="flex-row items-center gap-2">
            <Stepper
              className="flex-1"
              label={`${m.name} · ml/L`}
              value={doses[mode][i]}
              onChange={(v) => setDoses((prev) => ({ ...prev, [mode]: prev[mode].map((x, j) => (j === i ? v : x)) }))}
              step={0.25}
              min={0}
              max={10}
              digits={2}
              color={m.color}
            />
            <View className="w-[86px] items-end">
              <T className="font-grotesk-b text-[22px]" style={{ color: m.color }}>
                {fmtNum(doses[mode][i] * litres, 1)}
              </T>
              <T className="text-2xs text-[#8A9A93]">ml in tanica</T>
            </View>
          </View>
        ))}
      </View>
      <T className="mt-3 text-2xs leading-4 text-[#56655F]">
        Versa un prodotto alla volta mescolando, Cal-Mag per primo. Misura l'EC e correggi il pH per ultimo (6,2–6,8 in terra, 5,8–6,2 in
        cocco).
      </T>
    </Card>
  );
}
