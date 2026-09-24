import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Trash2, ShoppingBag } from "lucide-react";
import { useCart, calcTotals } from "@/lib/cart";
import { formatIQD } from "@/lib/neomart";
import { useLocale } from "@/lib/i18n";
import { QuantityStepper } from "@/components/QuantityStepper";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "السلة — NEOMART" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const navigate = useNavigate();
  const { language, direction, text } = useLocale();
  const { subtotal, shipping, total } = calcTotals(items);

  return (
    <div dir={direction} className="min-h-screen max-w-3xl mx-auto flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate({ to: "/" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {text("رجوع", "Back")}
        </button>
        <h1 className="text-sm font-bold">{text("السلة", "Cart")}</h1>
        <div className="w-14" />
      </header>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">{text("السلة فارغة", "Your cart is empty")}</p>
          <Link to="/" className="text-sm font-bold text-primary">{text("ابدئي البحث", "Start shopping")}</Link>
        </div>
      ) : (
        <>
          <div className="flex-1 px-4 py-4 pb-44 flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.product_id} className="glass rounded-2xl border border-border/50 p-3 flex gap-3">
                <Link to="/product/$id" params={{ id: String(item.product_id) }} className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={language === "en" ? item.name_en || item.name : item.name} className="w-full h-full object-cover" />
                  ) : null}
                </Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                  <Link to="/product/$id" params={{ id: String(item.product_id) }} className="text-sm font-bold line-clamp-2 hover:text-primary">
                    {language === "en" ? item.name_en || item.name : item.name}
                  </Link>
                  <div className="flex items-center justify-between">
                    <QuantityStepper value={item.quantity} onChange={(v) => setQty(item.product_id, v)} />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold gradient-text">{formatIQD(item.price * item.quantity, language)}</span>
                      <button onClick={() => remove(item.product_id)} className="text-muted-foreground hover:text-destructive p-1" aria-label={text("حذف", "Remove")}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-3xl glass border-t border-border/50 px-4 py-3 flex flex-col gap-3 shadow-soft">
            <div className="flex flex-col gap-1 text-sm">
              <Row label={text("المجموع الفرعي", "Subtotal")} value={formatIQD(subtotal, language)} />
              <Row label={text("التوصيل", "Shipping")} value={shipping === 0 ? text("مجاني", "Free") : formatIQD(shipping, language)} />
              <div className="flex justify-between items-baseline pt-2 border-t border-border/50">
                <span className="font-bold">{text("الإجمالي", "Total")}</span>
                <span className="text-lg font-bold gradient-text">{formatIQD(total, language)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="inline-flex items-center justify-center text-sm font-bold bg-gradient-to-br from-primary to-[oklch(0.7_0.17_320)] text-primary-foreground rounded-full py-3 hover:opacity-90 transition"
            >
              {text("متابعة الدفع", "Continue to checkout")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
