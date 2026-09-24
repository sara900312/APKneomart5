import { useLocale } from "@/lib/i18n";

const MAP: Record<string, { ar: string; en: string; className: string }> = {
  pending: {
    ar: "قيد المراجعة",
    en: "Pending",
    className: "bg-muted text-muted-foreground border-border",
  },
  confirmed: { ar: "مؤكّد", en: "Confirmed", className: "bg-muted text-foreground border-border" },
  preparing: {
    ar: "قيد التحضير",
    en: "Preparing",
    className: "bg-muted text-muted-foreground border-border",
  },
  ready: { ar: "جاهز", en: "Ready", className: "bg-muted text-foreground border-border" },
  shipping: {
    ar: "قيد التوصيل",
    en: "Shipping",
    className: "bg-muted text-foreground border-border",
  },
  delivered: {
    ar: "تم التسليم",
    en: "Delivered",
    className: "bg-muted text-foreground border-border",
  },
  cancelled: {
    ar: "ملغى",
    en: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function OrderStatusBadge({ status }: { status?: string }) {
  const { language } = useLocale();
  const key = (status || "pending").toLowerCase();
  const info = MAP[key] ?? MAP.pending;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${info.className}`}
    >
      {info[language]}
    </span>
  );
}
