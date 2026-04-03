export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoDescription: string;
  heroSummary: string;
  positioningLabel: string;
  finishLabel: string;
  idealFor: string[];
  featureBullets: string[];
  tileWidthIn: number;
  tileHeightIn: number;
  tileThicknessIn: number;
  tileAreaSqFt: number;
  tileWeightGrams: number;
  tilesPerBox: number;
  pricePerSqFt: number;
  availableColors: string[];
  mediaType?: "image" | "video";
  mediaSrc?: string;
  mediaByColor?: Record<string, string>;
  mediaLabel?: string;
  mediaNote?: string;
};

export const catalogColorHexMap: Record<string, string> = {
  Noir: "#111216",
  Charcoal: "#34363c",
  "Gris pale": "#c7ccd3",
  Blanc: "#eceef1",
  Rouge: "#c13232",
  Orange: "#dd681f",
  Jaune: "#d7b400",
  "Vert pomme": "#76d11f",
  Vert: "#1c9c4b",
  Turquoise: "#2bcac4",
  "Bleu poudre": "#4eb9ec",
  "Bleu royal": "#255fde",
  "Bleu pale": "#79d8ef",
  Mauve: "#7d5ce8",
  Rose: "#d85fa6",
  "Rose bonbon": "#f25eb7",
  "Gris fonce": "#515760",
  "Gris clair": "#cdd2d8",
  Plomb: "#5a626d",
  Bleu: "#2f4f80",
  Violet: "#7053d8",
};

const tileSizeIn = 15.75;
const tileThicknessIn = 0.75;
const tileAreaSqFt = 1.7226;
const crownPricePerSqFt = 4.9;
const acetraxPricePerSqFt = 4.3;

const crownPalette = [
  "Noir",
  "Charcoal",
  "Gris pale",
  "Blanc",
  "Rouge",
  "Orange",
  "Jaune",
  "Vert pomme",
  "Vert",
  "Turquoise",
  "Bleu poudre",
  "Bleu royal",
  "Bleu pale",
  "Mauve",
  "Rose",
  "Rose bonbon",
];

const crownSeriesTopMedia: Record<string, string> = {
  Noir: "/media/crown-series/top/noir.jpg",
  Charcoal: "/media/crown-series/top/charcoal.jpg",
  "Gris pale": "/media/crown-series/top/gris-pale.jpg",
  Blanc: "/media/crown-series/top/blanc.jpg",
  Rouge: "/media/crown-series/top/rouge.jpg",
  Orange: "/media/crown-series/top/orange.jpg",
  Jaune: "/media/crown-series/top/jaune.jpg",
  "Vert pomme": "/media/crown-series/top/vert-pomme.jpg",
  Vert: "/media/crown-series/top/vert.jpg",
  Turquoise: "/media/crown-series/top/turquoise.jpg",
  "Bleu poudre": "/media/crown-series/top/bleu-poudre.jpg",
  "Bleu royal": "/media/crown-series/top/bleu-royal.jpg",
  "Bleu pale": "/media/crown-series/top/bleu-pale.jpg",
  Mauve: "/media/crown-series/top/mauve.jpg",
  Rose: "/media/crown-series/top/rose.jpg",
  "Rose bonbon": "/media/crown-series/top/rose-bonbon.jpg",
};

const crownGripMedia: Record<string, string> = {
  Noir: "/media/crown-grip/source/grip-3.png",
  Charcoal: "/media/crown-grip/source/grip-1.png",
  Rouge: "/media/crown-grip/source/grip-2.png",
};

const crownCubicMedia: Record<string, string> = {
  Noir: "/media/crown-cubic/black.png",
  Charcoal: "/media/crown-cubic/charcoal.png",
  "Gris pale": "/media/crown-cubic/white.png",
  Blanc: "/media/crown-cubic/white.png",
  Rouge: "/media/crown-cubic/red.png",
  Orange: "/media/crown-cubic/red.png",
  Jaune: "/media/crown-cubic/lime.png",
  "Vert pomme": "/media/crown-cubic/lime.png",
  Vert: "/media/crown-cubic/lime.png",
  Turquoise: "/media/crown-cubic/turquoise.png",
  "Bleu poudre": "/media/crown-cubic/turquoise.png",
  "Bleu royal": "/media/crown-cubic/blue.png",
  "Bleu pale": "/media/crown-cubic/turquoise.png",
  Mauve: "/media/crown-cubic/pink.png",
  Rose: "/media/crown-cubic/pink.png",
  "Rose bonbon": "/media/crown-cubic/pink.png",
};

