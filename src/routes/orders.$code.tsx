import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bell, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  fetchOrder,
  fetchProduct,
  normalizeOrderRow,
  formatIQD,
  productDescription,
  productName,
  productShortDescription,
} from "@/lib/neomart";
import { useLocale } from "@/lib/i18n";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { sounds } from "@/lib/sounds";

export const Route = createFileRoute("/orders/$code")({
  head: () => ({ meta: [{ title: "تفاصيل الطلب — NEOMART" }] }),
  component: OrderDetailsPage,
});

const STATUS_AR: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكّد",
  preparing: "قيد التحضير",
  ready: "جاهز",
  shipping: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

const STATUS_EN: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function OrderDetailsPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { language, direction, text } = useLocale();
  const qc = useQueryClient();
  const lastStatusRef = useRef<string | undefined>(undefined);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", code],
    queryFn: () => fetchOrder(code),
    refetchInterval: 30_000,
  });
  const { data: productDetails = [] } = useQuery({
    queryKey: ["order-products", code, order?.items?.map((item) => item.product_id)],
    queryFn: async () =>
      Promise.all((order?.items ?? []).map((item) => fetchProduct(String(item.product_id)))),
    enabled: Boolean(order?.items?.length),
  });

  // Realtime subscription for this order
  useEffect(() => {
    let active = true;
    const channel = supabase
      .channel(`order-${code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `order_code=eq.${code}` },
        (payload) => {
          if (!active) return;
          qc.setQueryData(["order", code], normalizeOrderRow(payload.new));
          const newStatus = (payload.new as { order_status?: string }).order_status;
          if (newStatus && lastStatusRef.current && newStatus !== lastStatusRef.current) {
            const label = text(
              STATUS_AR[newStatus] ?? newStatus,
              STATUS_EN[newStatus] ?? newStatus,
            );
            if (newStatus === "delivered") sounds.success();
            else if (newStatus === "cancelled") sounds.error();
            else sounds.confirm();

            const isNativeApp =
              typeof window !== "undefined" &&
              Boolean(
                (
                  window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
                ).Capacitor?.isNativePlatform?.(),
              );
            if (
              !isNativeApp &&
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(text("تحديث حالة طلبك", "Order status update"), {
                  body: `${text("طلب", "Order")} ${code}: ${label}`,
                  icon: "/favicon.ico",
                  tag: `order-${code}`,
                });
              } catch {
                /* ignore */
              }
            }
          }
          lastStatusRef.current = newStatus ?? lastStatusRef.current;
        },
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [code, qc, text]);

  useEffect(() => {
    if (order?.order_status) lastStatusRef.current = order.order_status;
  }, [order?.order_status]);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  }

  return (
    <div dir={direction} className="min-h-screen max-w-3xl mx-auto flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/orders" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {text("رجوع", "Back")}
        </button>
        <h1 className="text-sm font-bold">{text("تفاصيل الطلب", "Order details")}</h1>
        <div className="w-14" />
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col gap-4">
        <div className="text-center flex flex-col items-center gap-2">
          <CheckCircle2 className="w-14 h-14 text-foreground" />
          <h2 className="text-lg font-bold">
            {text("تم إنشاء طلبكِ بنجاح", "Your order was created successfully")}
          </h2>
          <p className="text-xs text-muted-foreground">{text("رقم الطلب", "Order number")}</p>
          <p className="text-sm font-bold gradient-text">{code}</p>
          <div className="mt-2">
            <OrderStatusBadge status={order?.order_status} />
          </div>
        </div>

        {notifPerm === "default" && (
          <button
            onClick={enableNotifications}
            className="mx-auto flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary border border-primary/30 rounded-full px-4 py-2 hover:bg-primary/20 transition"
          >
            <Bell className="w-4 h-4" />
            {text(
              "تفعيل الإشعارات لتصلكِ تحديثات حالة الطلب",
              "Enable notifications for order updates",
            )}
          </button>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center">
            {text("جاري تحميل التفاصيل...", "Loading details...")}
          </p>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-destructive">
            <p>{text("تعذّر تحميل تفاصيل الطلب", "Could not load order details")}</p>
            <button type="button" onClick={() => void refetch()} className="font-bold text-primary">
              {text("إعادة المحاولة", "Try again")}
            </button>
          </div>
        )}

        {order && (
          <>
            <div className="glass rounded-2xl border border-border/50 p-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold">{text("المنتجات", "Products")}</h3>
              {order.items?.map((item, idx) => {
                const product = productDetails.find(
                  (candidate) => candidate?.id === item.product_id,
                );
                const image = item.image || product?.main_image_url;
                const displayName =
                  language === "en"
                    ? item.name_en || (product ? productName(product, "en") : item.name)
                    : item.name;
                const description =
                  language === "en"
                    ? item.short_description_en ||
                      item.description_en ||
                      (product
                        ? productShortDescription(product, "en") ||
                          productDescription(product, "en")
                        : undefined)
                    : item.short_description ||
                      item.description ||
                      product?.short_description ||
                      product?.description;
                return (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-2xl border border-border/50 bg-card/40 p-3"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {image ? (
                        <img src={image} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          {text("لا توجد صورة", "No image")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-sm font-bold line-clamp-2">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {text("السعر", "Price")}: {formatIQD(item.price, language)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {text("الكمية", "Qty")}: {item.quantity}
                      </p>
                      {description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {description}
                        </p>
                      )}
                      <p className="text-sm font-bold gradient-text mt-1">
                        {text("الإجمالي", "Total")}:{" "}
                        {formatIQD(item.price * item.quantity, language)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass rounded-2xl border border-border/50 p-4 flex flex-col gap-2 text-sm">
              <Row
                label={text("المجموع الفرعي", "Subtotal")}
                value={formatIQD(order.subtotal, language)}
              />
              <Row
                label={text("التوصيل", "Shipping")}
                value={
                  order.shipping === 0 ? text("مجاني", "Free") : formatIQD(order.shipping, language)
                }
              />
              <div className="flex justify-between items-baseline pt-2 border-t border-border/50">
                <span className="font-bold">{text("الإجمالي", "Total")}</span>
                <span className="text-lg font-bold gradient-text">
                  {formatIQD(order.total, language)}
                </span>
              </div>
            </div>

            <div className="glass rounded-2xl border border-border/50 p-4 flex flex-col gap-2 text-sm">
              <h3 className="font-bold mb-1">{text("بيانات التوصيل", "Delivery details")}</h3>
              <Row label={text("الاسم", "Name")} value={order.customer_name} />
              <Row label={text("الهاتف", "Phone")} value={order.customer_phone} />
              {order.governorate && (
                <Row label={text("المحافظة", "Governorate")} value={order.governorate} />
              )}
              {order.area && <Row label={text("المنطقة", "Area")} value={order.area} />}
              {order.landmark && (
                <Row label={text("نقطة دالة", "Landmark")} value={order.landmark} />
              )}
              {order.notes && <Row label={text("ملاحظات", "Notes")} value={order.notes} />}
              <Row
                label={text("طريقة الدفع", "Payment method")}
                value={
                  order.payment_method === "cod"
                    ? text("الدفع عند الاستلام", "Cash on delivery")
                    : order.payment_method
                }
              />
            </div>
          </>
        )}

        <Link to="/" className="text-center text-sm font-bold text-primary hover:underline">
          {text("العودة للصفحة الرئيسية", "Back to home")}
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground gap-4">
      <span>{label}</span>
      <span className="text-foreground text-end">{value}</span>
    </div>
  );
}
