import { Link } from "@tanstack/react-router";
import {
  detectProductColor,
  extractVariantSuffix,
  productVariantImage,
} from "@/lib/productVariants";
import { productName, type Product } from "@/lib/neomart";

export function ProductVariantSection({
  variants,
  currentProduct,
  language,
  text,
}: {
  variants: Product[];
  currentProduct: Product;
  language: "ar" | "en";
  text: (arabic: string, english: string) => string;
}) {
  if (import.meta.env.DEV) console.log("VARIANT UI RENDER", variants);
  if (variants.length <= 1) return null;

  return (
    <section
      className="glass rounded-2xl border border-border/50 p-4"
      aria-labelledby="product-colors-title"
    >
      <h3 id="product-colors-title" className="mb-3 text-sm font-bold">
        {text("الألوان المتوفرة", "Available colors")}
      </h3>
      <div className="flex flex-wrap gap-3" role="list">
        {variants.map((variant) => {
          const color = detectProductColor(variant.name);
          const image = productVariantImage(variant);
          const isCurrent = variant.id === currentProduct.id;
          const productLabel = productName(variant, language);
          const variantSuffix = extractVariantSuffix(variant.name);
          const label =
            variantSuffix && /^\d{4}(?:\s+.+)?$/.test(variantSuffix) ? variantSuffix : productLabel;
          const isVariantOutOfStock = typeof variant.stock === "number" && variant.stock <= 0;

          return (
            <Link
              key={variant.id}
              to="/product/$id"
              params={{ id: String(variant.id) }}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={productLabel}
              title={productLabel}
              role="listitem"
              className="group flex w-16 flex-col items-center gap-1.5 text-center"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border bg-muted transition ${
                  isCurrent
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border/50 group-hover:border-primary/60"
                } ${isVariantOutOfStock ? "opacity-50" : ""}`}
              >
                {color ? (
                  <span className="h-full w-full" style={{ backgroundColor: color.hex }} />
                ) : image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="h-5 w-5 rounded-full border border-border/60" />
                )}
              </span>
              <span className="w-full truncate text-[10px] text-muted-foreground">{label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