const acetraxPalette = [
  "Noir",
  "Gris fonce",
  "Gris clair",
  "Plomb",
  "Rouge",
  "Orange",
  "Vert pomme",
  "Bleu poudre",
  "Bleu",
  "Violet",
  "Rose",
];

const acetraxMedia: Record<string, string> = {
  Noir: "/media/acetrax/black.png",
  "Gris fonce": "/media/acetrax/dark-grey.png",
  "Gris clair": "/media/acetrax/light-grey.png",
  Plomb: "/media/acetrax/lead.png",
  Rouge: "/media/acetrax/red.png",
  Orange: "/media/acetrax/orange.png",
  "Vert pomme": "/media/acetrax/apple-green.png",
  "Bleu poudre": "/media/acetrax/bleu-poudre.png",
  Bleu: "/media/acetrax/blue.png",
  Violet: "/media/acetrax/purple.png",
  Rose: "/media/acetrax/pink.png",
};

export const catalogProducts: CatalogProduct[] = [
  {
    id: "crown-series",
    slug: "crown-series",
    name: "Crown Series",
    description:
      "Modele ouvert signature AceFloor, 600 g, avec vraies references photo en vue top.",
    seoDescription:
      "La Crown Series est la gamme signature AceFloor pour les projets de garage, showroom et atelier qui demandent une dalle modulaire au rendu haut de gamme et a la pose rapide.",
    heroSummary:
      "La gamme signature pour les garages, showrooms et ateliers premium.",
    positioningLabel: "Signature premium",
    finishLabel: "Ouverte, luxe showroom",
    idealFor: [
      "garages residentiels haut de gamme",
      "showrooms automobiles",
      "ateliers propres et visuels",
    ],
    featureBullets: [
      "structure ouverte signature avec look premium",
      "palette de couleurs large pour motifs personnalises",
      "format 15.75 x 15.75 po pour projets garage et showroom",
    ],
    tileWidthIn: tileSizeIn,
    tileHeightIn: tileSizeIn,
    tileThicknessIn,
    tileAreaSqFt,
    tileWeightGrams: 600,
    tilesPerBox: 40,
    pricePerSqFt: crownPricePerSqFt,
    availableColors: crownPalette,
    mediaType: "image",
    mediaByColor: crownSeriesTopMedia,
    mediaLabel: "Vue top",
  },
  {
    id: "crown-grip",
    slug: "crown-grip",
    name: "Crown Grip",
    description:
      "Version pleine avec surface checker plate. Photos HEIC a convertir et decouper.",
    seoDescription:
      "La Crown Grip mise sur une surface pleine et texturee pour les projets ou l'adherence visuelle et la sensation de robustesse priment sur le reste.",
    heroSummary:
      "Une dalle modulaire pleine avec texture grip pour les espaces qui doivent paraitre massifs et techniques.",
    positioningLabel: "Performance technique",
    finishLabel: "Pleine, plus musclee",
    idealFor: [
      "garages de collection",
      "zones techniques avec forte presence visuelle",
      "amenagements orientes performance et grip",
    ],
    featureBullets: [
      "surface checker plate au caractere plus technique",
      "meme format modulaire que la Crown Series",
      "bon choix pour un style plus muscle et utilitaire",
    ],
    tileWidthIn: tileSizeIn,
    tileHeightIn: tileSizeIn,
    tileThicknessIn,
    tileAreaSqFt,
    tileWeightGrams: 600,
    tilesPerBox: 30,
    pricePerSqFt: crownPricePerSqFt,
    availableColors: crownPalette,
    mediaType: "image",
    mediaSrc: "/media/crown-grip/source/grip-3.png",
    mediaByColor: crownGripMedia,
    mediaLabel: "Photo source",
    mediaNote:
      "Visuel Grip provisoire. Decoupe fond et declinaisons couleur restent a finaliser.",
  },
  {
    id: "crown-cubic",
    slug: "crown-cubic",
    name: "Crown Cubic",
    description:
      "Variante cubic. Les visuels proviennent de la palette cubic et couvrent toute la gamme avec approximation pour certaines couleurs.",
    seoDescription:
      "La Crown Cubic est pensee pour les projets qui veulent sortir du damier classique avec une texture geometrique plus marquee et un rendu graphique fort.",
    heroSummary:
      "Une variante geometrique pour les designs de garage plus audacieux.",
    positioningLabel: "Design statement",
    finishLabel: "Geometrique, graphique",
    idealFor: [
      "garages design",
      "espaces commerciaux qui cherchent un motif distinctif",
      "projets personnalises a forte identite visuelle",
    ],
    featureBullets: [
      "texture cubic pour un rendu graphique plus distinctif",
      "palette et dimensions compatibles avec les projets modulaires premium",
      "bonne base pour compositions sur mesure et zones accent",
    ],
    tileWidthIn: tileSizeIn,
    tileHeightIn: tileSizeIn,
    tileThicknessIn,
    tileAreaSqFt,
    tileWeightGrams: 600,
    tilesPerBox: 30,
    pricePerSqFt: crownPricePerSqFt,
    availableColors: crownPalette,
    mediaType: "image",
    mediaSrc: "/media/crown-cubic/black.png",
    mediaByColor: crownCubicMedia,
    mediaLabel: "Vue palette",
    mediaNote:
      "Certaines couleurs cubic utilisent pour l'instant le visuel le plus proche de la palette fournie.",
  },
  {
    id: "acetrax",
    slug: "acetrax",
    name: "Acetrax",
    description:
      "Memes dimensions que la Crown Series avec un poids de 500 g au lieu de 600 g.",
    seoDescription:
      "Acetrax conserve le format modulaire AceFloor dans une version plus legere, adaptee aux projets qui veulent equilibrer impact visuel, vitesse de pose et budget.",
    heroSummary:
      "Une option plus legere pour les projets modulaires qui veulent rester efficaces.",
    positioningLabel: "Point d'entree premium",
    finishLabel: "Legere, rapide a soumettre",
    idealFor: [
      "garages polyvalents",
      "amenagements qui cherchent un point d'entree plus accessible",
      "projets rapides a configurer et a soumettre",
    ],
    featureBullets: [
      "poids reduit a 500 g par tuile",
      "meme emprise au sol que les autres gammes principales",
      "gamme adaptee aux projets ou la rapidite et le budget comptent",
    ],
    tileWidthIn: tileSizeIn,
    tileHeightIn: tileSizeIn,
    tileThicknessIn,
    tileAreaSqFt,
    tileWeightGrams: 500,
    tilesPerBox: 40,
    pricePerSqFt: acetraxPricePerSqFt,
    availableColors: acetraxPalette,
    mediaType: "image",
    mediaByColor: acetraxMedia,
    mediaLabel: "Vue produit",
  },
];

export function getCatalogProductBySlug(slug: string): CatalogProduct | undefined {
  return catalogProducts.find((product) => product.slug === slug);
}

export function getCatalogProductHref(
  product: Pick<CatalogProduct, "slug">,
): string {
  return `/produits/${product.slug}`;
}

export function getCatalogProductHeroImage(product: CatalogProduct): string {
  return (
    Object.values(product.mediaByColor ?? {})[0] ??
    product.mediaSrc ??
    "/media/acetrax-black.jpeg"
  );
}

export function getCatalogColorHex(color: string): string {
  return catalogColorHexMap[color] ?? "#2f343c";
}

export function getCatalogProductBoxCoverageSqFt(
  product: Pick<CatalogProduct, "tileAreaSqFt" | "tilesPerBox">,
): number {
  return roundToOneDecimal(product.tileAreaSqFt * product.tilesPerBox);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
