import { useEffect, useRef, useState } from "react";
import { hasGooglePlayUpdate, startGooglePlayUpdate } from "@/lib/appUpdate";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function AppUpdatePrompt() {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    let disposed = false;
    let checking = false;
    let lastCheckAt = 0;

    const checkForUpdate = async () => {
      if (disposed || checking || Date.now() - lastCheckAt < CHECK_INTERVAL_MS) return;
      checking = true;
      lastCheckAt = Date.now();
      try {
        if ((await hasGooglePlayUpdate()) && !disposed && !dismissed.current) setVisible(true);
      } finally {
        checking = false;
      }
    };

    void checkForUpdate();
    const interval = window.setInterval(() => void checkForUpdate(), CHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4"
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-border/50 bg-background p-6 text-center shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-update-title"
      >
        <h2 id="app-update-title" className="text-lg font-bold text-foreground">
          يتوفر تحديث جديد للتطبيق يحتوي على تحسينات وإصلاحات.
        </h2>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              dismissed.current = true;
              setVisible(false);
            }}
            disabled={updating}
            className="flex-1 rounded-xl border border-border/50 px-3 py-2.5 text-sm font-bold text-muted-foreground transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            لاحقًا
          </button>
          <button
            type="button"
            onClick={async () => {
              dismissed.current = true;
              setUpdating(true);
              setVisible(false);
              try {
                await startGooglePlayUpdate();
              } finally {
                setUpdating(false);
              }
            }}
            disabled={updating}
            className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? "جاري التحديث..." : "تحديث الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}
