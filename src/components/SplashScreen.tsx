import { useEffect, useState } from "react";
import logo from "@/assets/neomart-transparent.webp";

function hideNativeSplash() {
  const isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();
  if (!isNative) return;
  void import("@capacitor/splash-screen")
    .then((m) => m.SplashScreen.hide({ fadeOutDuration: 250 }))
    .catch(() => {});
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // The web splash is up, so the native launch splash can go away without a flash.
    hideNativeSplash();
    const holdTimer = window.setTimeout(() => setFadeOut(true), 1600);
    const doneTimer = window.setTimeout(() => onDone(), 2000);
    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-[400ms] ${fadeOut ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"}`}
      aria-hidden="true"
    >
      <img
        src={logo}
        alt=""
        className="w-[50vw] max-w-[50vh] aspect-square object-contain animate-in fade-in zoom-in-95 duration-700"
      />
    </div>
  );
}
