import { Budget, KitStats } from './kit';

/** Date the prices below were read on the shops' websites. Prices change: the app always links the product page. */
export const PRICES_CHECKED = '28 ottobre 2026';

export interface ShopPick {
  name: string;
  shop: string;
  price: number; // EUR, VAT included, shipping excluded
  url: string;
  note?: string;
}

const GL = 'Growerline';
const SF = 'Spider Farmer EU';
const DG = 'Deep Garden';

const gl = (slug: string) => `https://www.growerline.com/prodotto/${slug}`;

const TENTS: Record<'60' | '80' | '100' | '120', Record<Budget, ShopPick>> = {
  '60': {
    base: { name: 'Dobermann Tent 60×60×160', shop: GL, price: 69, url: gl('dobermann-tent-60x60x160cm-grow-box-coltivazione-indoor') },
    medio: {
      name: 'Secret Jardin Hydro Shoot HS60 60×60×158',
      shop: GL,
      price: 69,
      url: gl('hydro-shoot-60x60x158cm-2-0-hs60-secret-jardin'),
    },
    pro: { name: 'Grow Box Dark Box 60×60×180', shop: GL, price: 89, url: gl('grow-box-dark-box-60x60x180cm') },
  },
  '80': {
    base: { name: 'Dobermann Tent 80×80×180', shop: GL, price: 89, url: gl('dobermann-tent-80x80x180cm-grow-box-coltivazione-indoor') },
    medio: {
      name: 'Secret Jardin Hydro Shoot HS80 80×80×178',
      shop: GL,
      price: 89,
      url: gl('hydro-shoot-80x80x178cm-2-0-hs80-secret-jardin'),
    },
    pro: { name: 'Grow Box Dark Box 80×80×200', shop: GL, price: 105, url: gl('grow-box-dark-box-80x80x200cm') },
  },
  '100': {
    base: {
      name: 'Secret Jardin Hydro Shoot HS100 100×100×198',
      shop: GL,
      price: 109,
      url: gl('hydro-shoot-100x100x198cm-2-0-hs100-secret-jardin'),
    },
    medio: {
      name: 'Secret Jardin Hydro Shoot HS100 100×100×198',
      shop: GL,
      price: 109,
      url: gl('hydro-shoot-100x100x198cm-2-0-hs100-secret-jardin'),
    },
    pro: { name: 'Dobermann Tent 100×100×200', shop: GL, price: 119, url: gl('dobermann-tent-100x100x200cm-grow-box-coltivazione-indoor') },
  },
  '120': {
    base: {
      name: 'Secret Jardin Hydro Shoot HS120 120×120×200',
      shop: GL,
      price: 119,
      url: gl('hydro-shoot-120x120x200cm-2-0-hs120-secret-jardin'),
    },
    medio: {
      name: 'Dobermann Tent 120×120×200',
      shop: GL,
      price: 129,
      url: gl('dobermann-tent-120x120x200cm-grow-box-coltivazione-indoor'),
    },
    pro: { name: 'Secret Jardin Dark Street DS120 4.0', shop: GL, price: 219, url: gl('dark-street-4-0-ds120-secret-jardin') },
  },
};

const LED = {
  sf1000d: {
    name: 'Spider Farmer SF1000D · 100 W',
    shop: SF,
    price: 69.99,
    url: 'https://spiderfarmer.eu/led-grow-light/',
    note: 'Copertura 70×70 cm',
  },
  sf1000: {
    name: 'Spider Farmer SF1000 · 100 W · LM301H EVO',
    shop: SF,
    price: 95.99,
    url: 'https://spiderfarmer.eu/products/sf1000-led-grow-light/',
    note: 'Copertura 70×70 cm',
  },
  sf2000: {
    name: 'Spider Farmer SF2000 · 200 W · LM301H EVO',
    shop: SF,
    price: 189.99,
    url: 'https://spiderfarmer.eu/products/sf2000-led-grow-light/',
    note: 'Copertura 140×70 / 90×90 cm',
  },
  sf2000pro: {
    name: 'Spider Farmer SF2000Pro · 200 W · LM301H EVO',
    shop: SF,
    price: 209.99,
    url: 'https://spiderfarmer.eu/led-grow-light/',
    note: 'Copertura 90×90 cm',
  },
  sf4000: {
    name: 'Spider Farmer SF4000 · 450 W · LM301H EVO',
    shop: SF,
    price: 345.99,
    url: 'https://spiderfarmer.eu/led-grow-light/',
    note: 'Copertura 120×120 cm, dimmerabile',
  },
} satisfies Record<string, ShopPick>;

