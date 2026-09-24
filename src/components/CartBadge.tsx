import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart, calcTotals } from "@/lib/cart";
import { useLocale } from "@/lib/i18n";

export function CartBadge() {
  const { text } = useLocale();
  const items = useCart((s) => s.items);
  const { count } = calcTotals(items);
  return (
    <Link
      to="/cart"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition"
      aria-label={text("السلة", "Cart")}
    >
      <ShoppingBag className="w-5 h-5 text-foreground" />
      {count > 0 && (
        <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
