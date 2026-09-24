import { Link } from "@tanstack/react-router";
import { ShoppingBag, Sparkles } from "lucide-react";
import {
  formatIQD,
  productName,
  productShortDescription,
  isDisplayableProduct,
  type Product,
} from "@/lib/neomart";
import { useLocale } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { sounds } from "@/lib/sounds";

export function ProductCard({ product }: { product: Product }) {
  const { language, text } = useLocale();
  const displayName = productName(product, language);
  const displayDescription = productShortDescription(product, language);
  const hasDiscount =
    product.is_discounted && product.discounted_price && product.discounted_price > 0;
  const finalPrice = hasDiscount ? product.discounted_price! : product.price;
  const add = useCart((s) => s.add);
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;
  if (!isDisplayableProduct(product)) return null;

  return (
    <article className="group glass shadow-soft hover:shadow-glow transition-all duration-300 rounded-3xl overflow-hidden border border-border/50 flex flex-col">
      <Link
        to="/product/$id"
        params={{ id: String(product.id) }}
        className="relative aspect-square bg-muted overflow-hidden block"
      >
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={displayName}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Sparkles className="w-12 h-12" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-3 start-3 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full">
            -{product.discount_percent}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 end-3 bg-muted text-foreground text-[10px] font-bold px-2 py-1 rounded-full">
            {text("نفدت الكمية", "Out of stock")}
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link
          to="/product/$id"
          params={{ id: String(product.id) }}
          className="font-bold text-sm leading-tight line-clamp-2 text-foreground hover:text-primary transition"
        >
          {displayName}
        </Link>
        {displayDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {displayDescription}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-auto pt-2">
          <span className="text-lg font-bold gradient-text">{formatIQD(finalPrice, language)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatIQD(product.price, language)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={outOfStock}
          data-sound="off"
          onClick={() => {
            sounds.addToCart();
            add({
              product_id: product.id,
              name: product.name,
              name_en: product.name_en,
              price: finalPrice,
              quantity: 1,
              image: product.main_image_url,
              short_description: product.short_description,
              short_description_en: product.short_description_en,
              description: product.description,
              description_en: product.description_en,
            });
          }}
          className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity rounded-xl py-2.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            {outOfStock ? text("غير متوفر", "Unavailable") : text("أضيفي للسلة", "Add to cart")}
          </span>
        </button>
      </div>
    </article>
  );
}
