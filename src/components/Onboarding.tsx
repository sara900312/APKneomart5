import { useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, Sparkles, Search, ShoppingBag } from "lucide-react";
import logo from "@/assets/neomart-transparent.webp";
import { useLocale } from "@/lib/i18n";

const SLIDES = [
  {
    icon: (
      <img
        src={logo}
        alt="NEOMART"
        className="w-40 h-40 object-contain drop-shadow-[0_8px_30px_oklch(0.35_0.012_240_/_0.25)]"
      />
    ),
    title: { ar: "مرحبًا بكِ في NEOMART", en: "Welcome to NEOMART" },
    desc: {
      ar: "مستشاركِ الذكي للجمال — توصيات مخصصة لبشرتكِ وشعركِ بضغطة زر.",
      en: "Your smart beauty advisor with personalized recommendations for your skin and hair.",
    },
  },
  {
    icon: (
      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.7_0.17_320)] flex items-center justify-center shadow-glow">
        <Search className="w-16 h-16 text-primary-foreground" />
      </div>
    ),
    title: { ar: "تجربة مع البحث الذكي", en: "Search smarter" },
    desc: {
      ar: "اكتبي ما تحتاجين بلغتكِ الطبيعية، ودعي الذكاء الاصطناعي يفهمكِ ويرشّح الأنسب.",
      en: "Describe what you need naturally and let AI find the right recommendations.",
    },
  },
  {
    icon: (
      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.7_0.17_320)] flex items-center justify-center shadow-glow">
        <Sparkles className="w-16 h-16 text-primary-foreground" />
      </div>
    ),
    title: { ar: "توصيات تناسبكِ", en: "Recommendations for you" },
    desc: {
      ar: "نختار لكِ المنتجات بناءً على نوع بشرتكِ ومشاكلها وميزانيتكِ.",
      en: "We select products based on your skin type, concerns, and budget.",
    },
  },
  {
    icon: (
      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.7_0.17_320)] flex items-center justify-center shadow-glow">
        <ShoppingBag className="w-16 h-16 text-primary-foreground" />
      </div>
    ),
    title: { ar: "تسوّقي بثقة", en: "Shop with confidence" },
    desc: {
      ar: "كل منتج مرتبط مباشرة بصفحته على NEOMART — جاهز للطلب فورًا.",
      en: "Every product links directly to its NEOMART page and is ready to order.",
    },
  },
];

export function Onboarding({ onDone }: { onDone: (dontShowAgain: boolean) => void }) {
  const { language, direction, text } = useLocale();
  const [i, setI] = useState(0);
  const [dontShow, setDontShow] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined || Math.abs(endX - startX) < 50) return;

    setI((current) =>
      endX > startX ? Math.min(current + 1, SLIDES.length - 1) : Math.max(current - 1, 0),
    );
  }

  return (
    <div dir={direction} className="fixed inset-0 z-50 bg-background flex flex-col">
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 animate-in fade-in duration-500 touch-pan-y"
        key={i}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStartX.current = null;
        }}
      >
        <div className="animate-in zoom-in-50 duration-500">{slide.icon}</div>
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl font-bold gradient-text">{slide.title[language]}</h2>
          <p className="text-muted-foreground leading-relaxed">{slide.desc[language]}</p>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-4">
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-1.5 bg-muted"}`}
            />
          ))}
        </div>

        <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          {text("لا تظهر مرة أخرى", "Don't show again")}
        </label>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onDone(dontShow)}
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2"
          >
            {text("تخطّي", "Skip")}
          </button>

          <button
            onClick={() => (last ? onDone(dontShow) : setI(i + 1))}
            className="flex items-center gap-2 bg-gradient-to-br from-primary to-[oklch(0.7_0.17_320)] text-primary-foreground rounded-full px-6 py-3 font-semibold shadow-glow hover:opacity-90 transition"
          >
            {last ? text("ابدئي الآن", "Get started") : text("التالي", "Next")}
            {!last && <ChevronLeft className="w-4 h-4 rtl:rotate-180" />}
          </button>
        </div>
      </div>
    </div>
  );
}
