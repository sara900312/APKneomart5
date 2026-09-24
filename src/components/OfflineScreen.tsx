import { RefreshCw, WifiOff } from "lucide-react";
import { useConnectivity } from "@/lib/connectivity";
import { useLocale } from "@/lib/i18n";

export function OfflineScreen() {
  const { status, isOnline, retryFailed, retryConnection } = useConnectivity();
  const { direction, text } = useLocale();

  if (isOnline) return null;

  const checking = status === "checking";
  const description = checking
    ? text("جاري التحقق...", "Checking connection...")
    : retryFailed
      ? text(
          "ما زال الاتصال بالإنترنت غير متوفر. حاول مرة أخرى.",
          "The internet connection is still unavailable. Try again.",
        )
      : text(
          "يبدو أن جهازك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
          "Your device appears to be offline. Check your connection and try again.",
        );

  return (
    <div
      dir={direction}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-background px-6 text-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      aria-describedby="offline-description"
    >
      <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card/80 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-soft">
          <WifiOff className="h-9 w-9" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h1 id="offline-title" className="mt-6 text-xl font-black text-foreground">
          {text("لا يوجد اتصال بالإنترنت", "No internet connection")}
        </h1>
        <p id="offline-description" className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <button
          type="button"
          onClick={() => void retryConnection()}
          disabled={checking}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-[oklch(0.48_0.012_240)] px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} aria-hidden="true" />
          {checking ? text("جاري التحقق...", "Checking...") : text("إعادة المحاولة", "Try again")}
        </button>
      </div>
    </div>
  );
}
