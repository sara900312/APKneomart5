import { isDisplayableProduct, type Product } from "@/lib/neomart";

const COLOR_NAMES: Record<string, { label: string; hex: string }> = {
  beige: { label: "Beige", hex: "#d8c3a5" },
  black: { label: "Black", hex: "#171717" },
  blue: { label: "Blue", hex: "#4c7bd9" },
  brown: { label: "Brown", hex: "#8b5e3c" },
  burgundy: { label: "Burgundy", hex: "#800020" },
  coral: { label: "Coral", hex: "#ff7f70" },
  gold: { label: "Gold", hex: "#d4af37" },
  green: { label: "Green", hex: "#4f9d69" },
  maroon: { label: "Maroon", hex: "#800000" },
  mauve: { label: "Mauve", hex: "#b784a7" },
  nude: { label: "Nude", hex: "#c79b7b" },
  orange: { label: "Orange", hex: "#f28c28" },
  peach: { label: "Peach", hex: "#ffcba4" },
  pink: { label: "Pink", hex: "#e88ca7" },
  purple: { label: "Purple", hex: "#8f5bb3" },
  red: { label: "Red", hex: "#c94141" },
  rose: { label: "Rose", hex: "#c77b88" },
  silver: { label: "Silver", hex: "#b8bcc2" },
  white: { label: "White", hex: "#f7f7f2" },
  wine: { label: "Wine", hex: "#722f37" },
  أصفر: { label: "أصفر", hex: "#e5b93f" },
  أسود: { label: "أسود", hex: "#171717" },
  أبيض: { label: "أبيض", hex: "#f7f7f2" },
  أحمر: { label: "أحمر", hex: "#c94141" },
  أزرق: { label: "أزرق", hex: "#4c7bd9" },
  أخضر: { label: "أخضر", hex: "#4f9d69" },
  برتقالي: { label: "برتقالي", hex: "#f28c28" },
  بنفسجي: { label: "بنفسجي", hex: "#8f5bb3" },
  بني: { label: "بني", hex: "#8b5e3c" },
  بيج: { label: "بيج", hex: "#d8c3a5" },
  زهري: { label: "زهري", hex: "#e88ca7" },
  وردي: { label: "وردي", hex: "#e88ca7" },
  نود: { label: "نود", hex: "#c79b7b" },
  نبيذي: { label: "نبيذي", hex: "#722f37" },
  مرجاني: { label: "مرجاني", hex: "#ff7f70" },
  ماروني: { label: "ماروني", hex: "#800000" },
  ذهبي: { label: "ذهبي", hex: "#d4af37" },
  فضي: { label: "فضي", hex: "#b8bcc2" },
};

const COLOR_TOKENS = new Set(Object.keys(COLOR_NAMES));
const VARIANT_MARKERS = new Set(["color", "colour", "shade", "tone", "درجة", "لون", "اللون"]);
const SHADE_PRODUCT_TOKENS = new Set([
  "balm",
  "blush",
  "bronzer",
  "concealer",
  "eyeshadow",
  "foundation",
  "gloss",
  "lipstick",
  "liner",
  "makeup",
  "mascara",
  "nail",
  "pencil",
  "powder",
  "tint",
  "روج",
  "بلاشر",
  "بودره",
  "بودرة",
  "حمره",
  "كونسيلر",
  "ماسكارا",
  "فاونديشن",
  "طلاء",
  "ظلال",
]);
const NAMED_PRODUCT_TOKENS = new Set([
  ...SHADE_PRODUCT_TOKENS,
  "balm",
  "cleanser",
  "conditioner",
  "cream",
  "deodorant",
  "fragrance",
  "gel",
  "lotion",
  "mask",
  "mist",
  "oil",
  "perfume",
  "scrub",
  "serum",
  "shampoo",
  "soap",
  "spray",
  "wash",
  "بلسم",
  "جل",
  "زيت",
  "صابون",
  "عطر",
  "كريم",
  "لوشن",
  "ماسك",
  "منظف",
  "مرطب",
  "مقشر",
  "شامبو",
]);
const NON_SHADE_MARKERS = new Set([
  "gen",
  "model",
  "series",
  "version",
  "v",
  "إصدار",
  "سلسلة",
  "موديل",
]);
const NON_VARIANT_DESCRIPTORS = new Set([
  "cream",
  "glossy",
  "liquid",
  "longwear",
  "matte",
  "powder",
  "satin",
  "shimmer",
  "waterproof",
  "acid",
  "ceramide",
  "collagen",
  "hyaluronic",
  "niacinamide",
  "retinol",
  "salicylic",
  "vitamin",
  "سيراميد",
  "كولاجين",
  "هيالورونيك",
  "نياسيناميد",
  "ريتينول",
  "ساليسيليك",
  "فيتامين",
  "كريمي",
  "لامع",
  "مطفي",
  "مائي",
  "بودرة",
  "سائل",
  "مقاوم",
]);
const NON_COLOR_TOKENS = new Set([
  "cm",
  "g",
  "gm",
  "kg",
  "l",
  "lb",
  "ml",
  "mm",
  "oz",
  "pack",
  "pcs",
  "piece",
  "pieces",
  "size",
  "حبة",
  "عبوة",
  "جرام",
  "جم",
  "كجم",
  "لتر",
  "مل",
  "مقاس",
  "قطعة",
  "حجم",
]);

