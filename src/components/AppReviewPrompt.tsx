import { useSyncExternalStore, useState } from "react";
import {
  dismissAppReviewRequest,
  getPendingAppReview,
  markAppReviewStarted,
  openGooglePlayAppPage,
  subscribeAppReview,
} from "@/lib/appReview";
import { useLocale } from "@/lib/i18n";

export function AppReviewPrompt() {
  const pendingReview = useSyncExternalStore(
    subscribeAppReview,
    getPendingAppReview,
    () => null,
  );
  const { direction, text } = useLocale();
  const [requesting, setRequesting] = useState(false);

  if (!pendingReview) return null;

  async function handleReview() {
    if (requesting) return;
    setRequesting(true);
    markAppReviewStarted();
    try {
      await openGooglePlayAppPage();
    } catch (error) {
      console.warn("[app-review] Google Play review unavailable", error);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div
      dir={direction}
      className="fixed bottom-24 start-4 end-4 z-[70] mx-auto max-w-md rounded-2xl border border-primary/20 bg-background/95 p-4 shadow-soft backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-sm font-bold text-foreground">
          {text("كيف كانت تجربتك مع NEOMART؟", "How was your NEOMART experience?")}
        </p>
        <button
          type="button"
          onClick={() => void handleReview()}
          disabled={requesting}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {requesting ? text("جاري فتح التقييم...", "Opening review...") : text("تقييم التطبيق", "Rate the app")}
        </button>
        <button
          type="button"
          onClick={dismissAppReviewRequest}
          disabled={requesting}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label={text("إغلاق", "Close")}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