const FANS = {
  heli125: { name: 'Aspiratore elicoidale Ø125 · 190 m³/h', shop: GL, price: 14.4, url: gl('aspiratore-elicoidale-125mm-190mc-h') },
  heli150: { name: 'Aspiratore elicoidale Ø150 · 305 m³/h', shop: GL, price: 16.7, url: gl('aspiratore-elicoidale-150mm-305mc-h') },
  tt125: { name: 'Aspiratore TT125 bi-potenza · 220–280 m³/h', shop: GL, price: 65, url: gl('aspiratore-tt125-bi-potenza-220-280mc-h') },
} satisfies Record<string, ShopPick>;

const FILTERS = {
  sok100: { name: 'Filtro Odor Sok Ø100', shop: GL, price: 36, url: gl('filtro-odor-sok-100mm') },
  sok125: { name: 'Filtro Odor Sok Ø125', shop: GL, price: 42, url: gl('filtro-odor-sok-125mm') },
  sok150: { name: 'Filtro Odor Sok Ø150', shop: GL, price: 59, url: gl('filtro-odor-sok-150mm') },
  pk100: {
    name: 'Filtro carboni PrimaKlima Ø100 · 360 m³/h',
    shop: GL,
    price: 50,
    url: gl('filtro-carboni-attivi-primaklima-100mm-360m3-h'),
  },
  pk125: {
    name: 'Filtro carboni PrimaKlima Ø125 · 360 m³/h',
    shop: GL,
    price: 50,
    url: gl('filtro-carboni-attivi-primaklima-125mm-360m3-h'),
  },
  pk125b: {
    name: 'Filtro carboni PrimaKlima Ø125 · 480 m³/h',
    shop: GL,
    price: 65,
    url: gl('filtro-carboni-attivi-primaklima-125mm-480m3-h'),
  },
  pk150: {
    name: 'Filtro carboni PrimaKlima Ø150 · 620 m³/h',
    shop: GL,
    price: 105,
    url: gl('filtro-carboni-attivi-primaklima-150mm-620m3-h'),
  },
} satisfies Record<string, ShopPick>;

