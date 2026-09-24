// Registers the device for FCM push notifications on Capacitor (Android/iOS).
// No-op on plain web. Persists the token to Supabase `customer_devices` when a phone is known.
import { supabase } from "@/integrations/supabase/client";
import { getLastPhone } from "@/lib/orders";
import { queueAppReviewRequest } from "@/lib/appReview";

let started = false;
const PUSH_STARTED_KEY = "__neoPushListenersStarted";

type NotificationData = Record<string, string | undefined>;

function isCapacitor(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(
      window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
    ).Capacitor?.isNativePlatform?.()
  );
}

function openOrder(code: unknown) {
  if (typeof code === "string" && code && typeof window !== "undefined") {
    window.location.href = `/orders/${code}`;
  }
}

function handleNotificationData(data: NotificationData) {
  queueAppReviewRequest(data);
}

function notificationType(status: string | undefined): string {
  const types: Record<string, string> = {
    pending: "ORDER_CREATED",
    confirmed: "ORDER_CONFIRMED",
    preparing: "ORDER_PREPARING",
    ready: "ORDER_READY",
    shipping: "ORDER_OUT_FOR_DELIVERY",
    shipped: "ORDER_OUT_FOR_DELIVERY",
    delivered: "ORDER_DELIVERED",
    cancelled: "ORDER_CANCELLED",
  };
  return types[status ?? ""] ?? "ORDER_STATUS_UPDATE";
}

export function getNotificationIdentity(data: NotificationData): string | null {
  const notificationId = data.notification_id?.trim();
  if (notificationId) return notificationId;
  const orderId = data.order_id?.trim() || data.order_code?.trim();
  const status = data.status?.trim();
  if (!orderId || !status) return null;
  return `${orderId}:${notificationType(status)}:${status}`;
}

function logNotificationEvent(event: string, data: NotificationData, source: string) {
  if (!import.meta.env.DEV) return;
  console.log(event, {
    notification_id: getNotificationIdentity(data),
    order_id: data.order_id,
    order_status: data.status,
    notification_type: notificationType(data.status),
    timestamp: new Date().toISOString(),
    source,
  });
}

async function saveToken(token: string, platform: string) {
  const phone = getLastPhone();
  const previousToken =
    typeof window !== "undefined" ? localStorage.getItem("neo_fcm_token") : null;
  if (typeof window !== "undefined") localStorage.setItem("neo_fcm_token", token);
  if (!phone) return;
  try {
    if (previousToken && previousToken !== token) {
      await supabase
        .from("customer_devices")
        .update({ device_token: token, phone, platform, updated_at: new Date().toISOString() })
        .eq("device_token", previousToken);
    }
    await supabase
      .from("customer_devices")
      .upsert(
        { phone, device_token: token, platform, updated_at: new Date().toISOString() },
        { onConflict: "device_token" },
      );
    logNotificationEvent("FCM_TOKEN_REGISTERED", { device_id: token.slice(-8) }, "registration");
  } catch (e) {
    console.error("saveToken error", e);
  }
}

export async function attachPhoneToDevice(phone: string) {
  if (typeof window === "undefined" || !phone) return;
  const token = localStorage.getItem("neo_fcm_token");
  if (!token) return;
  const platform = isCapacitor() ? "android" : "web";
  try {
    await supabase
      .from("customer_devices")
      .upsert(
        { phone, device_token: token, platform, updated_at: new Date().toISOString() },
        { onConflict: "device_token" },
      );
  } catch (e) {
    console.error("attachPhoneToDevice error", e);
  }
}

export async function initPushNotifications() {
  if (started || !isCapacitor()) return;
  const pushWindow = window as typeof window & { [PUSH_STARTED_KEY]?: boolean };
  if (pushWindow[PUSH_STARTED_KEY]) return;
  started = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Notification channel (also created natively in MainActivity for FCM defaults).
    try {
      await PushNotifications.createChannel({
        id: "orders",
        name: "Order updates",
        description: "Notifications about your NEOMART orders",
        importance: 5,
        visibility: 1,
        vibration: true,
      });
    } catch {
      /* channels are Android-only */
    }

    // Android 13+ POST_NOTIFICATIONS — the OS shows the dialog only once per install.
    let perm;
    try {
      perm = await PushNotifications.checkPermissions();
    } catch {
      return;
    }
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      try {
        perm = await PushNotifications.requestPermissions();
      } catch {
        return;
      }
    }
    if (perm.receive !== "granted") return;

    // Listeners must be registered before register() so cold-start events are not lost.
    await PushNotifications.addListener("registration", (t) => {
      void saveToken(t.value, "android");
    });
    await PushNotifications.addListener("registrationError", (err) => {
      console.error("push registration error", err);
      // Retry once — transient Play Services failures are common on first launch.
      window.setTimeout(() => {
        void PushNotifications.register().catch(() => {});
      }, 4000);
    });

    // Capacitor renders FCM notification payloads through Android's system notification path.
    // This callback is diagnostic only; creating a local notification here would duplicate it.
    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      const data = (notification.data ?? {}) as NotificationData;
      logNotificationEvent("PUSH_RECEIVED", data, "capacitor.system");
      handleNotificationData(data);
      logNotificationEvent("SYSTEM_NOTIFICATION_EXPECTED", data, "capacitor.system");
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const data = (action.notification?.data ?? {}) as NotificationData;
      logNotificationEvent("NOTIFICATION_ACTION", data, "capacitor.fcm");
      handleNotificationData(data);
      openOrder(data.order_code);
    });

    pushWindow[PUSH_STARTED_KEY] = true;
    await PushNotifications.register();

    try {
      const delivered = await PushNotifications.getDeliveredNotifications();
      delivered.notifications.forEach((notification) => {
        handleNotificationData((notification.data ?? {}) as NotificationData);
      });
    } catch {
      // Delivered notifications are optional on platforms that do not expose them.
    }
  } catch (e) {
    console.error("initPushNotifications error", e);
  }
}