export function getNormalizedProductName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ar")
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNameTokens(value: string) {
  return getNormalizedProductName(value).split(" ").filter(Boolean);
}

function hasNonSizeToken(tokens: string[]) {
  return tokens.some((token) => {
    if (NON_COLOR_TOKENS.has(token)) return true;
    return /^\d+(?:\.\d+)?(?:ml|l|g|kg|oz|cm|mm)$/i.test(token);
  });
}

function hasNonVariantDescriptor(tokens: string[]) {
  return tokens.some((token) => NON_VARIANT_DESCRIPTORS.has(token));
}

function hasNonShadeMarker(tokens: string[]) {
  return tokens.some((token) => NON_SHADE_MARKERS.has(token));
}

function isNamedVariantSuffix(tokens: string[]) {
  return (
    tokens.length > 0 &&
    tokens.length <= 3 &&
    !hasNonSizeToken(tokens) &&
    !hasNonVariantDescriptor(tokens) &&
    !hasNonShadeMarker(tokens) &&
    !tokens.some((token) => /^\d{1,4}$/.test(token))
  );
}

function findTokenIndex(tokens: string[], tokenSet: Set<string>) {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    if (tokenSet.has(tokens[index])) return index;
  }
  return undefined;
}

function findColorToken(tokens: string[]) {
  const index = findTokenIndex(tokens, COLOR_TOKENS);
  return index === undefined ? undefined : tokens[index];
}

function findNamedProductIndex(tokens: string[]) {
  return findTokenIndex(tokens, NAMED_PRODUCT_TOKENS);
}

function hasShadeProductToken(tokens: string[]) {
  return tokens.some((token) => SHADE_PRODUCT_TOKENS.has(token));
}

function hasNamedProductToken(tokens: string[]) {
  return tokens.some((token) => NAMED_PRODUCT_TOKENS.has(token));
}

function isLikelyShadeNumber(token: string, baseTokens: string[]) {
  return (/^\d{4}$/.test(token) || Number(token) <= 99) && hasShadeProductToken(baseTokens);
}

function getBaseKey(tokens: string[]) {
  return [...tokens].sort().join(" ");
}

interface ProductVariantParts {
  baseName: string;
  baseKey: string;
  variantKey: string;
  variantType: "numeric" | "color" | "named";
  colorToken?: string;
}