/** Real products for a kit item, best match first. Empty when no verified product fits. */
export function picksFor(itemId: string, budget: Budget, s: KitStats, spaceShort: string): ShopPick[] {
  switch (itemId) {
    case 'tenda': {
      const key = spaceShort.split('×')[0] as keyof typeof TENTS;
      const t = TENTS[key];
      return t
        ? [
            t[budget],
            ...(['base', 'medio', 'pro'] as Budget[]).filter((b) => b !== budget && t[b].name !== t[budget].name).map((b) => t[b]),
          ]
        : [];
    }
    case 'led':
      if (s.ledW <= 130) return budget === 'base' ? [LED.sf1000d, LED.sf1000] : [LED.sf1000, LED.sf1000d];
      if (s.ledW <= 250) return budget === 'base' ? [LED.sf2000, LED.sf2000pro] : [LED.sf2000pro, LED.sf2000];
      return [LED.sf4000];
    case 'estrattore':
      if (s.fanM3h <= 190) return budget === 'base' ? [FANS.heli125, FANS.tt125] : [FANS.tt125, FANS.heli125];
      if (s.fanM3h <= 280) return budget === 'base' ? [FANS.heli150, FANS.tt125] : [FANS.tt125, FANS.heli150];
      return [FANS.heli150];
    case 'filtro':
      if (s.duct === 100) return budget === 'base' ? [FILTERS.sok100, FILTERS.pk100] : [FILTERS.pk100, FILTERS.sok100];
      if (s.duct === 125)
        return budget === 'base'
          ? [FILTERS.sok125, FILTERS.pk125]
          : budget === 'pro'
            ? [FILTERS.pk125b, FILTERS.pk125]
            : [FILTERS.pk125, FILTERS.sok125];
      return budget === 'base' ? [FILTERS.sok150, FILTERS.pk150] : [FILTERS.pk150, FILTERS.sok150];
    case 'ventilatore': {
      const all: Record<Budget, ShopPick> = {
        base: {
          name: 'Ventilatore Cyclone a clip 15 cm · 2 velocità',
          shop: GL,
          price: 15,
          url: gl('ventilatore-a-clip-2-velocita-15cm-15w'),
        },
        medio: { name: 'Ventilatore oscillante a pinza 18 cm', shop: GL, price: 22, url: gl('ventilatore-oscillante-a-pinza-18cm-20w') },
        pro: {
          name: 'Ventilatore oscillante Monkey 20 cm',
          shop: GL,
          price: 24,
          url: gl('ventilatore-oscillante-con-pinza-e-clip-monkey-20cm-20w'),
        },
      };
      return [all[budget]];
    }
    case 'phmetro': {
      const all: Record<Budget, ShopPick> = {
        base: { name: 'Misuratore pH Indoortek', shop: GL, price: 12, url: gl('misuratore-ph-indoortek'), note: 'Va tarato spesso' },
        medio: { name: 'Milwaukee PH600', shop: GL, price: 39, url: gl('misuratore-ph-milwaukee-ph600') },
        pro: {
          name: 'AquaMaster P50 Pro · pH e temperatura',
          shop: GL,
          price: 69.9,
          url: gl('misuratore-ph-e-temperatura-aquamaster-p50-pro'),
        },
      };
      return [
        all[budget],
        {
          name: 'Soluzione di taratura pH 7 · 20 ml',
          shop: GL,
          price: 2,
          url: gl('milwaukee-soluzione-calibrante-ph-7-20ml'),
          note: 'Aggiungi anche pH 4',
        },
      ];
    }
    case 'ecmetro': {
      const all: Record<Budget, ShopPick> = {
        base: { name: 'Misuratore EC e TDS Indoortek', shop: GL, price: 12, url: gl('misuratore-ec-e-tds-indoortek') },
        medio: { name: 'Milwaukee CD611', shop: GL, price: 39, url: gl('misuratore-ec-milwaukee-cd611') },
        pro: {
          name: 'AquaMaster E50 Pro · EC e temperatura',
          shop: GL,
          price: 64.9,
          url: gl('misuratore-ec-e-temperatura-aquamaster-e50-pro'),
        },
      };
      return [all[budget]];
    }
    case 'termoigrometro':
      return [
        { name: 'Termoigrometro digitale con sonda', shop: GL, price: 14, url: gl('termoigrometro-digitale-con-sonda') },
        { name: 'Termoigrometro digitale', shop: GL, price: 16, url: gl('termoigrometro-digitale') },
      ];
    case 'lente':
      return [{ name: 'Airontek mini microscopio 60×', shop: GL, price: 8, url: gl('airontek-mini-microscopio-60x') }];
    case 'nutrienti':
      return budget === 'pro'
        ? [{ name: 'Advanced Nutrients Starter Kit', shop: GL, price: 90, url: gl('starter-kit-advanced-nutrients') }]
        : [
            {
              name: 'BioBizz Try Pack Indoor',
              shop: GL,
              price: 13,
              url: gl('biobizz-try-pack-indoor'),
              note: 'Prova per un ciclo, poi bottiglie da 1 L',
            },
            {
              name: 'BioBizz Bio Grow (vari formati)',
              shop: GL,
              price: 3.2,
              url: gl('bio-grow-fertilizzante-crescita'),
              note: 'Prezzo dal formato più piccolo',
            },
            {
              name: 'BioBizz Bio Bloom (vari formati)',
              shop: GL,
              price: 3.4,
              url: gl('bio-bloom-fertilizzante-fioritura'),
              note: 'Prezzo dal formato più piccolo',
            },
          ];
    default:
      return [];
  }
}

export interface SeedOffer extends ShopPick {
  seeds: number;
  exact: boolean; // false = closest equivalent variety from the same breeder
}

const dg = (path: string) => `https://www.deep-garden.com/${path}`;

