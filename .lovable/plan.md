## Goal
Convert NEO AI from an external-link recommender into a self-contained in-app commerce experience powered by Supabase (products, orders) + existing Edge Functions (chat-bot, create-order, Telegram).

## Scope of removal
- Delete all external navigation: `product_url` buttons, `window.open`, `location.href`, deep links, any `neomart.space` reference.
- `ProductCard` no longer links out — clicking opens in-app Product Details.

## New pages / routes (TanStack file routes)
- `/` — AI chat search (kept, but cards open in-app)
- `/product/$id` — Product Details
- `/cart` — Cart
- `/checkout` — Checkout form + Confirm
- `/orders` — My Orders list
- `/orders/$code` — Order status detail

## State
- `src/lib/cart.ts` — Zustand-like store using `useSyncExternalStore` + localStorage. Actions: add, remove, setQty, clear. Derived: subtotal, shipping, total, discounts.
- `src/lib/orders.ts` — local cache of created orders (order_code + phone) to power `/orders` without auth.
- `src/lib/neomart.ts` — keep `askNeomart` (chat-bot). Add:
  - `fetchProduct(id)` — direct Supabase REST call using anon key.
  - `createOrder(payload)` — POSTs to existing `/functions/v1/create-order` edge function; falls back to inserting into `orders` table via PostgREST if the function is unavailable.
  - `listOrdersByPhone(phone)` — PostgREST select filtered by `customer_phone`.

## Components
- `ProductCard` — remove external link; whole card becomes `<Link to="/product/$id">`; add "أضيفي للسلة" button that calls cart store.
- `CartBadge` — floating cart icon in header showing count; navigates to `/cart`.
- `QuantityStepper`, `OrderStatusBadge` reusable pieces.

## Checkout flow
1. User fills form (name, phone, governorate, area, landmark, notes, payment method — COD default).
2. Client generates `order_code` (e.g. `NEO-` + timestamp base36) and payload: items[], subtotal, shipping, total, address parts.
3. POST to Supabase Edge Function `create-order` with anon auth headers (same pattern as chat-bot). The edge function is expected to persist to `orders`, decrement stock, send Telegram, insert notification — reuse existing keys.
4. On success: save `{order_code, phone}` to localStorage, clear cart, navigate to `/orders/$code` showing status "Pending".
5. If edge function call fails, show error; do NOT fallback to direct insert in first cut (keeps Telegram/stock logic centralized).

## Orders page
- Prompt for phone (or read from last order) → `listOrdersByPhone` via PostgREST `select` on `orders` filtered by `customer_phone`.
- Show list with `order_code`, date, total, status badge. Click → details page with full items breakdown.
- Statuses rendered in Arabic: Pending/Confirmed/Preparing/Shipping/Delivered/Cancelled.

## Product Details page
- Fetch by id from `products` table (all columns).
- Show image gallery (main + `images` array if present), name, price w/ discount, description, ingredients, usage, benefits, warnings, rating, stock count, quantity stepper, "Add to Cart" button, "Buy Now" (adds + go to /checkout).

## AI card change
- Existing `chat-bot` already returns product objects — we just render them and link to `/product/$id`. No change to edge function required.

## Header / navigation
- Header on all pages: logo + AI badge + cart icon (count). Chat page keeps "new conversation" button.

## Cleanup / non-goals
- Remove `product_url` reads and any UI that references it.
- Keep rate limiter as-is on chat page.
- No admin dashboard build in this pass (out of scope of client app).

## Technical notes
- Supabase REST base: `${SUPABASE_URL}/rest/v1/...` with `apikey` + `Authorization: Bearer <anon>` headers.
- Assumed table columns for `products`: id, name, name_en, short_description, description, ingredients, usage, benefits, warnings, price, discounted_price, is_discounted, discount_percent, main_image_url, images (jsonb/text[]), stock, rating, category, tags. If a column doesn't exist Supabase returns null — UI handles gracefully.
- Assumed `orders` columns per spec: order_code, customer_name, customer_phone, governorate, area, landmark, notes, items (jsonb), subtotal, shipping, total, payment_method, order_status, created_at.
- Shipping fee: flat 5,000 IQD (configurable const), free over 75,000 IQD.

## Files to create
- `src/lib/cart.ts`
- `src/lib/orders.ts`
- `src/components/CartBadge.tsx`
- `src/components/QuantityStepper.tsx`
- `src/components/OrderStatusBadge.tsx`
- `src/routes/product.$id.tsx`
- `src/routes/cart.tsx`
- `src/routes/checkout.tsx`
- `src/routes/orders.tsx`
- `src/routes/orders.$code.tsx`

## Files to edit
- `src/lib/neomart.ts` — add product/order helpers, extend `Product` type.
- `src/components/ProductCard.tsx` — remove external link, add cart button, wrap in `<Link>`.
- `src/routes/index.tsx` — add cart badge in header, remove any external-url logic.

## Verification
- Build passes.
- Chat still returns products; clicking a card lands on `/product/$id`.
- Add to cart → cart page shows items with qty controls.
- Checkout submit hits `/functions/v1/create-order` (verified via network tab).
- On success, redirected to `/orders/$code` showing Pending.
- `/orders` shows list by phone.

Proceed?