function parseVariantName(value: string): ProductVariantParts | null {
  const tokens = getNameTokens(value);
  if (tokens.length < 2 || hasNonSizeToken(tokens)) return null;

  const lastColorIndex = findTokenIndex(tokens, COLOR_TOKENS);
  const numberIndex = tokens.findIndex((token) => /^\d{1,4}$/.test(token));
  const markerIndex = tokens.findIndex((token) => VARIANT_MARKERS.has(token));

  if (numberIndex > 0) {
    const baseTokens = tokens.slice(0, numberIndex);
    const variantTokens = tokens.slice(numberIndex + 1);
    const isNumericOnlyShade = variantTokens.length === 0 && hasShadeProductToken(baseTokens);
    const hasNamedSuffix = isNamedVariantSuffix(variantTokens);

    if (
      baseTokens.length === 0 ||
      hasNonShadeMarker(baseTokens) ||
      !isLikelyShadeNumber(tokens[numberIndex], baseTokens) ||
      (!isNumericOnlyShade && !hasNamedSuffix)
    ) {
      return null;
    }
    return {
      baseName: baseTokens.join(" "),
      baseKey: getBaseKey(baseTokens),
      variantKey: `${tokens[numberIndex]} ${variantTokens.join(" ")}`.trim(),
      variantType: "numeric",
      colorToken:
        lastColorIndex !== undefined && lastColorIndex > numberIndex
          ? tokens[lastColorIndex]
          : undefined,
    };
  }

  if (markerIndex > 0) {
    const variantTokens = tokens.slice(markerIndex + 1);
    if (
      variantTokens.length === 0 ||
      hasNonSizeToken(variantTokens) ||
      hasNonVariantDescriptor(variantTokens) ||
      (!findColorToken(variantTokens) && !variantTokens.some((token) => /^\d{1,4}$/.test(token)))
    ) {
      return null;
    }
    return {
      baseName: tokens.slice(0, markerIndex).join(" "),
      baseKey: getBaseKey(tokens.slice(0, markerIndex)),
      variantKey: variantTokens.join(" "),
      variantType: "color",
      colorToken: findColorToken(variantTokens),
    };
  }

  if (
    lastColorIndex !== undefined &&
    lastColorIndex === tokens.length - 1 &&
    lastColorIndex > 0 &&
    hasShadeProductToken(tokens.slice(0, lastColorIndex))
  ) {
    return {
      baseName: tokens.slice(0, lastColorIndex).join(" "),
      baseKey: getBaseKey(tokens.slice(0, lastColorIndex)),
      variantKey: tokens[lastColorIndex],
      variantType: "color",
      colorToken: tokens[lastColorIndex],
    };
  }

  const namedProductIndex = findNamedProductIndex(tokens);
  if (namedProductIndex !== undefined && namedProductIndex < tokens.length - 1) {
    const baseTokens = tokens.slice(0, namedProductIndex + 1);
    const variantTokens = tokens.slice(namedProductIndex + 1);
    if (
      baseTokens.length < 2 ||
      !isNamedVariantSuffix(variantTokens) ||
      (!hasNamedProductToken(baseTokens) && baseTokens.length < 3)
    ) {
      return null;
    }
    return {
      baseName: baseTokens.join(" "),
      baseKey: getBaseKey(baseTokens),
      variantKey: variantTokens.join(" "),
      variantType: "named",
      colorToken: findColorToken(variantTokens),
    };
  }

  return null;
}

export function extractVariantSuffix(productName: string) {
  return parseVariantName(productName)?.variantKey;
}

export function detectProductVariantType(productName: string) {
  return parseVariantName(productName)?.variantType;
}

export function getProductBaseName(productName: string) {
  return parseVariantName(productName)?.baseName ?? getNormalizedProductName(productName);
}

export function detectProductColor(productName: string) {
  const parts = parseVariantName(productName);
  return parts?.colorToken ? COLOR_NAMES[parts.colorToken] : undefined;
}

export function findProductVariants(currentProduct: Product, products: Product[]) {
  const currentParts = parseVariantName(currentProduct.name);
  if (!currentParts) return [];

  const variantsByKey = new Map<string, Product>();
  for (const candidate of [currentProduct, ...products]) {
    if (!isDisplayableProduct(candidate)) continue;
    const parts = parseVariantName(candidate.name);
    if (!parts || parts.baseKey !== currentParts.baseKey) continue;
    if (!variantsByKey.has(parts.variantKey)) {
      variantsByKey.set(parts.variantKey, candidate);
    }
  }

  const variants = Array.from(variantsByKey.values());
  if (variants.length < 2) return [];
  return variants;
}

export function productVariantImage(product: Product) {
  return (
    product.main_image_url ||
    product.images?.[0] ||
    product.image_1 ||
    product.image_2 ||
    product.image_3 ||
    product.image_4
  );
}