/** Seed packs for the cultivars in the catalog (Royal Queen Seeds on Deep Garden, 3 seeds, discounted price on the check date). */
export const SEEDS: Record<string, SeedOffer> = {
  'northern-lights': {
    name: 'RQS Northern Light Fem',
    shop: DG,
    price: 15.05,
    seeds: 3,
    exact: true,
    url: dg('royal-queen-seeds-fem/4185-royal-queen-seeds-northern-light-fem-3-semi.html'),
  },
  'amnesia-haze': {
    name: 'RQS Amnesia Haze Fem',
    shop: DG,
    price: 18.9,
    seeds: 3,
    exact: true,
    url: dg('royal-queen-seeds-fem/4095-royal-queen-seeds-amnesia-haze-femminizzata-3-semi.html'),
  },
  'gorilla-glue-4': {
    name: 'RQS Royal Gorilla Fem',
    shop: DG,
    price: 18.9,
    seeds: 3,
    exact: false,
    url: dg('royal-queen-seeds-fem/4204-royal-queen-seeds-royal-gorilla-fem-usa-premium-3-semi.html'),
    note: 'Incrocio di Gorilla Glue',
  },
  'white-widow': {
    name: 'RQS White Widow Fem',
    shop: DG,
    price: 14,
    seeds: 3,
    exact: true,
    url: dg('royal-queen-seeds-fem/4258-royal-queen-seeds-white-widow-fem-3-semi.html'),
  },
  gelato: {
    name: 'RQS Cookies Gelato Fem',
    shop: DG,
    price: 21.35,
    seeds: 3,
    exact: false,
    url: dg('royal-queen-seeds-fem/4111-royal-queen-seeds-cookies-gelato-fem-usa-premium-3-semi.html'),
    note: 'Linea Gelato',
  },
  critical: {
    name: 'RQS Critical Fem',
    shop: DG,
    price: 16.1,
    seeds: 3,
    exact: true,
    url: dg('royal-queen-seeds-fem/4114-royal-queen-seeds-critical-fem-3-semi.html'),
  },
  'super-lemon-haze': {
    name: 'RQS Lemon Shining Silver Haze Fem',
    shop: DG,
    price: 15.05,
    seeds: 3,
    exact: false,
    url: dg('royal-queen-seeds-fem/4175-royal-queen-seeds-lemon-shining-silver-haze-fem-3-semi.html'),
    note: 'Haze al limone simile',
  },
  'nl-auto': {
    name: 'RQS Northern Light Automatic',
    shop: DG,
    price: 16.1,
    seeds: 3,
    exact: true,
    url: dg('royal-queen-seeds-auto/4051-royal-queen-seeds-northern-light-automatic-3-semi.html'),
  },
  'gorilla-auto': {
    name: 'RQS Royal Gorilla Automatic',
    shop: DG,
    price: 18.9,
    seeds: 3,
    exact: false,
    url: dg('royal-queen-seeds-auto/4073-royal-queen-seeds-royal-gorilla-automatic-usa-premium-3-semi.html'),
    note: 'Gorilla autofiorente',
  },
  'amnesia-auto': {
    name: 'RQS Amnesia Haze Automatic',
    shop: DG,
    price: 18.9,
    seeds: 3,
    exact: true,
    url: dg('royal-queen-seeds-auto/3974-royal-queen-seeds-amnesia-haze-automatic-3-semi.html'),
  },
  'wedding-cake': {
    name: 'Wedding Cake Auto',
    shop: GL,
    price: 13,
    seeds: 1,
    exact: false,
    url: gl('wedding-cake-auto-semi-autofiorenti'),
    note: 'Versione autofiorente, prezzo dalla confezione più piccola',
  },
  'cbd-auto': {
    name: 'Fast Eddy Auto CBD',
    shop: GL,
    price: 9.5,
    seeds: 1,
    exact: false,
    url: gl('fast-eddy-automatic-cbd-semi-autofiorenti'),
    note: 'CBD autofiorente, prezzo dalla confezione più piccola',
  },
  'cbd-therapy': {
    name: 'Stress Killer Auto CBD',
    shop: GL,
    price: 9.5,
    seeds: 1,
    exact: false,
    url: gl('stress-killer-auto-cbd-semi-autofiorenti'),
    note: 'Alternativa CBD autofiorente',
  },
};

export const seedSearchUrl = (name: string) => `https://www.google.com/search?q=${encodeURIComponent(`semi ${name} femminizzati prezzo`)}`;

export const fmtEur = (v: number) => `${v.toLocaleString('it-IT', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;

/**
 * Play Store builds (EXPO_PUBLIC_STORE_BUILD=1) show seed prices and shop names without a purchase link:
 * Google Play does not allow apps that facilitate the sale of marijuana products. Gear links stay.
 */
export const SEED_LINKS = process.env.EXPO_PUBLIC_STORE_BUILD !== '1';
