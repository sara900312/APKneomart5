import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { connectionFetch } from "@/lib/connectivity";

type LegacyDatabase = {
  public: {
    Tables: {
      products: {
        Row: Product & Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: number;
          code: string;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          usage_limit?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active: boolean;
          description?: string | null;
          maximum_quantity?: number | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coupons_products: {
        Row: { coupon_id: number; product_id: number };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coupon_usage: {
        Row: { id: number; coupon_id: number };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let legacyProductsClient: ReturnType<typeof createClient<LegacyDatabase>> | undefined;

function getLegacyProductsClient() {
  if (!legacyProductsClient) {
    const url = import.meta.env.VITE_LEGACY_SUPABASE_URL;
    const key = import.meta.env.VITE_LEGACY_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing legacy products Supabase environment variables.");
    legacyProductsClient = createClient<LegacyDatabase>(url, key, {
      global: { fetch: connectionFetch },
    });
  }
  return legacyProductsClient;
}

export interface Product {
  id: number;
  name: string;
  name_en?: string;
  short_description?: string;
  short_description_en?: string;
  description?: string;
  description_en?: string;
  ingredients?: string;
  ingredients_en?: string;
  usage?: string;
  usage_en?: string;
  benefits?: string;
  benefits_en?: string;
  warnings?: string;
  warnings_en?: string;
  brand_en?: string;
  category_en?: string;
  main_store_name?: string;
  subcategory_id?: number | string;
  price: number;
  discounted_price?: number;
  is_discounted?: boolean;
  discount_percent?: number;
  main_image_url?: string;
  images?: string[];
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
  slug?: string;
  category?: string;
  brand?: string;
  tags?: string[];
  stock?: number;
  rating?: number;
  skin_problems?: string[];
  routine_type?: string;
  published?: boolean;
}

export function isDisplayableProduct(product: Product) {
  const categories = [product.category, product.category_en]
    .filter(Boolean)
    .map((category) => category!.trim().toLowerCase());
  return product.published === true && !categories.includes("uncategorized");
}

export function normalizeSearchText(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ar")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function productName(product: Product, language: "ar" | "en") {
  return language === "en" ? product.name_en?.trim() || product.name : product.name;
}

export function productShortDescription(product: Product, language: "ar" | "en") {
  return language === "en"
    ? product.short_description_en?.trim() || product.short_description
    : product.short_description;
}

export function productDescription(product: Product, language: "ar" | "en") {
  return language === "en"
    ? product.description_en?.trim() || product.description
    : product.description;
}

export function productField(
  product: Product,
  field: "ingredients" | "usage" | "benefits" | "warnings",
  language: "ar" | "en",
) {
  if (language === "en") {
    return (product[`${field}_en` as keyof Product] as string | undefined) || product[field];
  }
  return product[field];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  products?: Product[];
}

export async function askNeomart(messages: ChatMessage[]): Promise<ChatResponse> {
  // Route through the application Edge Function using the configured provider setting.
  const { data, error } = await supabase.functions.invoke("neo-chat", { body: { messages } });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("empty_response");
  return data as ChatResponse;
}

export interface ProductsPage {
  products: Product[];
  nextOffset?: number;
}

const PRODUCT_SEARCH_FIELDS = [
  "name",
  "name_en",
  "description",
  "description_en",
  "short_description",
  "short_description_en",
  "category",
  "slug",
];

const PRODUCT_CARD_FIELDS = [
  "id",
  "name",
  "name_en",
  "short_description",
  "short_description_en",
  "description",
  "description_en",
  "price",
  "discounted_price",
  "is_discounted",
  "discount_percent",
  "images",
  "image_1",
  "image_2",
  "image_3",
  "image_4",
  "main_image_url",
  "additional_images",
  "additional_images_list",
  "category",
  "stock",
  "slug",
  "published",
].join(",");

export async function fetchProductsPage({
  offset,
  limit,
  category,
  search,
}: {
  offset: number;
  limit: number;
  category: string;
  search: string;
}): Promise<ProductsPage> {
  let query = getLegacyProductsClient()
    .from("products")
    .select(PRODUCT_CARD_FIELDS, { count: "exact" })
    .eq("published", true)
    .neq("category", "uncategorized")
    .order("id", { ascending: true });

  if (category !== "all") query = query.eq("category", category);
  const terms = search
    .split(/\s+/)
    .map((term) => term.replace(/[,%_*().]/g, "").trim())
    .filter(Boolean);
  for (const term of terms) {
    const pattern = `%${term}%`;
    query = query.or(PRODUCT_SEARCH_FIELDS.map((field) => `${field}.ilike.${pattern}`).join(","));
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  const products = (data ?? []) as unknown as Product[];
  const nextOffset = offset + (data?.length ?? 0);
  return { products, nextOffset: nextOffset < (count ?? 0) ? nextOffset : undefined };
}

export async function fetchProductCategories(): Promise<string[]> {
  const { data, error } = await getLegacyProductsClient()
    .from("products")
    .select("category")
    .eq("published", true)
    .neq("category", "uncategorized");
  if (error) throw error;
  return Array.from(
    new Set(
      (data ?? [])
        .map((product) => product.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort();
}

const POPULAR_PRODUCT_FIELDS = [
  "id",
  "name",
  "name_en",
  "price",
  "discounted_price",
  "is_discounted",
  "discount_percent",
  "images",
  "image_1",
  "image_2",
  "image_3",
  "image_4",
  "main_image_url",
  "additional_images",
  "additional_images_list",
  "category",
  "stock",
  "slug",
  "is_popular",
  "published",
].join(",");

export async function fetchPopularProductsPage({
  beforeId,
  limit = 4,
}: {
  beforeId?: number;
  limit?: number;
} = {}): Promise<{ products: Product[]; nextCursor?: number }> {
  let query = getLegacyProductsClient()
    .from("products")
    .select(POPULAR_PRODUCT_FIELDS)
    .eq("is_popular", true)
    .eq("published", true)
    .order("id", { ascending: false })
    .limit(limit);

  if (beforeId !== undefined) query = query.lt("id", beforeId);
  const { data, error } = await query;
  if (error) throw error;
  const products = (data ?? []) as unknown as Product[];
  return {
    products,
    nextCursor: products.length === limit ? products[products.length - 1]?.id : undefined,
  };
}

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await getLegacyProductsClient()
    .from("products")
    .select("*")
    .order("id", { ascending: true })
    .limit(500);
  if (error) return [];
  return ((data ?? []) as Product[]).filter(isDisplayableProduct);
}

const PRODUCT_VARIANT_FIELDS = [
  "id",
  "name",
  "name_en",
  "main_image_url",
  "images",
  "image_1",
  "image_2",
  "image_3",
  "image_4",
  "category",
  "stock",
  "published",
  "slug",
].join(",");

export async function fetchProductVariantCandidates(familyName: string): Promise<Product[]> {
  const familyTokens = familyName.split(" ").filter(Boolean);
  let query = getLegacyProductsClient()
    .from("products")
    .select(PRODUCT_VARIANT_FIELDS)
    .order("id", { ascending: true })
    .limit(100);

  for (const token of familyTokens) {
    query = query.ilike("name", `%${token}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function updateOrderStatus(params: {
  email: string;
  password: string;
  order_code: string;
  status: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("update-order-status", { body: params });
  if (error) return { error: error.message };
  return data as { ok?: boolean; error?: string };
}

export async function fetchAllOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map(normalizeOrderRow);
}

export interface DailyOrderStats {
  date: string;
  orders_count: number;
  customers_count: number;
}

type OrderStatsRow = Pick<OrderRow, "created_at" | "customer_phone">;

export async function fetchDailyOrderStats(): Promise<DailyOrderStats[]> {
  const { data, error } = await supabase.from("orders").select("created_at,customer_phone");
  if (error) throw error;

  const byDate = new Map<string, { orders_count: number; phones: Set<string> }>();
  for (const order of (data ?? []) as OrderStatsRow[]) {
    const date = order.created_at.slice(0, 10);
    const current = byDate.get(date) ?? { orders_count: 0, phones: new Set<string>() };
    current.orders_count += 1;
    current.phones.add(order.customer_phone);
    byDate.set(date, current);
  }

  return Array.from(byDate, ([date, stats]) => ({
    date,
    orders_count: stats.orders_count,
    customers_count: stats.phones.size,
  })).sort((a, b) => b.date.localeCompare(a.date));
}

export interface DailyChatStats {
  date: string;
  unique_users: number;
  conversations_count: number;
  user_messages: number;
  assistant_messages: number;
  total_messages: number;
}

export interface AiChatSummary {
  unique_users: number;
  conversations_count: number;
  user_messages: number;
  assistant_messages: number;
  total_messages: number;
}

export interface AiChatDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface AiChatStatistics {
  summary: AiChatSummary;
  daily: DailyChatStats[];
}

type AiMessageStatsRow = {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: string;
  created_at: string;
};

function isMissingAiStatsRpc(error: { code?: string } | null) {
  return error?.code === "PGRST202" || error?.code === "42883";
}

function getBaghdadDate(value: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Baghdad",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date(value))
      .map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function fetchAiChatStatisticsFromMessages(
  range: AiChatDateRange,
): Promise<AiChatStatistics> {
  const pageSize = 1000;
  const messages: AiMessageStatsRow[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("messages")
      .select("id,conversation_id,user_id,role,created_at")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (range.startDate) query = query.gte("created_at", range.startDate);
    if (range.endDate) query = query.lt("created_at", range.endDate);

    const { data, error } = await query;
    if (error) throw error;
    messages.push(...((data ?? []) as AiMessageStatsRow[]));
    if ((data?.length ?? 0) < pageSize) break;
  }

  const byDate = new Map<
    string,
    {
      unique_users: Set<string>;
      conversations: Set<string>;
      user_messages: number;
      assistant_messages: number;
      total_messages: number;
    }
  >();
  const users = new Set<string>();
  const conversations = new Set<string>();
  let userMessages = 0;
  let assistantMessages = 0;

  for (const message of messages) {
    const date = getBaghdadDate(message.created_at);
    const current = byDate.get(date) ?? {
      unique_users: new Set<string>(),
      conversations: new Set<string>(),
      user_messages: 0,
      assistant_messages: 0,
      total_messages: 0,
    };
    current.conversations.add(message.conversation_id);
    current.total_messages += 1;
    conversations.add(message.conversation_id);
    if (message.user_id) {
      current.unique_users.add(message.user_id);
      users.add(message.user_id);
    }
    if (message.role === "user") {
      current.user_messages += 1;
      userMessages += 1;
    }
    if (message.role === "assistant") {
      current.assistant_messages += 1;
      assistantMessages += 1;
    }
    byDate.set(date, current);
  }

  return {
    summary: {
      unique_users: users.size,
      conversations_count: conversations.size,
      user_messages: userMessages,
      assistant_messages: assistantMessages,
      total_messages: messages.length,
    },
    daily: Array.from(byDate, ([date, stats]) => ({
      date,
      unique_users: stats.unique_users.size,
      conversations_count: stats.conversations.size,
      user_messages: stats.user_messages,
      assistant_messages: stats.assistant_messages,
      total_messages: stats.total_messages,
    })).sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export async function fetchAiChatStatistics(range: AiChatDateRange): Promise<AiChatStatistics> {
  const params = {
    p_start_date: range.startDate,
    p_end_date: range.endDate,
  };
  const [summaryResult, dailyResult] = await Promise.all([
    supabase.rpc("get_ai_chat_statistics", params),
    supabase.rpc("get_ai_chat_daily_statistics", params),
  ]);
  if (summaryResult.error || dailyResult.error) {
    if (isMissingAiStatsRpc(summaryResult.error) || isMissingAiStatsRpc(dailyResult.error)) {
      return fetchAiChatStatisticsFromMessages(range);
    }
    throw summaryResult.error ?? dailyResult.error;
  }

  const summary = summaryResult.data?.[0];
  if (!summary) throw new Error("empty_ai_chat_statistics");

  return {
    summary: {
      unique_users: Number(summary.unique_users),
      conversations_count: Number(summary.conversations_count),
      user_messages: Number(summary.user_messages),
      assistant_messages: Number(summary.assistant_messages),
      total_messages: Number(summary.total_messages),
    },
    daily: (dailyResult.data ?? []).map((stats) => ({
      date: stats.date,
      unique_users: Number(stats.unique_users),
      conversations_count: Number(stats.conversations_count),
      user_messages: Number(stats.user_messages),
      assistant_messages: Number(stats.assistant_messages),
      total_messages: Number(stats.total_messages),
    })),
  };
}

export interface AppEventSummary {
  total_events: number;
  unique_users: number;
  unique_installations: number;
  unique_sessions: number;
}

export interface DailyAppEventStats {
  date: string;
  total_events: number;
  unique_users: number;
  unique_installations: number;
  unique_sessions: number;
}

export interface AppEventTypeStats {
  event_type: string;
  total_events: number;
  unique_users: number;
  unique_installations: number;
  unique_sessions: number;
}

export interface AppEventStatistics {
  summary: AppEventSummary;
  daily: DailyAppEventStats[];
  eventTypes: AppEventTypeStats[];
}

type AppEventStatsRow = {
  id: string;
  user_id: string | null;
  installation_id: string;
  event_type: string;
  session_id: string | null;
  created_at: string;
};

const EMPTY_APP_EVENT_STATISTICS: AppEventStatistics = {
  summary: {
    total_events: 0,
    unique_users: 0,
    unique_installations: 0,
    unique_sessions: 0,
  },
  daily: [],
  eventTypes: [],
};

async function fetchAppEventStatisticsFromTable(
  range: AiChatDateRange,
): Promise<AppEventStatistics> {
  const pageSize = 1000;
  const events: AppEventStatsRow[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("app_events")
      .select("id,user_id,installation_id,event_type,session_id,created_at")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (range.startDate) query = query.gte("created_at", range.startDate);
    if (range.endDate) query = query.lt("created_at", range.endDate);

    const { data, error } = await query;
    if (error) throw error;
    events.push(...((data ?? []) as AppEventStatsRow[]));
    if ((data?.length ?? 0) < pageSize) break;
  }

  const users = new Set<string>();
  const installations = new Set<string>();
  const sessions = new Set<string>();
  const daily = new Map<
    string,
    {
      total_events: number;
      users: Set<string>;
      installations: Set<string>;
      sessions: Set<string>;
    }
  >();
  const eventTypes = new Map<
    string,
    { total_events: number; users: Set<string>; installations: Set<string>; sessions: Set<string> }
  >();

  for (const event of events) {
    const date = getBaghdadDate(event.created_at);
    const day = daily.get(date) ?? {
      total_events: 0,
      users: new Set<string>(),
      installations: new Set<string>(),
      sessions: new Set<string>(),
    };
    const type = eventTypes.get(event.event_type) ?? {
      total_events: 0,
      users: new Set<string>(),
      installations: new Set<string>(),
      sessions: new Set<string>(),
    };

    day.total_events += 1;
    type.total_events += 1;
    installations.add(event.installation_id);
    day.installations.add(event.installation_id);
    type.installations.add(event.installation_id);
    if (event.user_id) {
      users.add(event.user_id);
      day.users.add(event.user_id);
      type.users.add(event.user_id);
    }
    if (event.session_id) {
      sessions.add(event.session_id);
      day.sessions.add(event.session_id);
      type.sessions.add(event.session_id);
    }
    daily.set(date, day);
    eventTypes.set(event.event_type, type);
  }

  return {
    summary: {
      total_events: events.length,
      unique_users: users.size,
      unique_installations: installations.size,
      unique_sessions: sessions.size,
    },
    daily: Array.from(daily, ([date, stats]) => ({
      date,
      total_events: stats.total_events,
      unique_users: stats.users.size,
      unique_installations: stats.installations.size,
      unique_sessions: stats.sessions.size,
    })).sort((a, b) => b.date.localeCompare(a.date)),
    eventTypes: Array.from(eventTypes, ([event_type, stats]) => ({
      event_type,
      total_events: stats.total_events,
      unique_users: stats.users.size,
      unique_installations: stats.installations.size,
      unique_sessions: stats.sessions.size,
    })).sort((a, b) => b.total_events - a.total_events || a.event_type.localeCompare(b.event_type)),
  };
}

export async function fetchAppEventStatistics(range: AiChatDateRange): Promise<AppEventStatistics> {
  const params = {
    p_start_date: range.startDate,
    p_end_date: range.endDate,
  };
  const [summaryResult, dailyResult, eventTypeResult] = await Promise.all([
    supabase.rpc("get_app_event_statistics", params),
    supabase.rpc("get_app_event_daily_statistics", params),
    supabase.rpc("get_app_event_type_statistics", params),
  ]);
  if (summaryResult.error || dailyResult.error || eventTypeResult.error) {
    if (
      isMissingAiStatsRpc(summaryResult.error) ||
      isMissingAiStatsRpc(dailyResult.error) ||
      isMissingAiStatsRpc(eventTypeResult.error)
    ) {
      return fetchAppEventStatisticsFromTable(range);
    }
    throw summaryResult.error ?? dailyResult.error ?? eventTypeResult.error;
  }

  const summary = summaryResult.data?.[0];
  if (!summary) return EMPTY_APP_EVENT_STATISTICS;
  return {
    summary: {
      total_events: Number(summary.total_events),
      unique_users: Number(summary.unique_users),
      unique_installations: Number(summary.unique_installations),
      unique_sessions: Number(summary.unique_sessions),
    },
    daily: (dailyResult.data ?? []).map((stats) => ({
      date: stats.date,
      total_events: Number(stats.total_events),
      unique_users: Number(stats.unique_users),
      unique_installations: Number(stats.unique_installations),
      unique_sessions: Number(stats.unique_sessions),
    })),
    eventTypes: (eventTypeResult.data ?? []).map((stats) => ({
      event_type: stats.event_type,
      total_events: Number(stats.total_events),
      unique_users: Number(stats.unique_users),
      unique_installations: Number(stats.unique_installations),
      unique_sessions: Number(stats.unique_sessions),
    })),
  };
}

export async function getAiProvider(): Promise<"lovable" | "openrouter"> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "ai_provider")
    .maybeSingle();
  return data?.value === "openrouter" ? "openrouter" : "lovable";
}

export async function setAiProvider(params: {
  email: string;
  password: string;
  provider: "lovable" | "openrouter";
}) {
  const { data, error } = await supabase.functions.invoke("set-ai-provider", { body: params });
  if (error) return { error: error.message };
  return data as { ok?: boolean; provider?: string; error?: string };
}

export async function fetchProduct(id: number | string): Promise<Product | null> {
  const { data, error } = await getLegacyProductsClient()
    .from("products")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();
  if (error) throw error;
  const product = data as Product | null;
  return product && isDisplayableProduct(product) ? product : null;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  usage_limit?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
  description?: string | null;
  maximum_quantity?: number | null;
}

export interface CouponValidation {
  coupon: Coupon;
  eligibleProductIds: number[];
  usageCount: number;
}

export async function fetchCouponProductBadges(): Promise<Record<number, string>> {
  const now = new Date().toISOString();
  const { data: coupons, error: couponsError } = await getLegacyProductsClient()
    .from("coupons")
    .select("id,code,valid_from,valid_until,is_active")
    .eq("is_active", true)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`);
  if (couponsError) throw couponsError;
  if (!coupons?.length) return {};
  const couponIds = coupons.map((coupon) => coupon.id);
  const { data: links, error: linksError } = await getLegacyProductsClient()
    .from("coupons_products")
    .select("coupon_id,product_id")
    .in("coupon_id", couponIds);
  if (linksError) throw linksError;
  const codes = new Map(coupons.map((coupon) => [coupon.id, coupon.code]));
  return (links ?? []).reduce<Record<number, string>>((badges, link) => {
    const code = codes.get(link.coupon_id);
    if (code && badges[Number(link.product_id)] === undefined)
      badges[Number(link.product_id)] = code;
    return badges;
  }, {});
}

export async function validateCoupon(code: string): Promise<CouponValidation> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) throw new Error("coupon_required");
  const { data: couponData, error: couponError } = await getLegacyProductsClient()
    .from("coupons")
    .select(
      "id,code,discount_type,discount_value,usage_limit,valid_from,valid_until,is_active,description,maximum_quantity",
    )
    .ilike("code", normalizedCode)
    .maybeSingle();
  if (couponError) throw couponError;
  const coupon = couponData as Coupon | null;
  const now = Date.now();
  if (
    !coupon ||
    !coupon.is_active ||
    (coupon.valid_from && Date.parse(coupon.valid_from) > now) ||
    (coupon.valid_until && Date.parse(coupon.valid_until) < now)
  ) {
    throw new Error("coupon_invalid");
  }

  const [{ data: links, error: linksError }, { count: usageCount, error: usageError }] =
    await Promise.all([
      getLegacyProductsClient()
        .from("coupons_products")
        .select("product_id")
        .eq("coupon_id", coupon.id),
      getLegacyProductsClient()
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id),
    ]);
  if (linksError) throw linksError;
  if (usageError) throw usageError;
  const eligibleProductIds = (links ?? []).map((link) => Number(link.product_id));
  if (coupon.usage_limit != null && (usageCount ?? 0) >= coupon.usage_limit) {
    throw new Error("coupon_usage_limit");
  }
  return { coupon, eligibleProductIds, usageCount: usageCount ?? 0 };
}

export function calculateCouponDiscount(validation: CouponValidation, items: OrderItem[]): number {
  const eligibleIds = new Set(validation.eligibleProductIds);
  const eligibleItems = items.filter((item) => eligibleIds.has(item.product_id));
  if (eligibleItems.length === 0 && validation.eligibleProductIds.length > 0) return 0;
  const applicableItems = validation.eligibleProductIds.length === 0 ? items : eligibleItems;
  const maximumQuantity = validation.coupon.maximum_quantity;
  let remainingQuantity = maximumQuantity == null ? Infinity : Math.max(0, maximumQuantity);
  const eligibleSubtotal = applicableItems.reduce((sum, item) => {
    const quantity = Math.min(item.quantity, remainingQuantity);
    remainingQuantity -= quantity;
    return sum + item.price * quantity;
  }, 0);
  if (validation.coupon.discount_type === "percentage") {
    return Math.min(eligibleSubtotal, (eligibleSubtotal * validation.coupon.discount_value) / 100);
  }
  return Math.min(eligibleSubtotal, Math.max(0, validation.coupon.discount_value));
}

export interface OrderItem {
  product_id: number;
  name: string;
  name_en?: string;
  price: number;
  quantity: number;
  image?: string;
  short_description?: string;
  short_description_en?: string;
  description?: string;
  description_en?: string;
}

export interface OrderPayload {
  order_code: string;
  customer_name: string;
  customer_phone: string;
  governorate: string;
  area: string;
  landmark?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  coupon_code?: string;
}

export async function createOrder(
  payload: OrderPayload,
): Promise<{ ok: boolean; order_code: string; via: "edge" }> {
  const { data, error } = await supabase.functions.invoke("create-order", { body: payload });
  if (error || !data?.ok) throw new Error(error?.message || data?.error || "تعذّر إرسال الطلب");
  return { ok: true, order_code: payload.order_code, via: "edge" };
}

export interface OrderRow {
  order_code: string;
  customer_name: string;
  customer_phone: string;
  governorate?: string;
  area?: string;
  landmark?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  order_status: string;
  created_at: string;
  delivered_at?: string | null;
}

function normalizeOrderItems(value: unknown): OrderItem[] {
  if (Array.isArray(value)) return value as OrderItem[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as OrderItem[]) : [];
  } catch {
    return [];
  }
}

export function normalizeOrderRow(row: unknown): OrderRow {
  const order = row as OrderRow & { items?: unknown };
  return { ...order, items: normalizeOrderItems(order.items) };
}

export async function listOrdersByPhone(phone: string, orderCode: string): Promise<OrderRow[]> {
  const normalizedPhone = phone.trim();
  const normalizedOrderCode = orderCode.trim().toUpperCase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", normalizedOrderCode)
    .eq("customer_phone", normalizedPhone);

  if (error) {
    console.error("[orders] lookup failed", {
      orderCode: normalizedOrderCode,
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  console.debug("[orders] lookup result", {
    orderCode: normalizedOrderCode,
    count: data?.length ?? 0,
  });
  return (data ?? []).map(normalizeOrderRow);
}

export async function fetchOrder(orderCode: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", orderCode)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeOrderRow(data) : null;
}

export function formatIQD(n: number, language: "ar" | "en" = "ar"): string {
  return language === "en"
    ? `${new Intl.NumberFormat("en-IQ").format(n)} IQD`
    : `${new Intl.NumberFormat("ar-IQ").format(n)} د.ع`;
}

// 5-character alphanumeric code (uppercase, unambiguous)
export function generateOrderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
