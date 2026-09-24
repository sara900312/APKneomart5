import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CalendarDays,
  CircleUserRound,
  List,
  Lock,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Monitor,
  Timer,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import {
  fetchAiChatStatistics,
  fetchAllOrders,
  fetchAppEventStatistics,
  fetchDailyOrderStats,
  updateOrderStatus,
  formatIQD,
  getAiProvider,
  setAiProvider,
  type AiChatDateRange,
  type AiChatStatistics,
  type AppEventStatistics,
  type DailyOrderStats,
  type OrderRow,
} from "@/lib/neomart";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/Lewis-Ban-9003-Lewis-Ban-9003-Lewis-Ban-9003-Lewis-Ban-9003",
)({
  head: () => ({ meta: [{ title: "المخزن" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: WarehousePage,
});

const STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "shipping",
  "delivered",
  "cancelled",
] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكّد",
  preparing: "قيد التحضير",
  ready: "جاهز",
  shipping: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

type ChatDateFilter =
  "today" | "yesterday" | "7days" | "30days" | "thisMonth" | "lastMonth" | "all";

const CHAT_DATE_FILTERS: Array<{ value: ChatDateFilter; label: string }> = [
  { value: "today", label: "اليوم" },
  { value: "yesterday", label: "أمس" },
  { value: "7days", label: "آخر 7 أيام" },
  { value: "30days", label: "آخر 30 يوم" },
  { value: "thisMonth", label: "هذا الشهر" },
  { value: "lastMonth", label: "الشهر السابق" },
  { value: "all", label: "كل الوقت" },
];

const BAGHDAD_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Baghdad",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function baghdadDate(date = new Date()) {
  const parts = Object.fromEntries(
    BAGHDAD_DATE_FORMATTER.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function baghdadBoundary(date: string) {
  return new Date(`${date}T00:00:00+03:00`).toISOString();
}

function getChatDateRange(filter: ChatDateFilter): AiChatDateRange {
  if (filter === "all") return { startDate: null, endDate: null };
  const today = baghdadDate();
  const tomorrow = shiftDate(today, 1);
  if (filter === "today")
    return { startDate: baghdadBoundary(today), endDate: baghdadBoundary(tomorrow) };
  if (filter === "yesterday") {
    return {
      startDate: baghdadBoundary(shiftDate(today, -1)),
      endDate: baghdadBoundary(today),
    };
  }
  if (filter === "7days") {
    return { startDate: baghdadBoundary(shiftDate(today, -6)), endDate: baghdadBoundary(tomorrow) };
  }
  if (filter === "30days") {
    return {
      startDate: baghdadBoundary(shiftDate(today, -29)),
      endDate: baghdadBoundary(tomorrow),
    };
  }

  const currentMonthStart = `${today.slice(0, 7)}-01`;
  if (filter === "thisMonth") {
    return { startDate: baghdadBoundary(currentMonthStart), endDate: baghdadBoundary(tomorrow) };
  }

  const previousMonthStart = shiftDate(currentMonthStart, -1).slice(0, 7) + "-01";
  return {
    startDate: baghdadBoundary(previousMonthStart),
    endDate: baghdadBoundary(currentMonthStart),
  };
}

const EMPTY_AI_CHAT_STATISTICS: AiChatStatistics = {
  summary: {
    unique_users: 0,
    conversations_count: 0,
    user_messages: 0,
    assistant_messages: 0,
    total_messages: 0,
  },
  daily: [],
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

interface Creds {
  email: string;
  password: string;
}

function WarehousePage() {
  const [creds, setCreds] = useState<Creds | null>(null);
  if (!creds) return <LoginForm onAuth={setCreds} />;
  return <Dashboard creds={creds} onLogout={() => setCreds(null)} />;
}

function LoginForm({ onAuth }: { onAuth: (c: Creds) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    // Validate by attempting a no-op set (calls admin-auth function)
    const res = await setAiProvider({ email, password, provider: await getAiProvider() });
    setBusy(false);
    if (res.error) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    onAuth({ email, password });
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm glass border border-border/50 rounded-3xl p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold">دخول المخزن</h1>
          <p className="text-xs text-muted-foreground">هذه الصفحة خاصة بالمشرف فقط</p>
        </div>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          required
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          required
        />
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        <button
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {busy ? "جاري التحقق..." : "دخول"}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          العودة للصفحة الرئيسية
        </button>
      </form>
    </div>
  );
}

function Dashboard({ creds, onLogout }: { creds: Creds; onLogout: () => void }) {
  const qc = useQueryClient();
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery<OrderRow[]>({
    queryKey: ["wh-orders"],
    queryFn: fetchAllOrders,
    refetchInterval: 15_000,
  });

  const { data: provider = "lovable" } = useQuery({
    queryKey: ["ai-provider"],
    queryFn: getAiProvider,
  });
  const {
    data: dailyStats = [],
    isLoading: dailyStatsLoading,
    error: dailyStatsError,
    refetch: refetchDailyStats,
  } = useQuery<DailyOrderStats[]>({
    queryKey: ["wh-daily-order-stats"],
    queryFn: fetchDailyOrderStats,
    refetchInterval: 15_000,
  });
  const [chatDateFilter, setChatDateFilter] = useState<ChatDateFilter>("all");
  const chatDateRange = useMemo(() => getChatDateRange(chatDateFilter), [chatDateFilter]);
  const {
    data: chatStatistics = EMPTY_AI_CHAT_STATISTICS,
    isLoading: chatStatsLoading,
    error: chatStatsError,
    refetch: refetchChatStats,
  } = useQuery<AiChatStatistics>({
    queryKey: ["wh-ai-chat-statistics", chatDateRange],
    queryFn: () => fetchAiChatStatistics(chatDateRange),
    refetchInterval: 15_000,
  });
  const [appEventsDateFilter, setAppEventsDateFilter] = useState<ChatDateFilter>("all");
  const appEventsDateRange = useMemo(
    () => getChatDateRange(appEventsDateFilter),
    [appEventsDateFilter],
  );
  const {
    data: appEventStatistics = EMPTY_APP_EVENT_STATISTICS,
    isLoading: appEventsLoading,
    error: appEventsError,
    refetch: refetchAppEvents,
  } = useQuery<AppEventStatistics>({
    queryKey: ["wh-app-event-statistics", appEventsDateRange],
    queryFn: () => fetchAppEventStatistics(appEventsDateRange),
    refetchInterval: 15_000,
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Realtime for admin
  useEffect(() => {
    const channel = supabase
      .channel("wh-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["wh-orders"] });
        qc.invalidateQueries({ queryKey: ["wh-daily-order-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["wh-ai-chat-statistics"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        qc.invalidateQueries({ queryKey: ["wh-ai-chat-statistics"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "app_events" }, () => {
        qc.invalidateQueries({ queryKey: ["wh-app-event-statistics"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
      if (!needle) return true;
      return (
        o.order_code.toLowerCase().includes(needle) ||
        o.customer_name.toLowerCase().includes(needle) ||
        o.customer_phone.toLowerCase().includes(needle)
      );
    });
  }, [orders, statusFilter, search]);

  async function changeStatus(order_code: string, status: string) {
    const res = await updateOrderStatus({ ...creds, order_code, status });
    if (res.error) {
      alert("فشل تحديث الحالة: " + res.error);
      return;
    }
    qc.setQueryData<OrderRow[]>(
      ["wh-orders"],
      (current) =>
        current?.map((order) =>
          order.order_code === order_code ? { ...order, order_status: status } : order,
        ) ?? current,
    );
  }

  async function toggleProvider() {
    const next: "lovable" | "openrouter" = provider === "lovable" ? "openrouter" : "lovable";
    const res = await setAiProvider({ ...creds, provider: next });
    if (res.error) alert("فشل التبديل: " + res.error);
    else qc.invalidateQueries({ queryKey: ["ai-provider"] });
  }

  return (
    <div dir="rtl" className="min-h-screen max-w-6xl mx-auto flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onLogout}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          خروج
        </button>
        <h1 className="text-sm font-bold">لوحة المخزن</h1>
        <button
          onClick={() => {
            void refetch();
            void refetchDailyStats();
            void refetchChatStats();
            void refetchAppEvents();
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="تحديث"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* AI provider switch */}
        <div className="glass border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold">مزوّد الذكاء الاصطناعي</h2>
              <p className="text-xs text-muted-foreground">
                الحالي: {provider === "openrouter" ? "OpenRouter" : "Lovable AI"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleProvider}
            className={`relative w-14 h-8 rounded-full transition ${provider === "openrouter" ? "bg-primary" : "bg-muted"}`}
            aria-label="تبديل مزوّد الذكاء"
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
                provider === "openrouter" ? "start-1" : "end-1"
              }`}
            />
          </button>
        </div>

        <section className="glass border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold">إحصاءات الطلبات اليومية</h2>
              <p className="text-xs text-muted-foreground">
                عدد الطلبات والعملاء الفريدين حسب تاريخ الإنشاء
              </p>
            </div>
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          {dailyStatsLoading && (
            <p className="text-xs text-muted-foreground">جاري تحميل الإحصاءات...</p>
          )}
          {dailyStatsError && (
            <p className="text-xs text-destructive">تعذّر تحميل الإحصاءات اليومية.</p>
          )}
          {!dailyStatsLoading && !dailyStatsError && dailyStats.length === 0 && (
            <p className="text-xs text-muted-foreground">لا توجد بيانات بعد.</p>
          )}
          {!dailyStatsLoading && !dailyStatsError && dailyStats.length > 0 && (
            <div className="flex flex-col gap-2">
              {dailyStats.map((stats) => (
                <div
                  key={stats.date}
                  className="flex items-center justify-between gap-3 rounded-xl bg-card/70 border border-border/40 px-3 py-2"
                >
                  <span className="text-xs font-medium">
                    {new Date(`${stats.date}T00:00:00Z`).toLocaleDateString("ar-IQ", {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    })}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{stats.orders_count} طلب</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {stats.customers_count} عميل
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold">إحصاءات محادثة الذكاء الاصطناعي</h2>
              <p className="text-xs text-muted-foreground">
                بيانات NEO AI الحقيقية حسب توقيت بغداد
              </p>
            </div>
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-xs text-muted-foreground">الفترة الزمنية</span>
            <select
              value={chatDateFilter}
              onChange={(event) => setChatDateFilter(event.target.value as ChatDateFilter)}
              className="bg-card border border-border/50 rounded-xl px-3 py-2 text-xs outline-none"
              aria-label="فلترة إحصاءات محادثة الذكاء الاصطناعي"
            >
              {CHAT_DATE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {chatStatsLoading && (
            <p className="text-xs text-muted-foreground">جاري تحميل إحصاءات المحادثات...</p>
          )}
          {chatStatsError && (
            <p className="text-xs text-destructive">تعذّر تحميل إحصاءات المحادثات.</p>
          )}
          {!chatStatsLoading && !chatStatsError && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <CircleUserRound className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{chatStatistics.summary.unique_users}</p>
                  <p className="text-[11px] text-muted-foreground">المستخدمون</p>
                </div>
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <MessagesSquare className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{chatStatistics.summary.conversations_count}</p>
                  <p className="text-[11px] text-muted-foreground">المحادثات</p>
                </div>
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <Users className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{chatStatistics.summary.user_messages}</p>
                  <p className="text-[11px] text-muted-foreground">رسائل المستخدمين</p>
                </div>
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <Bot className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{chatStatistics.summary.assistant_messages}</p>
                  <p className="text-[11px] text-muted-foreground">رسائل AI</p>
                </div>
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <MessageCircle className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{chatStatistics.summary.total_messages}</p>
                  <p className="text-[11px] text-muted-foreground">إجمالي الرسائل</p>
                </div>
              </div>
              {chatStatistics.daily.length === 0 ? (
                <p className="text-xs text-muted-foreground">لا توجد محادثات في هذه الفترة.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[720px] flex flex-col gap-2">
                    <div className="grid grid-cols-6 gap-2 px-3 text-[11px] font-bold text-muted-foreground">
                      <span>التاريخ</span>
                      <span>المستخدمون</span>
                      <span>المحادثات</span>
                      <span>رسائل المستخدم</span>
                      <span>رسائل AI</span>
                      <span>الإجمالي</span>
                    </div>
                    {chatStatistics.daily.map((stats) => (
                      <div
                        key={stats.date}
                        className="grid grid-cols-6 gap-2 items-center rounded-xl bg-card/70 border border-border/40 px-3 py-2 text-xs"
                      >
                        <span className="font-medium">
                          {new Date(`${stats.date}T00:00:00Z`).toLocaleDateString("ar-IQ", {
                            dateStyle: "medium",
                            timeZone: "UTC",
                          })}
                        </span>
                        <span>{stats.unique_users}</span>
                        <span>{stats.conversations_count}</span>
                        <span>{stats.user_messages}</span>
                        <span>{stats.assistant_messages}</span>
                        <span>{stats.total_messages}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="glass border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold">إحصائيات استخدام التطبيق</h2>
              <p className="text-xs text-muted-foreground">
                نشاط المستخدمين والأجهزة والجلسات من أحداث التطبيق
              </p>
            </div>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-xs text-muted-foreground">الفترة الزمنية</span>
            <select
              value={appEventsDateFilter}
              onChange={(event) => setAppEventsDateFilter(event.target.value as ChatDateFilter)}
              className="bg-card border border-border/50 rounded-xl px-3 py-2 text-xs outline-none"
              aria-label="فلترة إحصائيات استخدام التطبيق"
            >
              {CHAT_DATE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {appEventsLoading && (
            <p className="text-xs text-muted-foreground">جاري تحميل إحصائيات الاستخدام...</p>
          )}
          {appEventsError && (
            <p className="text-xs text-destructive">تعذّر تحميل إحصائيات استخدام التطبيق.</p>
          )}
          {!appEventsLoading && !appEventsError && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <Activity className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{appEventStatistics.summary.total_events}</p>
                  <p className="text-[11px] text-muted-foreground">إجمالي الأحداث</p>
                </div>
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <Users className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{appEventStatistics.summary.unique_users}</p>
                  <p className="text-[11px] text-muted-foreground">المستخدمون الفريدون</p>
                </div>
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <Monitor className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">
                    {appEventStatistics.summary.unique_installations}
                  </p>
                  <p className="text-[11px] text-muted-foreground">الأجهزة والتثبيتات</p>
                </div>
                <div className="rounded-xl bg-card/70 border border-border/40 p-3">
                  <Timer className="w-4 h-4 text-primary mb-2" />
                  <p className="text-lg font-bold">{appEventStatistics.summary.unique_sessions}</p>
                  <p className="text-[11px] text-muted-foreground">الجلسات الفريدة</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold">النشاط اليومي</h3>
                  </div>
                  {appEventStatistics.daily.length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا توجد أحداث في هذه الفترة.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[520px] flex flex-col gap-2">
                        <div className="grid grid-cols-5 gap-2 px-3 text-[11px] font-bold text-muted-foreground">
                          <span>التاريخ</span>
                          <span>الأحداث</span>
                          <span>المستخدمون</span>
                          <span>الأجهزة</span>
                          <span>الجلسات</span>
                        </div>
                        {appEventStatistics.daily.map((stats) => (
                          <div
                            key={stats.date}
                            className="grid grid-cols-5 gap-2 items-center rounded-xl bg-card/70 border border-border/40 px-3 py-2 text-xs"
                          >
                            <span className="font-medium">
                              {new Date(`${stats.date}T00:00:00Z`).toLocaleDateString("ar-IQ", {
                                dateStyle: "medium",
                                timeZone: "UTC",
                              })}
                            </span>
                            <span>{stats.total_events}</span>
                            <span>{stats.unique_users}</span>
                            <span>{stats.unique_installations}</span>
                            <span>{stats.unique_sessions}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <List className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold">الأحداث حسب النوع</h3>
                  </div>
                  {appEventStatistics.eventTypes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا توجد أنواع أحداث.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {appEventStatistics.eventTypes.map((stats) => (
                        <div
                          key={stats.event_type}
                          className="flex items-center justify-between gap-3 rounded-xl bg-card/70 border border-border/40 px-3 py-2 text-xs"
                        >
                          <span className="font-medium truncate">{stats.event_type}</span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            {stats.total_events} حدث
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برمز الطلب، الاسم، أو الهاتف"
            className="flex-1 bg-card border border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/60"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card border border-border/50 rounded-xl px-4 py-2 text-sm outline-none"
          >
            <option value="all">كل الحالات</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">جاري التحميل...</p>
        )}
        {!isLoading && error && (
          <div className="text-center text-sm text-destructive space-y-2 py-4">
            <p>تعذّر تحميل الطلبات.</p>
            <button type="button" onClick={() => void refetch()} className="font-bold text-primary">
              إعادة المحاولة
            </button>
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد طلبات</p>
        )}

        <div className="flex flex-col gap-3 pb-8">
          {filtered.map((o) => (
            <div
              key={o.order_code}
              className="glass border border-border/50 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{o.order_code}</span>
                  <span className="text-sm font-bold">{o.customer_name}</span>
                  <span className="text-xs text-muted-foreground">{o.customer_phone}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <OrderStatusBadge status={o.order_status} />
                  <span className="text-sm font-bold gradient-text">{formatIQD(o.total)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>{new Date(o.created_at).toLocaleString("ar-IQ")}</span>
                {(o.governorate || o.area) && (
                  <span>{[o.governorate, o.area, o.landmark].filter(Boolean).join(" - ")}</span>
                )}
                <span>{o.items?.length ?? 0} منتج</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">تغيير الحالة:</label>
                <select
                  value={o.order_status}
                  onChange={(e) => changeStatus(o.order_code, e.target.value)}
                  className="flex-1 bg-card border border-border/50 rounded-lg px-3 py-1.5 text-xs outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
