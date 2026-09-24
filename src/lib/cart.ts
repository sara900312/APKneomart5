import { useSyncExternalStore } from "react";
import type { OrderItem } from "./neomart";

const KEY = "neo_cart_v1";

export interface CartState {
  items: OrderItem[];
}

type Listener = () => void;

let state: CartState = load();
const listeners = new Set<Listener>();

function load(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function setState(next: CartState) {
  state = next;
  persist();
}

const store = {
  getState: () => state,
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add: (item: OrderItem) => {
    const idx = state.items.findIndex((i) => i.product_id === item.product_id);
    if (idx >= 0) {
      const items = [...state.items];
      items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
      setState({ items });
    } else {
      setState({ items: [...state.items, item] });
    }
  },
  setQty: (product_id: number, quantity: number) => {
    if (quantity <= 0) {
      setState({ items: state.items.filter((i) => i.product_id !== product_id) });
      return;
    }
    setState({
      items: state.items.map((i) => (i.product_id === product_id ? { ...i, quantity } : i)),
    });
  },
  remove: (product_id: number) => {
    setState({ items: state.items.filter((i) => i.product_id !== product_id) });
  },
  clear: () => setState({ items: [] }),
};

export const SHIPPING_FEE = 5000;
export const FREE_SHIPPING_THRESHOLD = 75000;

export function calcTotals(items: OrderItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = items.length === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  return { subtotal, shipping, total, count };
}

const EMPTY_SNAPSHOT: CartState = { items: [] };

export function useCart<T>(selector: (s: typeof store & CartState) => T): T {
  const snap = useSyncExternalStore(
    store.subscribe,
    () => state,
    () => EMPTY_SNAPSHOT,
  );
  return selector({ ...store, ...snap });
}

export const cart = store;
