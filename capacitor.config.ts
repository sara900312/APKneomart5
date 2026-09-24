import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "neomart.space",
  appName: "NEOMART",
  webDir: ".output/public",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      // The web app hides the splash itself once React is ready (no flashing).
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: "#FFFFFF",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
      useDialog: false,
      // Android 12+ splash API
      androidSplashResourceName: "neomart_splash",
      layoutName: undefined,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notify",
      iconColor: "#111111",
    },
  },
};

export default config;
