import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useCart, calcTotals } from "@/lib/cart";
import {
  calculateCouponDiscount,
  createOrder,
  fetchProduct,
  formatIQD,
  generateOrderCode,
  validateCoupon,
  type CouponValidation,
} from "@/lib/neomart";
import { saveOrderRef } from "@/lib/orders";
import { attachPhoneToDevice } from "@/lib/push";
import { sounds } from "@/lib/sounds";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "إتمام الطلب — NEOMART" }] }),
  component: CheckoutPage,
});

const GOVERNORATES = [
  "بغداد",
  "البصرة",
  "أربيل",
  "السليمانية",
  "دهوك",
  "نينوى",
  "كركوك",
  "النجف",
  "كربلاء",
  "بابل",
  "الأنبار",
  "ديالى",
  "واسط",
  "ذي قار",
  "المثنى",
  "القادسية",
  "ميسان",
  "صلاح الدين",
];

const GOVERNORATES_EN: Record<string, string> = {
  بغداد: "Baghdad",
  البصرة: "Basra",
  أربيل: "Erbil",
  السليمانية: "Sulaymaniyah",
  دهوك: "Duhok",
  نينوى: "Nineveh",
  كركوك: "Kirkuk",
  النجف: "Najaf",
  كربلاء: "Karbala",
  بابل: "Babylon",
  الأنبار: "Anbar",
  ديالى: "Diyala",
  واسط: "Wasit",
  "ذي قار": "Dhi Qar",
  المثنى: "Muthanna",
  القادسية: "Al-Qadisiyah",
  ميسان: "Maysan",
  "صلاح الدين": "Saladin",
};

