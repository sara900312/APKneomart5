import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { listOrdersByPhone, formatIQD } from "@/lib/neomart";
import { getLastPhone, loadOrderRefs } from "@/lib/orders";
import { useLocale } from "@/lib/i18n";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "طلباتي — NEOMART" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const navigate = useNavigate();
  const { language, direction, text } = useLocale();
  const [phone, setPhone] = useState(() => getLastPhone());
  const [orderCode, setOrderCode] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState({ phone: "", orderCode: "" });

  useEffect(() => {
    const latestOrder = loadOrderRefs()[0];
    if (!latestOrder) return;
    setPhone(latestOrder.phone);
    setOrderCode(latestOrder.order_code);
    setSubmittedSearch({ phone: latestOrder.phone, orderCode: latestOrder.order_code });
  }, []);

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders", submittedSearch.phone, submittedSearch.orderCode],
    queryFn: () => listOrdersByPhone(submittedSearch.phone, submittedSearch.orderCode),
    enabled: Boolean(submittedSearch.phone && submittedSearch.orderCode),
    refetchOnMount: "always",
    refetchInterval: 30_000,
  });

  return (
    <div dir={direction} className="min-h-screen max-w-3xl mx-auto flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {text("رجوع", "Back")}
        </button>
        <h1 className="text-sm font-bold">{text("طلباتي", "My orders")}</h1>
        <div className="w-14" />
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const nextPhone = phone.trim();
            const nextOrderCode = orderCode.trim().toUpperCase();
            if (!nextPhone || !nextOrderCode) return;
            setSubmittedSearch({ phone: nextPhone, orderCode: nextOrderCode });
          }}
          className="flex items-center gap-2 bg-card rounded-full border border-border/50 ps-4 pe-1 py-1 focus-within:border-primary/60"
        >
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={text("رقم الهاتف", "Phone number")}
            className="min-w-0 flex-1 bg-transparent outline-none text-sm py-2.5"
            type="tel"
            required
          />
          <input
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
            placeholder={text("رمز الطلب", "Order code")}
            className="min-w-0 flex-1 border-s border-border/50 bg-transparent ps-2 outline-none text-sm py-2.5"
            type="text"
            required
          />
          <button
            type="submit"
            disabled={!phone.trim() || !orderCode.trim()}
            className="w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={text("بحث", "Search")}
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center">
            {text("جاري التحميل...", "Loading...")}
          </p>
        )}
        {!isLoading && error && (
          <div className="text-center text-sm text-destructive space-y-2">
            <p>{text("تعذّر تحميل الطلبات", "Could not load orders")}</p>
            <button type="button" onClick={() => void refetch()} className="font-bold text-primary">
              {text("إعادة المحاولة", "Try again")}
            </button>
          </div>
        )}
        {!isLoading &&
          !error &&
          submittedSearch.phone &&
          submittedSearch.orderCode &&
          orders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {text(
                "لا يوجد طلب مطابق لرمز الطلب ورقم الهاتف",
                "No order matches this order code and phone number",
              )}
            </p>
          )}

        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.order_code}
              to="/orders/$code"
              params={{ code: o.order_code }}
              className="glass rounded-2xl border border-border/50 p-4 flex flex-col gap-2 hover:border-primary/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{o.order_code}</span>
                <OrderStatusBadge status={o.order_status} />
              </div>
              <div className="flex flex-col gap-2 border-t border-border/50 pt-2">
                {o.items?.map((item, idx) => (
                  <div key={`${o.order_code}-${idx}`} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={language === "en" ? item.name_en || item.name : item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          لا توجد صورة
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold line-clamp-2">
                        {language === "en" ? item.name_en || item.name : item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {text("الكمية", "Qty")}: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap">
                      {formatIQD(item.price * item.quantity, language)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString(language === "en" ? "en-IQ" : "ar-IQ")}
                </span>
                <span className="text-sm font-bold gradient-text">
                  {text("الإجمالي", "Total")}: {formatIQD(o.total, language)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
