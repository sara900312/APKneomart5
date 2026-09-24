export const ALLOWED_PRODUCT_IMAGE_URL_PREFIX = `${import.meta.env.VITE_LEGACY_SUPABASE_URL}/storage/v1/object/public/products/`;

export const PRODUCT_IMAGE_FIELDS = [
  "images",
  "image_1",
  "image_2",
  "image_3",
  "image_4",
  "main_image_url",
  "additional_images",
  "additional_images_list",
] as const;

export type ProductImageField = (typeof PRODUCT_IMAGE_FIELDS)[number];

export interface ProductImageValidationResult {
  valid: boolean;
  field?: ProductImageField;
  message?: string;
}

function parseImageValues(value: unknown): unknown[] | null {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const body = trimmed.slice(1, -1).trim();
    if (!body) return [];
    return body.split(",").map((item) => item.trim().replace(/^"|"$/g, ""));
  }

  return [trimmed];
}

export function validateProductImageFields(
  payload: Record<string, unknown>,
): ProductImageValidationResult {
  for (const field of PRODUCT_IMAGE_FIELDS) {
    if (!(field in payload)) continue;
    const values = parseImageValues(payload[field]);
    if (
      !values ||
      values.some(
        (value) => typeof value !== "string" || !value.startsWith(ALLOWED_PRODUCT_IMAGE_URL_PREFIX),
      )
    ) {
      return {
        valid: false,
        field,
        message: `رابط صورة غير مسموح في الحقل ${field}. يجب أن يبدأ الرابط بـ ${ALLOWED_PRODUCT_IMAGE_URL_PREFIX}`,
      };
    }
  }
  return { valid: true };
}

export function assertValidProductImageFields(payload: Record<string, unknown>) {
  const result = validateProductImageFields(payload);
  if (!result.valid) throw new Error(result.message);
}
