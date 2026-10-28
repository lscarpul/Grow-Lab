import { Cultivar, CULTIVARS } from '../data/cultivars';
import { Budget, buildKit, GrowKind, itemTotal, KitConfig, kitStats, SpaceId, SPACES } from '../data/kit';
import { SEEDS } from '../data/shop';

const POT_CM = 35; // pot + saucer
const LAMP_CM = 35; // minimum distance between LED and canopy
const KWH_EUR = 0.3;

const avg = (r: [number, number]) => (r[0] + r[1]) / 2;
export const isAuto = (c: Cultivar) => c.tags.includes('autofiorente');

/** Footprint per plant in m²: autos stay small, photoperiods are trained to fill the canopy. */
const footprint = (c: Cultivar) => (isAuto(c) ? 0.16 : avg(c.heightIndoor) > 120 ? 0.36 : 0.25);

export function cycleDays(c: Cultivar) {
  if (c.seedToHarvestDays) return Math.round(avg(c.seedToHarvestDays));
  return Math.round(7 + 14 + 28 + avg(c.floweringDays)); // germination + seedling + ~4 weeks veg + flower
}

export interface SpaceOption {
  space: SpaceId;
  label: string;
  plants: number;
  heightRoom: number; // cm available for the plant
  heightOk: boolean;
  needsTraining: boolean;
  config: KitConfig;
  kitCost: number;
  seedCost: number;
  energyCost: number; // per cycle
  yieldG: [number, number];
  costPerGram: number; // first cycle, everything included
  recommended: boolean;
}

/** Strain → space: evaluates every tent size and outdoor option for a chosen cultivar. */
export function adviseForCultivar(c: Cultivar, budget: Budget = 'medio'): SpaceOption[] {
  const auto = isAuto(c);
  const seed = SEEDS[c.id];
  const indoor = SPACES.filter((s) => s.indoor).map((s) => {
    const [w, d, h] = s.dims!;
    const area = (w * d) / 10000;
    const plants = Math.max(1, Math.min(s.maxPlants, Math.floor(area / footprint(c))));
    const heightRoom = h - POT_CM - LAMP_CM;
    const maxH = c.heightIndoor[1];
    const heightOk = maxH <= heightRoom;
    // Photoperiods can be kept lower with topping/LST/SCROG (~30%); autos cannot.
    const needsTraining = !heightOk && !auto && maxH * 0.7 <= heightRoom;
    const config: KitConfig = { space: s.id, budget, plants, kind: auto ? 'auto' : 'foto', medium: 'terra' };
    const kit = buildKit(config);
    const kitCost = Math.round(kit.reduce((a, i) => a + itemTotal(i), 0));
    const stats = kitStats(config);
    const days = cycleDays(c);
    const energyCost = Math.round(stats.monthlyKwh * (days / 30) * KWH_EUR);
    const lightFactor = Math.min(1, stats.ppfd / 750);
    const yieldG: [number, number] = [
      Math.round(area * c.yieldIndoor[0] * lightFactor * 0.6),
      Math.round(area * c.yieldIndoor[1] * lightFactor * 0.85),
    ];
    const seedCost = seed ? Math.ceil(plants / seed.seeds) * seed.price : plants * 8;
    const costPerGram = (kitCost + seedCost + energyCost) / Math.max(1, avg(yieldG));
    return {
      space: s.id,
      label: s.label,
      plants,
      heightRoom,
      heightOk,
      needsTraining,
      config,
      kitCost,
      seedCost,
      energyCost,
      yieldG,
      costPerGram,
      recommended: false,
    };
  });
  const outdoor = SPACES.filter((s) => !s.indoor).map((s) => {
    const plants = s.id === 'balcone' ? 2 : 3;
    const config: KitConfig = { space: s.id, budget, plants, kind: auto ? 'auto' : 'foto', medium: 'terra' };
    const kitCost = Math.round(buildKit(config).reduce((a, i) => a + itemTotal(i), 0));
    const potFactor = s.id === 'balcone' ? 0.45 : 1;
    const yieldG: [number, number] = [
      Math.round(c.yieldOutdoor[0] * plants * potFactor * 0.5),
      Math.round(c.yieldOutdoor[1] * plants * potFactor * 0.8),
    ];
    const seedCost = seed ? Math.ceil(plants / seed.seeds) * seed.price : plants * 8;
    return {
      space: s.id,
      label: s.label,
      plants,
      heightRoom: 999,
      heightOk: true,
      needsTraining: false,
      config,
      kitCost,
      seedCost,
      energyCost: 0,
      yieldG,
      costPerGram: (kitCost + seedCost) / Math.max(1, avg(yieldG)),
      recommended: false,
    };
  });
  // Recommend the smallest tent that fits the plant's height (or fits with training) and holds at least 2 plants.
  const best = indoor.find((o) => (o.heightOk || o.needsTraining) && o.plants >= 2) ?? indoor[indoor.length - 1];
  best.recommended = true;
  return [...indoor, ...outdoor];
}

export type Priority = 'resa' | 'facile' | 'veloce' | 'discreta' | 'cbd';

export interface SetupInput {
  env: 'indoor' | 'outdoor';
  w: number;
  d: number;
  h: number;
  ledW: number;
  experience: 1 | 2 | 3; // principiante, intermedio, esperto
  priority: Priority;
  kind: GrowKind | 'tutte';
  climate: 'nord' | 'centro' | 'sud';
}