type Phase = "idle" | "submitting" | "success";
type RequiredField = "customer_name" | "customer_phone" | "area";

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const { language, direction, text } = useLocale();
  const { subtotal, shipping } = calcTotals(items);
  const [phase, setPhase] = useState<Phase>("idle");
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const couponDiscount = useMemo(
    () => (couponValidation ? calculateCouponDiscount(couponValidation, items) : 0),
    [couponValidation, items],
  );
  const total = Math.max(0, subtotal - couponDiscount + shipping);
  const [progress, setProgress] = useState(0);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<Record<RequiredField, boolean>>({
    customer_name: false,
    customer_phone: false,
    area: false,
  });
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    governorate: GOVERNORATES[0],
    area: "",
    landmark: "",
    notes: "",
    payment_method: "cod",
  });
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, []);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    if (v.trim() && k in missingFields) {
      setMissingFields((p) => ({ ...p, [k]: false }));
    }
  }

  async function applyCoupon() {
    setCouponError(null);
    setCouponLoading(true);
    try {
      const validation = await validateCoupon(couponCode);
      setCouponValidation(validation);
      if (
        validation.eligibleProductIds.length > 0 &&
        !items.some((item) => validation.eligibleProductIds.includes(item.product_id))
      ) {
        setCouponError(
          text("الكوبون لا ينطبق على منتجات السلة", "This coupon does not apply to cart products"),
        );
      }
    } catch (err) {
      setCouponValidation(null);
      const code = err instanceof Error ? err.message : "coupon_invalid";
      setCouponError(
        code === "coupon_usage_limit"
          ? text("تم استنفاد استخدامات هذا الكوبون", "This coupon has reached its usage limit")
          : code === "coupon_no_eligible_products"
            ? text(
                "الكوبون لا ينطبق على منتجات السلة",
                "This coupon does not apply to cart products",
              )
            : text("الكوبون غير صالح أو منتهي", "This coupon is invalid or expired"),
      );
    } finally {
      setCouponLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return setError(text("السلة فارغة", "Your cart is empty"));

    const missing: Record<RequiredField, boolean> = {
      customer_name: !form.customer_name.trim(),
      customer_phone: !form.customer_phone.trim(),
      area: !form.area.trim(),
    };
    if (Object.values(missing).some(Boolean)) {
      setMissingFields(missing);
      setError(
        text("يرجى تعبئة الاسم والهاتف والمنطقة", "Please fill in your name, phone, and area"),
      );
      const firstMissing = [
        { missing: missing.customer_name, ref: nameRef },
        { missing: missing.customer_phone, ref: phoneRef },
        { missing: missing.area, ref: areaRef },
      ].find((field) => field.missing);
      firstMissing?.ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      firstMissing?.ref.current?.focus({ preventScroll: true });
      return;
    }
    const order_code = generateOrderCode();
    sounds.confirm();
    setPhase("submitting");
    setProgress(8);
    const start = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - start;
      // Fast, responsive ramp: ~90% within 1.5s, then creeps while waiting
      const fast = Math.min(90, 8 + (elapsed / 1500) * 82);
      const creep = elapsed > 1500 ? Math.min(6, (elapsed - 1500) / 1000) : 0;
      setProgress(Math.round(Math.min(96, fast + creep)));
    }, 60);

    try {
      const orderItems = await Promise.all(
        items.map(async (item) => {
          const product = await fetchProduct(item.product_id).catch(() => null);
          return {
            ...item,
            name: item.name || product?.name || "منتج",
            name_en: item.name_en || product?.name_en,
            image: item.image || product?.main_image_url,
            short_description: item.short_description || product?.short_description,
            short_description_en: item.short_description_en || product?.short_description_en,
            description: item.description || product?.description,
            description_en: item.description_en || product?.description_en,
          };
        }),
      );
      await createOrder({
        order_code,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        governorate: form.governorate,
        area: form.area.trim(),
        landmark: form.landmark.trim(),
        notes: form.notes.trim(),
        items: orderItems,
        subtotal,
        shipping,
        total,
        payment_method: form.payment_method,
        coupon_code: couponValidation?.coupon.code,
      });
      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgress(100);
      saveOrderRef({
        order_code,
        phone: form.customer_phone.trim(),
        created_at: new Date().toISOString(),
      });
      void attachPhoneToDevice(form.customer_phone.trim());
      clear();
      setSuccessCode(order_code);
      setPhase("success");
      sounds.success();
      navigationTimer.current = setTimeout(
        () => navigate({ to: "/orders/$code", params: { code: order_code } }),
        1400,
      );
    } catch (err) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgress(0);
      setPhase("idle");
      sounds.error();
      const msg =
        err instanceof Error
          ? err.message
          : text("حدث خطأ غير متوقع", "An unexpected error occurred");
      setError(
        msg.includes("Failed to fetch")
          ? text(
              "تعذّر الاتصال بالخادم. تحققي من الإنترنت أو أعيدي المحاولة.",
              "Could not connect to the server. Check your internet connection and try again.",
            )
          : msg,
      );
    }
  }

  const submitting = phase === "submitting";

  return (
    <div dir={direction} className="min-h-screen max-w-3xl mx-auto flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/cart" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {text("رجوع", "Back")}
        </button>
        <h1 className="text-sm font-bold">{text("إتمام الطلب", "Checkout")}</h1>
        <div className="w-14" />
      </header>

      <form onSubmit={submit} className="flex-1 px-4 py-4 flex flex-col gap-4">
        <Section title={text("بيانات الاتصال", "Contact details")}>
          <Field
            label={text("الاسم الكامل *", "Full name *")}
            value={form.customer_name}
            onChange={(v) => set("customer_name", v)}
            placeholder={text("مثلاً: نور الهدى", "For example: Noor Alhuda")}
            inputRef={nameRef}
            error={missingFields.customer_name}
            errorMessage={text("هذا الحقل مطلوب", "This field is required")}
          />
          <Field
            label={text("رقم الهاتف *", "Phone number *")}
            value={form.customer_phone}
            onChange={(v) => set("customer_phone", v.replace(/\D/g, "").slice(0, 11))}
            placeholder="07XXXXXXXXX"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={11}
            inputRef={phoneRef}
            error={missingFields.customer_phone}
            errorMessage={text("هذا الحقل مطلوب", "This field is required")}
          />
        </Section>

        <Section title={text("بيانات التوصيل", "Delivery details")}>
          <div>
            <label className="text-xs text-muted-foreground">
              {text("المحافظة", "Governorate")}
            </label>
            <select
              value={form.governorate}
              onChange={(e) => set("governorate", e.target.value)}
              className="w-full mt-1 bg-card border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:border-primary/60 outline-none"
            >
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {language === "en" ? GOVERNORATES_EN[g] || g : g}
                </option>
              ))}
            </select>
          </div>
          <Field
            label={text("المنطقة / الحي *", "Area / neighborhood *")}
            value={form.area}
            onChange={(v) => set("area", v)}
            inputRef={areaRef}
            error={missingFields.area}
            errorMessage={text("هذا الحقل مطلوب", "This field is required")}
          />
          <Field
            label={text("أقرب نقطة دالة", "Nearest landmark")}
            value={form.landmark}
            onChange={(v) => set("landmark", v)}
          />
          <Field
            label={text("ملاحظات", "Notes")}
            value={form.notes}
            onChange={(v) => set("notes", v)}
            placeholder={text("اختياري", "Optional")}
          />
        </Section>

        <Section title={text("طريقة الدفع", "Payment method")}>
          <label className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 cursor-pointer bg-card">
            <input
              type="radio"
              checked={form.payment_method === "cod"}
              onChange={() => set("payment_method", "cod")}
            />
            <span className="text-sm font-bold">
              {text("الدفع عند الاستلام", "Cash on delivery")}
            </span>
          </label>
        </Section>

        <Section title={text("ملخّص الطلب", "Order summary")}>
          <div className="flex flex-col gap-1 text-sm">
            <Row
              label={text("عدد المنتجات", "Items")}
              value={String(items.reduce((n, i) => n + i.quantity, 0))}
            />
            <Row label={text("المجموع الفرعي", "Subtotal")} value={formatIQD(subtotal, language)} />
            {couponDiscount > 0 && (
              <Row
                label={text("خصم الكوبون", "Coupon discount")}
                value={`-${formatIQD(couponDiscount, language)}`}
              />
            )}
            <Row
              label={text("التوصيل", "Shipping")}
              value={shipping === 0 ? text("مجاني", "Free") : formatIQD(shipping, language)}
            />
            <div className="flex justify-between items-baseline pt-2 border-t border-border/50">
              <span className="font-bold">{text("الإجمالي", "Total")}</span>
              <span className="text-lg font-bold gradient-text">{formatIQD(total, language)}</span>
            </div>
          </div>
        </Section>

        <Section title={text("كوبون الخصم", "Discount coupon")}>
          <div className="flex items-center gap-2">
            <input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponValidation(null);
                setCouponError(null);
              }}
              placeholder={text("أدخلي رمز الكوبون", "Enter coupon code")}
              className="min-w-0 flex-1 rounded-xl border border-border/50 bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="button"
              onClick={() => void applyCoupon()}
              disabled={couponLoading || !couponCode.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
            >
              {couponLoading ? text("جارٍ التحقق", "Checking") : text("تطبيق", "Apply")}
            </button>
          </div>
          {couponValidation && !couponError && (
            <p className="text-xs text-primary">{text("تم تطبيق الكوبون", "Coupon applied")}</p>
          )}
          {couponError && <p className="text-xs text-destructive">{couponError}</p>}
        </Section>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-2xl px-4 py-3 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          data-sound="off"
          disabled={submitting || items.length === 0}
          className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-gradient-to-br from-primary to-[oklch(0.7_0.17_320)] text-primary-foreground rounded-full py-3.5 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {text("تأكيد الطلب", "Place order")}
        </button>
        <div className="h-4" />
      </form>

      {(phase === "submitting" || phase === "success") && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
          role="dialog"
          aria-live="polite"
        >
          <div className="glass rounded-3xl border border-border/50 p-6 max-w-sm w-full flex flex-col items-center gap-4 text-center">
            {phase === "submitting" ? (
              <>
                <div className="relative">
                  <Loader2 className="w-14 h-14 animate-spin text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold">
                    {text("جاري إرسال الطلب...", "Sending your order...")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {text("يرجى الانتظار قليلاً", "Please wait a moment")}
                  </p>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-[oklch(0.7_0.17_320)] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-14 h-14 text-foreground" />
                <div>
                  <p className="text-base font-bold">
                    {text("تم إرسال طلبك بنجاح ✅", "Your order was sent successfully ✅")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {text("رقم الطلب", "Order number")}
                  </p>
                  <p className="text-sm font-bold gradient-text mt-1">{successCode}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-border/50 p-4 flex flex-col gap-3">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  pattern,
  maxLength,
  inputRef,
  error = false,
  errorMessage,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  maxLength?: number;
  inputRef?: RefObject<HTMLInputElement | null>;
  error?: boolean;
  errorMessage?: string;
}) {
  return (
    <div>
      <label className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {label}
      </label>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        aria-invalid={error}
        className={`mt-1 w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none ${error ? "border-destructive focus:border-destructive" : "border-border/50 focus:border-primary/60"}`}
      />
      {error && errorMessage && <p className="mt-1 text-xs text-destructive">{errorMessage}</p>}
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
