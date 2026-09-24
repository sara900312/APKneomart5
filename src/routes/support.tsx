import { ArrowRight, ExternalLink, Facebook, Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "الدعم والتواصل — NEOMART" },
      { name: "description", content: "تواصل مع فريق NEOMART عبر الهاتف والبريد ومنصات التواصل الاجتماعي." },
    ],
  }),
  component: SupportPage,
});

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 3c.3 1.8 1.3 3 3.4 3.1v3a7.7 7.7 0 0 1-3.4-1V14a5.1 5.1 0 1 1-5.1-5.1c.3 0 .7 0 1 .1v3.1a2.2 2.2 0 1 0 1.2 2V3h2.9Z" />
    </svg>
  );
}

const CONTACTS = [
  {
    label: "اتصلي بنا",
    value: "+964 777 684 5909",
    href: "tel:+9647776845909",
    icon: Phone,
    style: "from-primary/15 to-primary/5",
    iconOnly: false,
  },
  {
    label: "راسلينا عبر البريد",
    value: "neomart.space@gmail.com",
    href: "mailto:neomart.space@gmail.com",
    icon: Mail,
    style: "from-muted-foreground/15 to-muted/40",
    iconOnly: false,
  },
  {
    label: "Instagram",
    value: "@neomart_beauty",
    href: "https://www.instagram.com/neomart_beauty/",
    icon: Instagram,
    style: "from-muted-foreground/15 to-muted/40",
    iconOnly: true,
  },
  {
    label: "Facebook",
    value: "Neomart.Space",
    href: "https://www.facebook.com/Neomart.Space",
    icon: Facebook,
    style: "from-muted-foreground/15 to-muted/40",
    iconOnly: true,
  },
  {
    label: "TikTok",
    value: "@neomart_space",
    href: "https://www.tiktok.com/@neomart_space",
    icon: TikTokIcon,
    style: "from-slate-500/15 to-slate-400/5",
    iconOnly: true,
  },
];

function SupportPage() {
  const navigate = useNavigate();
  const { direction, text } = useLocale();

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
        <h1 className="text-sm font-bold">{text("الدعم والتواصل", "Support & contact")}</h1>
        <div className="w-14" />
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-card to-[oklch(0.7_0.17_320)]/15 border border-primary/20 p-6 text-center shadow-soft">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold gradient-text">{text("نحن هنا لمساعدتك", "We are here to help")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {text("تواصلي معنا عبر القناة المناسبة لكِ وسيسعد فريق NEOMART بخدمتكِ.", "Choose the channel that works best for you. The NEOMART team will be happy to help.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {CONTACTS.filter(({ iconOnly }) => !iconOnly).map(({ label, value, href, icon: Icon, style }) => (
            <a
              key={href}
              href={href}
              className={`group rounded-2xl border border-border/50 bg-gradient-to-br ${style} p-4 flex items-center gap-3 hover:border-primary/50 hover:shadow-soft transition-all`}
            >
              <span className="w-11 h-11 rounded-xl bg-background/70 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">{label === "اتصلي بنا" ? text("اتصلي بنا", "Call us") : label === "راسلينا عبر البريد" ? text("راسلينا عبر البريد", "Email us") : label}</span>
                <span className="block text-sm font-bold truncate mt-1">{value}</span>
              </span>
            </a>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-5">
          {CONTACTS.filter(({ iconOnly }) => iconOnly).map(({ label, href, icon: Icon, style }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (!Capacitor.isNativePlatform()) return;
                event.preventDefault();
                void Browser.open({ url: href });
              }}
              aria-label={label}
              className={`group w-16 h-16 rounded-2xl border border-border/50 bg-gradient-to-br ${style} flex items-center justify-center hover:border-primary/50 hover:shadow-soft transition-all`}
            >
              <span className="w-12 h-12 rounded-xl bg-background/70 text-primary flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </span>
            </a>
          ))}
        </div>

        <div className="mt-8 border-t border-border/50 pt-5 text-center">
          <Link to="/privacy-policy" className="text-xs text-muted-foreground transition hover:text-primary">
            {text("السياسات والشروط", "Policies & terms")}
          </Link>
        </div>
      </main>
    </div>
  );
}
