import { Capacitor } from "@capacitor/core";
import packageJson from "../../package.json";

export const APP_VERSION_FALLBACK = packageJson.version;

let appVersionPromise: Promise<string> | undefined;

export function getAppVersion() {
  if (!appVersionPromise) {
    appVersionPromise = (async () => {
      if (!Capacitor.isNativePlatform()) return APP_VERSION_FALLBACK;
      try {
        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        return info.version || APP_VERSION_FALLBACK;
      } catch {
        return APP_VERSION_FALLBACK;
      }
    })();
  }
  return appVersionPromise;
}