export interface StrainFit {
  cultivar: Cultivar;
  score: number; // 0–100
  reasons: { ok: boolean; text: string }[];
  plants: number;
  yieldG: [number, number];
  ppfd: number;
  seedCost: number | null;
}

/** Gear → strains: ranks the catalog for the space and light the grower already has. */
export function adviseForSetup(input: SetupInput): StrainFit[] {
  const area = (input.w * input.d) / 10000;
  const ppfd = input.env === 'indoor' ? Math.round(((input.ledW * 2.5) / Math.max(area, 0.1)) * 0.85) : 0;
  const heightRoom = input.h - POT_CM - LAMP_CM;
  return CULTIVARS.filter((c) => input.kind === 'tutte' || (input.kind === 'auto') === isAuto(c))
    .map((c) => {
      const reasons: StrainFit['reasons'] = [];
      let score = 70;
      const auto = isAuto(c);
      if (input.env === 'indoor') {
        const maxH = c.heightIndoor[1];
        if (maxH <= heightRoom)
          reasons.push({ ok: true, text: `Altezza ${c.heightIndoor[0]}–${maxH} cm: ci sta nei tuoi ${heightRoom} cm utili` });
        else if (!auto && maxH * 0.7 <= heightRoom) {
          score -= 10;
          reasons.push({ ok: false, text: `Arriva a ${maxH} cm: serve topping o SCROG per stare nei ${heightRoom} cm utili` });
        } else {
          score -= 35;
          reasons.push({ ok: false, text: `Troppo alta: fino a ${maxH} cm contro ${heightRoom} cm utili` });
        }
        if (ppfd < 450) {
          score += auto || c.dominance === 'indica' ? 4 : -12;
          reasons.push({
            ok: auto || c.dominance === 'indica',
            text: `Luce scarsa (~${ppfd} PPFD): ${auto || c.dominance === 'indica' ? 'questa genetica la tollera' : 'le sativa rendono poco'}`,
          });
        } else if (ppfd > 1000) reasons.push({ ok: true, text: `Luce abbondante (~${ppfd} PPFD): potrai sfruttare tutta la resa` });
        if (avg(c.floweringDays) > 70) {
          score -= 6;
          reasons.push({ ok: false, text: `Fioritura lunga (${c.floweringDays[0]}–${c.floweringDays[1]} giorni): più bolletta` });
        }
      } else {
        const lateHarvest = /ottobre|novembre/i.test(c.outdoorHarvest) && !/inizio ottobre/i.test(c.outdoorHarvest);
        if (input.climate === 'nord' && lateHarvest) {
          score -= 25;
          reasons.push({ ok: false, text: `Raccolta ${c.outdoorHarvest.toLowerCase()}: al nord rischi piogge e freddo` });
        } else reasons.push({ ok: true, text: `Raccolta ${c.outdoorHarvest.toLowerCase()}` });
        score += (c.moldResistance - 3) * 6;
        reasons.push({ ok: c.moldResistance >= 4, text: `Resistenza alla muffa ${c.moldResistance}/5` });
        if (input.climate !== 'sud') {
          score += (c.coldTolerance - 3) * 4;
          if (c.coldTolerance <= 2) reasons.push({ ok: false, text: 'Soffre le notti fredde di fine stagione' });
        }
      }
      const gap = c.difficulty - (input.experience === 1 ? 2 : input.experience === 2 ? 3 : 5);
      if (gap > 0) {
        score -= gap * 9;
        reasons.push({ ok: false, text: `Difficoltà ${c.difficulty}/5: impegnativa per il tuo livello` });
      } else if (input.experience === 1) reasons.push({ ok: true, text: `Difficoltà ${c.difficulty}/5: adatta a chi inizia` });
      switch (input.priority) {
        case 'resa':
          score += (avg(c.yieldIndoor) - 450) / 12;
          break;
        case 'facile':
          score += (3 - c.difficulty) * 6 + (c.moldResistance - 3) * 3;
          break;
        case 'veloce':
          score += (60 - (auto ? avg(c.seedToHarvestDays ?? [70, 80]) - 21 : avg(c.floweringDays))) / 2;
          break;
        case 'discreta':
          score += (130 - c.heightIndoor[1]) / 6 + (auto ? 6 : 0);
          break;
        case 'cbd':
          score += c.tags.includes('cbd') ? 30 : -20;
          break;
      }
      const plants =
        input.env === 'indoor' ? Math.max(1, Math.floor(area / footprint(c))) : Math.max(1, Math.min(6, Math.floor(area / 0.8)));
      const lightFactor = input.env === 'indoor' ? Math.min(1, ppfd / 750) : 1;
      const yieldG: [number, number] =
        input.env === 'indoor'
          ? [Math.round(area * c.yieldIndoor[0] * lightFactor * 0.6), Math.round(area * c.yieldIndoor[1] * lightFactor * 0.85)]
          : [Math.round(c.yieldOutdoor[0] * plants * 0.4), Math.round(c.yieldOutdoor[1] * plants * 0.7)];
      const seed = SEEDS[c.id];
      return {
        cultivar: c,
        score: Math.max(0, Math.min(100, Math.round(score))),
        reasons,
        plants,
        yieldG,
        ppfd,
        seedCost: seed ? Math.ceil(plants / seed.seeds) * seed.price : null,
      };
    })
    .sort((a, b) => b.score - a.score);
}
