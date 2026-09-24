import { Capacitor } from "@capacitor/core";

export async function hasGooglePlayUpdate() {
  if (Capacitor.getPlatform() !== "android") return false;

  try {
    const { AppUpdate, AppUpdateAvailability } = await import("@capawesome/capacitor-app-update");
    const info = await AppUpdate.getAppUpdateInfo();
    return info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
  } catch (error) {
    console.warn("[app-update] Google Play check unavailable", error);
    return false;
  }
}

export async function startGooglePlayUpdate() {
  if (Capacitor.getPlatform() !== "android") return;

  let listener: { remove: () => Promise<void> } | undefined;
  try {
    const { AppUpdate, AppUpdateAvailability, AppUpdateResultCode, FlexibleUpdateInstallStatus } =
      await import("@capawesome/capacitor-app-update");
    const info = await AppUpdate.getAppUpdateInfo();

    if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;

    if (!info.flexibleUpdateAllowed) {
      await AppUpdate.openAppStore();
      return;
    }

    listener = await AppUpdate.addListener("onFlexibleUpdateStateChange", (state) => {
      if (state.installStatus !== FlexibleUpdateInstallStatus.DOWNLOADED) return;
      void (async () => {
        try {
          await AppUpdate.completeFlexibleUpdate();
        } finally {
          await listener?.remove();
          listener = undefined;
        }
      })();
    });
    const result = await AppUpdate.startFlexibleUpdate();
    if (result.code !== AppUpdateResultCode.OK) {
      await listener?.remove();
      listener = undefined;
      if (result.code !== AppUpdateResultCode.CANCELED) await AppUpdate.openAppStore();
    }
  } catch (error) {
    console.warn("[app-update] Google Play update unavailable", error);
    await listener?.remove().catch(() => undefined);
    try {
      const { AppUpdate } = await import("@capawesome/capacitor-app-update");
      await AppUpdate.openAppStore();
    } catch (storeError) {
      console.warn("[app-update] Could not open Google Play", storeError);
    }
  }
}
