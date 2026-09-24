const KEY = "neo_orders_v1";

export interface LocalOrderRef {
  order_code: string;
  phone: string;
  created_at: string;
}

export function saveOrderRef(ref: LocalOrderRef) {
  if (typeof window === "undefined") return;
  try {
    const list = loadOrderRefs().filter((r) => r.order_code !== ref.order_code);
    list.unshift(ref);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
    localStorage.setItem("neo_last_phone", ref.phone);
  } catch {
    /* ignore */
  }
}

export function loadOrderRefs(): LocalOrderRef[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function getLastPhone(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("neo_last_phone") || "";
}
