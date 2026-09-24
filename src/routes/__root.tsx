import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { Grid3x3, MessageSquare, Package, ShoppingCart } from "lucide-react";
import { calcTotals, useCart } from "../lib/cart";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SplashScreen } from "../components/SplashScreen";
import { LocaleProvider, useLocale } from "../lib/i18n";
import { AppUpdatePrompt } from "../components/AppUpdatePrompt";
import { ConnectivityProvider } from "../lib/connectivity";
import { OfflineScreen } from "../components/OfflineScreen";
import { AppReviewPrompt } from "../components/AppReviewPrompt";

function NotFoundComponent() {
  const { text } = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {text("الصفحة غير موجودة", "Page not found")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {text(
            "الصفحة التي تبحثين عنها غير موجودة أو تم نقلها.",
            "The page you're looking for doesn't exist or has been moved.",
          )}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {text("العودة للرئيسية", "Go home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const { text } = useLocale();
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {text("تعذر تحميل الصفحة", "This page didn't load")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {text(
            "حدث خطأ ما. يمكنكِ المحاولة مرة أخرى أو العودة للرئيسية.",
            "Something went wrong on our end. You can try refreshing or head back home.",
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {text("المحاولة مرة أخرى", "Try again")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {text("العودة للرئيسية", "Go home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "NEOMART — مستشارك الذكي للجمال" },
      { name: "description", content: "ابحثي عن أفضل منتجات الجمال بالذكاء الاصطناعي." },
      { property: "og:title", content: "NEOMART" },
      { property: "og:description", content: "مستشار الجمال الذكي — توصيات منتجات فورية" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const lastBackPress = useRef(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | undefined;
    void import("@capacitor/app").then(({ App }) => {
      const listener = App.addListener("backButton", () => {
        const now = Date.now();
        if (now - lastBackPress.current < 500) {
          lastBackPress.current = 0;
          void App.exitApp();
          return;
        }

        lastBackPress.current = now;
        if (window.location.pathname !== "/") {
          window.history.back();
        }
      });
      void listener.then((handle) => {
        removeListener = () => void handle.remove();
      });
    });

    return () => removeListener?.();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) void import("../lib/push").then((m) => m.initPushNotifications());
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void import("../lib/sounds").then((m) => {
      cleanup = m.initUiSounds();
    });
    return () => cleanup?.();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ConnectivityProvider
          queryClient={queryClient}
          healthUrl={import.meta.env.VITE_SUPABASE_URL}
        >
          {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
          <Outlet />
          <BottomNavigation />
          <AppUpdatePrompt />
          <OfflineScreen />
          <AppReviewPrompt />
        </ConnectivityProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

function BottomNavigation() {
  const { pathname } = useLocation();
  const { language, text } = useLocale();
  const cartCount = useCart((state) => calcTotals(state.items).count);
  const items = [
    {
      to: "/products" as const,
      label: text("المنتجات", "Products"),
      icon: Grid3x3,
      active: pathname.startsWith("/products"),
    },
    {
      to: "/chat-history" as const,
      label: text("محادثات", "Conversations"),
      icon: MessageSquare,
      active: pathname.startsWith("/chat-history"),
    },
    {
      to: "/orders" as const,
      label: text("الطلبات", "Orders"),
      icon: Package,
      active: pathname.startsWith("/orders"),
    },
    {
      to: "/cart" as const,
      label: text("سلة مشتريات", "Shopping cart"),
      icon: ShoppingCart,
      active: pathname.startsWith("/cart"),
    },
  ];

  return (
    <nav
      dir={language === "ar" ? "rtl" : "ltr"}
      className="sticky bottom-0 z-20 border-t border-border/50 bg-background/95 px-4 py-2 shadow-soft backdrop-blur-xl"
      aria-label={text("التنقل الرئيسي", "Main navigation")}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around gap-2">
        {items.map(({ to, label, icon: Icon, active }) => (
          <Link
            key={to}
            to={to}
            preload="intent"
            preloadDelay={0}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-bold transition ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {to === "/cart" && cartCount > 0 && (
                <span className="absolute -end-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black leading-none text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
