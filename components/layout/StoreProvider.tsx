"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { track } from "@/lib/analytics";

export type CartItem = {
  key: string;
  handle: string;
  variantId?: string;
  variantTitle?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};
export type WishItem = { handle: string; name: string; price: number; image: string };

type State = { cart: CartItem[]; wishlist: WishItem[]; hydrated: boolean };
type Action =
  | { type: "hydrate"; cart: CartItem[]; wishlist: WishItem[] }
  | { type: "add"; item: Omit<CartItem, "key" | "quantity">; quantity: number }
  | { type: "qty"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "wish"; item: WishItem }
  | { type: "setWish"; wishlist: WishItem[] };

const keyOf = (h: string, v?: string) => (v ? `${h}::${v}` : h);

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "hydrate": return { cart: a.cart, wishlist: a.wishlist, hydrated: true };
    case "add": {
      const key = keyOf(a.item.handle, a.item.variantId);
      const found = s.cart.find((c) => c.key === key);
      const cart = found
        ? s.cart.map((c) => (c.key === key ? { ...c, quantity: Math.min(10, c.quantity + a.quantity) } : c))
        : [...s.cart, { ...a.item, key, quantity: a.quantity }];
      return { ...s, cart };
    }
    case "qty": return { ...s, cart: s.cart.map((c) => (c.key === a.key ? { ...c, quantity: Math.max(1, Math.min(10, a.quantity)) } : c)) };
    case "remove": return { ...s, cart: s.cart.filter((c) => c.key !== a.key) };
    case "clear": return { ...s, cart: [] };
    case "setWish": return { ...s, wishlist: a.wishlist };
    case "wish": {
      const has = s.wishlist.some((w) => w.handle === a.item.handle);
      return { ...s, wishlist: has ? s.wishlist.filter((w) => w.handle !== a.item.handle) : [a.item, ...s.wishlist] };
    }
  }
}

type Ctx = State & {
  add: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQty: (key: string, q: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  toggleWish: (item: WishItem) => void;
  isWished: (handle: string) => boolean;
  count: number;
  subtotal: number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  toast: string | null;
  notify: (msg: string) => void;
  /* accounts */
  customer: Customer | null;
  accountsAvailable: boolean;
  accountReady: boolean;
  setCustomer: (c: Customer | null) => void;
  authReason: AuthReason | null;
  openAuth: (reason?: AuthReason) => void;
  closeAuth: () => void;
  logout: () => Promise<void>;
};

export type AuthReason = "account" | "wishlist" | "checkout";
export type Address = { id: string; label: string; name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; isDefault?: boolean };
export type Customer = { id: string; name: string; phone: string; email: string; phoneVerified: boolean; emailVerified: boolean; addresses: Address[]; wishlist: WishItem[]; createdAt: string; marketingConsent?: boolean };

const StoreCtx = createContext<Ctx | null>(null);
const LS_KEY = "nemara:v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { cart: [], wishlist: [], hydrated: false });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [accountsAvailable, setAccountsAvailable] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [authReason, setAuthReason] = useState<AuthReason | null>(null);
  const merged = useRef<string | null>(null);
  const wishPrompted = useRef(false);

  useEffect(() => {
    fetch("/api/account/me", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setAccountsAvailable(!!d.available);
      setCustomerState(d.customer ?? null);
    }).catch(() => {}).finally(() => setAccountReady(true));
  }, []);

  // on sign-in: merge this device's wishlist into the account (union), then keep them in sync
  useEffect(() => {
    if (!customer || !state.hydrated || merged.current === customer.id) return;
    merged.current = customer.id;
    const union = [...customer.wishlist];
    for (const w of state.wishlist) if (!union.some((u) => u.handle === w.handle)) union.push(w);
    dispatch({ type: "setWish", wishlist: union });
  }, [customer, state.hydrated, state.wishlist]);
  useEffect(() => {
    if (!customer || merged.current !== customer.id) return;
    const t = window.setTimeout(() => {
      fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: state.wishlist }) }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(t);
  }, [state.wishlist, customer]);

  useEffect(() => {
    let cart: CartItem[] = [], wishlist: WishItem[] = [];
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) ({ cart = [], wishlist = [] } = JSON.parse(raw));
    } catch { /* storage unavailable — start empty */ }
    dispatch({ type: "hydrate", cart, wishlist });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify({ cart: state.cart, wishlist: state.wishlist })); } catch { /* ignore */ }
  }, [state]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  const value = useMemo<Ctx>(() => ({
    ...state,
    add: (item, quantity = 1) => {
      dispatch({ type: "add", item, quantity });
      track("add_to_cart", { item_id: item.handle, variant: item.variantTitle, value: item.price * quantity, currency: "INR" });
      setCartOpen(true);
    },
    setQty: (key, q) => dispatch({ type: "qty", key, quantity: q }),
    remove: (key) => dispatch({ type: "remove", key }),
    clear: () => dispatch({ type: "clear" }),
    toggleWish: (item) => {
      const had = state.wishlist.some((w) => w.handle === item.handle);
      dispatch({ type: "wish", item });
      if (!had) track("add_to_wishlist", { item_id: item.handle, value: item.price, currency: "INR" });
      notify(had ? "Removed from your wishlist" : customer ? "Saved to your wishlist" : "Saved on this device");
      // invite (once per visit) to save the wishlist to an account — never blocks saving
      if (!had && !customer && accountsAvailable && !wishPrompted.current) {
        wishPrompted.current = true;
        window.setTimeout(() => setAuthReason("wishlist"), 500);
      }
    },
    isWished: (h) => state.wishlist.some((w) => w.handle === h),
    count: state.cart.reduce((n, c) => n + c.quantity, 0),
    subtotal: state.cart.reduce((n, c) => n + c.quantity * c.price, 0),
    cartOpen, setCartOpen, searchOpen, setSearchOpen, toast, notify,
    customer, accountsAvailable, accountReady,
    setCustomer: (c) => { setCustomerState(c); if (!c) merged.current = null; },
    authReason, openAuth: (r = "account") => setAuthReason(r), closeAuth: () => setAuthReason(null),
    logout: async () => { await fetch("/api/account/logout", { method: "POST" }).catch(() => {}); merged.current = null; setCustomerState(null); notify("Signed out"); },
  }), [state, cartOpen, searchOpen, toast, notify, customer, accountsAvailable, accountReady, authReason]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
