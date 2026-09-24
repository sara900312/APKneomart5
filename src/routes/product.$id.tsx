import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import {
  fetchProduct,
  fetchProductVariantCandidates,
  formatIQD,
  productDescription,
  productField,
  productName,
  productShortDescription,
} from "@/lib/neomart";
import { findProductVariants, getProductBaseName } from "@/lib/productVariants";
import { useLocale } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { sounds } from "@/lib/sounds";

import { QuantityStepper } from "@/components/QuantityStepper";
import { CartBadge } from "@/components/CartBadge";
import { ProductVariantSection } from "@/components/ProductVariantSection";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "تفاصيل المنتج — NEOMART" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { language, direction, text } = useLocale();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });
  const familyName = product ? getProductBaseName(product.name) : "";
  const { data: variantCandidates = [] } = useQuery({
    queryKey: ["product-variant-candidates", familyName],
    queryFn: () => fetchProductVariantCandidates(familyName),
    staleTime: 5 * 60_000,
    enabled: Boolean(product && familyName),
  });

  const hasDiscount = product?.is_discounted && product.discounted_price && product.discounted_price > 0;
  const finalPrice = hasDiscount ? product!.discounted_price! : product?.price ?? 0;
  const images = [product?.main_image_url, ...(product?.images || [])].filter(Boolean) as string[];
  const outOfStock = typeof product?.stock === "number" && product.stock <= 0;
  const displayName = product ? productName(product, language) : "";
  const displayBrand = product && (language === "en" ? product.brand_en || product.brand : product.brand);
  const displayShortDescription = product ? productShortDescription(product, language) : undefined;
  const displayDescription = product ? productDescription(product, language) : undefined;
  const displayIngredients = product ? productField(product, "ingredients", language) : undefined;
  const displayUsage = product ? productField(product, "usage", language) : undefined;
  const displayBenefits = product ? productField(product, "benefits", language) : undefined;
  const displayWarnings = product ? productField(product, "warnings", language) : undefined;
  const variants = useMemo(
    () => (product ? findProductVariants(product, variantCandidates) : []),
    [product, variantCandidates],
  );

  useEffect(() => {
    if (!import.meta.env.DEV || !product) return;
    const familyProducts = variantCandidates.filter((candidate) =>
      candidate.name.toLocaleLowerCase("ar").startsWith(familyName),
    );
    console.log("CURRENT PRODUCT", product);
    console.log("CURRENT PRODUCT NAME", product.name);
    console.log("EXTRACTED FAMILY NAME", familyName);
    console.log("CURRENT PRODUCT CATEGORY", product.category);
    console.log("CURRENT PRODUCT STORE", product.main_store_name);
    console.log("CURRENT PRODUCT SUBCATEGORY", product.subcategory_id);
    console.log("VARIANT RAW CANDIDATES", variantCandidates);
    console.log(
      "VARIANT CANDIDATE NAMES",
      variantCandidates.map((candidate) => candidate.name),
    );
    console.log("FAMILY VALIDATION", familyProducts);
    console.log(
      "DETECTED VARIANTS",
      variants.map((variant) => ({ id: variant.id, name: variant.name })),
    );
    console.log("DETECTED VARIANT COUNT", variants.length);
  }, [familyName, product, variantCandidates, variants]);

  function addToCart() {
    if (!product) return;
    sounds.addToCart();
    add({
      product_id: product.id,
      name: product.name,
      name_en: product.name_en,
      price: finalPrice,
      quantity: qty,
      image: product.main_image_url,
      short_description: product.short_description,
      short_description_en: product.short_description_en,
      description: product.description,
      description_en: product.description_en,
    });
  }

  return (
    <div dir={direction} className="min-h-screen max-w-3xl mx-auto flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {text("رجوع", "Back")}
        </button>
        <h1 className="text-sm font-bold">{text("تفاصيل المنتج", "Product details")}</h1>
        <CartBadge />
      </header>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">{text("جاري التحميل...", "Loading...")}</div>
      )}
      {error && (
        <div className="flex-1 flex items-center justify-center text-destructive text-sm">{text("حدث خطأ في تحميل المنتج", "Could not load the product")}</div>
      )}
      {!isLoading && !product && !error && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">{text("المنتج غير موجود", "Product not found")}</div>
      )}

      {product && (
        <div className="flex-1 px-4 py-4 flex flex-col gap-4">
          <div className="rounded-3xl overflow-hidden bg-muted aspect-square relative">
            {images[imgIdx] ? (
              <img src={images[imgIdx]} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Sparkles className="w-16 h-16" />
              </div>
            )}
            {hasDiscount && (
              <span className="absolute top-3 start-3 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                {text("خصم", "Save")} {product.discount_percent}%
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden border-2 ${
                    imgIdx === i ? "border-primary" : "border-border/50"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold leading-tight">{displayName}</h2>
            {displayBrand && <p className="text-xs text-muted-foreground mt-1">{displayBrand}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold gradient-text">{formatIQD(finalPrice, language)}</span>
            {hasDiscount && <span className="text-sm text-muted-foreground line-through">{formatIQD(product.price, language)}</span>}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className={`px-3 py-1 rounded-full font-bold ${outOfStock ? "bg-destructive/10 text-destructive" : "bg-emerald-500/15 text-emerald-600"}`}>
              {outOfStock ? text("نفدت الكمية", "Out of stock") : `${text("متوفر", "In stock")}${typeof product.stock === "number" ? ` (${product.stock})` : ""}`}
            </span>
            {typeof product.rating === "number" && (
              <span className="text-muted-foreground">★ {product.rating.toFixed(1)}</span>
            )}
          </div>

          {displayShortDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">{displayShortDescription}</p>
          )}

          {displayDescription && (
            <Section title={text("الوصف", "Description")}>{displayDescription}</Section>
          )}
          {displayIngredients && <Section title={text("المكونات", "Ingredients")}>{displayIngredients}</Section>}
          {displayUsage && <Section title={text("طريقة الاستخدام", "How to use")}>{displayUsage}</Section>}
          {displayBenefits && <Section title={text("الفوائد", "Benefits")}>{displayBenefits}</Section>}
          {displayWarnings && <Section title={text("تحذيرات", "Warnings")}>{displayWarnings}</Section>}

          <ProductVariantSection
            variants={variants}
            currentProduct={product}
            language={language}
            text={text}
          />

          <div className="h-24" />
        </div>
      )}

      {product && (
        <div className="sticky bottom-0 glass border-t border-border/50 px-4 py-3 flex items-center gap-2 sm:gap-3">
          <QuantityStepper value={qty} onChange={setQty} max={product.stock ?? 99} />
          <button
            onClick={addToCart}
            data-sound="off"
            disabled={outOfStock}
            className="min-w-0 flex-1 inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            {outOfStock ? text("غير متوفر", "Unavailable") : text("أضيفي للسلة", "Add to cart")}
          </button>
          <Link
            to="/checkout"
            onClick={addToCart}
            data-sound="off"
            className={`min-w-0 flex-1 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.7_0.17_320)] px-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 sm:px-3 sm:text-sm ${outOfStock ? "pointer-events-none opacity-40" : ""}`}
          >
            {text("اشتري الآن", "Buy now")}
          </Link>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-border/50 p-4">
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{children}</p>
    </div>
  );
}
