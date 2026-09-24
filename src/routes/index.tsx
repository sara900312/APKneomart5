import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Send, History, X, CircleHelp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  askNeomart,
  fetchPopularProductsPage,
  type ChatMessage,
  type Product,
} from "@/lib/neomart";
import { ProductCard } from "@/components/ProductCard";
import { Onboarding } from "@/components/Onboarding";
import { consume, formatRemaining, getStatus } from "@/lib/rateLimit";
import {
  createConversation,
  ensureAnonymousUser,
  listConversations,
  loadConversationMessages,
  hideConversation,
  makeConversationTitle,
  saveMessage,
  touchConversation,
  type Conversation,
  type StoredMessage,
} from "@/lib/chatHistory";
import { LanguageToggle, useLocale } from "@/lib/i18n";
import { isConnectionError, useConnectivity } from "@/lib/connectivity";
import logo from "@/assets/neomart-transparent.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEOMART — مستشارك الذكي للجمال" },
      {
        name: "description",
        content:
          "ابحثي عن أفضل منتجات الجمال بالذكاء الاصطناعي. اكتبي ما تحتاجين واحصلي على توصيات مخصصة.",
      },
      { property: "og:title", content: "NEOMART" },
      { property: "og:description", content: "مستشار الجمال الذكي — توصيات منتجات فورية" },
    ],
  }),
  component: Index,
});

interface Turn {
  user: string;
  userCreatedAt: string;
  reply?: string;
  replyCreatedAt?: string;
  products?: Product[];
  loading?: boolean;
  error?: string;
}

const RECENT_KEY = "neomart_recent";
const ONBOARD_KEY = "neo_onboarded_v1";
const MAX_MESSAGE_LENGTH = 200;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const cur = loadRecent().filter((x) => x !== q);
  cur.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, 6)));
}

function messagesToTurns(messages: StoredMessage[]): Turn[] {
  const turns: Turn[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ user: message.content, userCreatedAt: message.created_at });
    } else {
      const turn = turns[turns.length - 1];
      if (turn && !turn.reply) {
        turn.reply = message.content;
        turn.replyCreatedAt = message.created_at;
      }
    }
  }
  return turns;
}

function formatMessageDate(value: string, language: "ar" | "en") {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function isSameDay(first: string, second: string) {
  return new Date(first).toDateString() === new Date(second).toDateString();
}

function formatConversationMeta(value: string, language: "ar" | "en") {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dateLabel =
    date.toDateString() === today.toDateString()
      ? language === "ar"
        ? "اليوم"
        : "Today"
      : date.toDateString() === yesterday.toDateString()
        ? language === "ar"
          ? "أمس"
          : "Yesterday"
        : new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en-US", {
            dateStyle: "medium",
          }).format(date);
  const timeLabel = new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en-US", {
    timeStyle: "short",
  }).format(date);
  return `${dateLabel} — ${timeLabel}`;
}

function Index() {
  const { language, direction, text } = useLocale();
  const { isOnline } = useConnectivity();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popularSentinelRef = useRef<HTMLDivElement>(null);
  const {
    data: popularData,
    error: popularError,
    isLoading: popularLoading,
    isFetchingNextPage: popularFetchingNextPage,
    hasNextPage: popularHasNextPage,
    fetchNextPage: fetchNextPopularPage,
    refetch: refetchPopular,
  } = useInfiniteQuery({
    queryKey: ["home-popular-products"],
    queryFn: ({ pageParam }) => fetchPopularProductsPage({ beforeId: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
  const popularProducts = popularData?.pages.flatMap((page) => page.products) ?? [];

  useEffect(() => {
    const target = popularSentinelRef.current;
    const root = scrollRef.current;
    if (!target || !root || !popularHasNextPage || popularFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPopularPage();
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPopularPage, popularHasNextPage, popularFetchingNextPage]);

  useEffect(() => {
    setRecent(loadRecent());
    if (typeof window !== "undefined" && !localStorage.getItem(ONBOARD_KEY)) {
      setShowOnboarding(true);
    }
    setCooldownUntil(getStatus().cooldownUntil);

    let cancelled = false;
    if (!isOnline) {
      setHistoryLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setHistoryLoading(true);
    void ensureAnonymousUser()
      .then(async (user) => {
        if (cancelled) return;
        setUserId(user.id);
        const items = await listConversations();
        if (!cancelled) setConversations(items);
      })
      .catch(() => {
        if (!cancelled) setHistoryError(true);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (cooldownUntil <= current) setCooldownUntil(0);
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const blocked = cooldownUntil > now;
  const remainingCooldown = formatRemaining(cooldownUntil - now);

  async function submit(q: string) {
    const query = q.slice(0, MAX_MESSAGE_LENGTH).trim();
    if (!query) return;
    if (!isOnline) {
      const userCreatedAt = new Date().toISOString();
      setTurns((prev) => [
        ...prev,
        {
          user: query,
          userCreatedAt,
          error: "NEO AI يحتاج إلى اتصال بالإنترنت حتى يعمل. يرجى الاتصال بالإنترنت ثم المحاولة مرة أخرى.",
        },
      ]);
      return;
    }
    const status = consume();
    if (status.blocked) {
      setCooldownUntil(status.cooldownUntil);
      return;
    }
    setCooldownUntil(status.cooldownUntil);
    setInput("");
    saveRecent(query);
    setRecent(loadRecent());

    const history: ChatMessage[] = turns
      .filter((t) => t.reply)
      .slice(-8)
      .flatMap((t) => [
        { role: "user" as const, content: t.user },
        { role: "assistant" as const, content: t.reply! },
      ]);
    const userCreatedAt = new Date().toISOString();
    let activeConversationId = conversationId;

    setTurns((prev) => [...prev, { user: query, userCreatedAt, loading: true }]);

    try {
      if (userId) {
        if (!activeConversationId) {
          const conversation = await createConversation(userId, makeConversationTitle(query));
          activeConversationId = conversation.id;
          setConversationId(conversation.id);
          setConversations((prev) => [conversation, ...prev]);
        }
        await saveMessage({
          conversationId: activeConversationId,
          userId,
          role: "user",
          content: query,
        });
      }

      const res = await askNeomart([...history, { role: "user", content: query }]);
      const replyCreatedAt = new Date().toISOString();
      if (userId && activeConversationId) {
        await saveMessage({
          conversationId: activeConversationId,
          userId,
          role: "assistant",
          content: res.reply,
        });
        await touchConversation(activeConversationId);
        setConversations((prev) =>
          prev
            .map((conversation) =>
              conversation.id === activeConversationId
                ? { ...conversation, updated_at: replyCreatedAt }
                : conversation,
            )
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
        );
      }
      setTurns((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          user: query,
          userCreatedAt,
          reply: res.reply,
          replyCreatedAt,
          products: res.products || [],
        };
        return copy;
      });
    } catch (error) {
      const message = isConnectionError(error)
        ? "NEO AI يحتاج إلى اتصال بالإنترنت حتى يعمل. يرجى الاتصال بالإنترنت ثم المحاولة مرة أخرى."
        : "حدث خطأ، حاولي مرة أخرى.";
      setTurns((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { user: query, userCreatedAt, error: message };
        return copy;
      });
    }
  }

  async function openConversation(conversation: Conversation) {
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const messages = await loadConversationMessages(conversation.id);
      setConversationId(conversation.id);
      setTurns(messagesToTurns(messages));
      setInput("");
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function hidePreviousConversation(conversationIdToHide: string) {
    try {
      await hideConversation(conversationIdToHide);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationIdToHide
            ? { ...conversation, hidden_from_recent: true }
            : conversation,
        ),
      );
    } catch {
      setHistoryError(true);
    }
  }

  function finishOnboarding(dontShowAgain: boolean) {
    if (dontShowAgain) localStorage.setItem(ONBOARD_KEY, "1");
    setShowOnboarding(false);
  }

  const isEmpty = turns.length === 0;
  const chatBar = (
    <>
      {blocked && (
        <p
          className="mb-3 text-center text-xs font-bold text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {text(
            `يمكنكِ إرسال رسالة جديدة بعد ${remainingCooldown}`,
            `You can send another message in ${remainingCooldown}`,
          )}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className={`flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 p-1.5 transition focus-within:border-primary/60 focus-within:shadow-glow ${blocked ? "opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          value={input}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          disabled={blocked || !isOnline}
          placeholder={text("شنو تحتاج اليوم؟", "What do you need today?")}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          aria-label={text("ابحثي بمساعدة NEO AI", "Search with NEO AI")}
        />
        <button
          type="submit"
          disabled={!input.trim() || blocked || !isOnline}
          data-sound="off"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={text("إرسال إلى NEO AI", "Send to NEO AI")}
        >
          <Send className="h-4 w-4 rtl:-scale-x-100" />
        </button>
      </form>
      <div className="mt-1 px-3 text-end text-[11px] text-muted-foreground" aria-live="polite">
        {input.length} / {MAX_MESSAGE_LENGTH}
      </div>
    </>
  );
  const aiSection = (
    <section className="w-full rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-muted/60 p-4 text-right shadow-soft sm:p-5">
      <div className="text-center">
        <h2 className="text-base font-black tracking-wide text-primary sm:text-lg">NEO AI</h2>
        <p className="mt-1 text-xs font-bold text-foreground sm:text-sm">
          {text("مساعدك الذكي", "Your smart assistant")}
        </p>
      </div>
      {chatBar}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          ["بشرتي دهنية", "My skin is oily"],
          ["عندي حب شباب", "I have acne"],
          ["شعري جاف", "My hair is dry"],
        ].map(([arabic, english]) => (
          <button
            key={arabic}
            type="button"
            onClick={() => submit(language === "ar" ? arabic : english)}
            disabled={blocked || !isOnline}
            className="shrink-0 whitespace-nowrap rounded-full border border-border/50 bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {text(arabic, english)}
          </button>
        ))}
      </div>
    </section>
  );

  if (showOnboarding) return <Onboarding onDone={finishOnboarding} />;

  return (
    <div dir={direction} className="min-h-screen flex flex-col max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/support"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition"
            aria-label={text("الدعم والمساعدة", "Support and help")}
          >
            <CircleHelp className="w-5 h-5 text-foreground" />
          </Link>
          {turns.length > 0 && (
            <button
              onClick={() => {
                setTurns([]);
                setInput("");
                setConversationId(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-muted transition"
            >
              <X className="w-3.5 h-3.5" /> {text("جديد", "New")}
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-start pt-4 text-center gap-7 animate-in fade-in duration-700">
            <img
              src={logo}
              alt="NEOMART"
              className="w-56 h-56 object-contain drop-shadow-[0_8px_30px_oklch(0.35_0.012_240_/_0.2)]"
            />

            <section className="w-full">
              <h2 className="text-2xl font-bold sm:text-3xl">
                {text("مرحباً بك في NEOMART 👋", "Welcome to NEOMART 👋")}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {text(
                  "اكتشفي المنتجات المناسبة لاحتياجاتك وتسوقي بثقة.",
                  "Discover products that match your needs and shop with confidence.",
                )}
              </p>
            </section>

            {aiSection}

            <section className="w-full text-right">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">{text("الأكثر طلباً 🔥", "Most popular 🔥")}</h3>
                <Link to="/products" className="text-xs font-bold text-primary hover:underline">
                  {text("عرض الكل", "View all")}
                </Link>
              </div>
              {popularLoading && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {text("جاري تحميل المنتجات...", "Loading products...")}
                </p>
              )}
              {!popularLoading && popularError && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>{text("تعذّر تحميل المنتجات", "Could not load products")}</p>
                  <button
                    type="button"
                    onClick={() => void refetchPopular()}
                    className="mt-2 font-bold text-primary"
                  >
                    {text("إعادة المحاولة", "Try again")}
                  </button>
                </div>
              )}
              {!popularLoading && !popularError && popularProducts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {text("لا توجد منتجات الأكثر طلبًا حاليًا", "No popular products right now")}
                </p>
              )}
              {popularProducts.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-right">
                    {popularProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  <div ref={popularSentinelRef} className="min-h-8" aria-hidden="true" />
                  {popularFetchingNextPage && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {text("جاري تحميل المزيد...", "Loading more...")}
                    </p>
                  )}
                  {!popularHasNextPage && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {text(
                        "تم عرض جميع المنتجات الأكثر طلبًا",
                        "All popular products are displayed",
                      )}
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="w-full text-right">
              <h3 className="mb-3 text-lg font-black">
                {text("تسوق حسب احتياجك", "Shop by need")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["للبشرة الدهنية", "For oily skin"],
                  ["للبشرة الجافة", "For dry skin"],
                  ["حب الشباب", "Acne care"],
                  ["الشعر التالف", "Damaged hair"],
                ].map(([arabic, english]) => (
                  <button
                    key={arabic}
                    type="button"
                    onClick={() => submit(language === "ar" ? arabic : english)}
                    className="rounded-2xl border border-border/50 bg-card/60 px-3 py-3 text-center text-xs font-bold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    {text(arabic, english)}
                  </button>
                ))}
              </div>
            </section>

            {(userId || recent.length > 0) && (
              <div className="w-full text-right">
                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <History className="h-3 w-3" /> {text("عمليات بحث سابقة", "Previous searches")}
                </p>
                {historyError && (
                  <p className="mb-2 text-xs text-destructive">
                    {text("تعذر تحميل المحادثات", "Unable to load chats")}
                  </p>
                )}
                {userId ? (
                  <div className="flex flex-col gap-2">
                    {historyLoading && conversations.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {text("جاري تحميل المحادثات...", "Loading chats...")}
                      </p>
                    )}
                    {conversations
                      .filter((conversation) => !conversation.hidden_from_recent)
                      .slice(0, 5)
                      .map((conversation) => (
                        <div
                          key={conversation.id}
                          className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 p-3"
                        >
                          <button
                            type="button"
                            onClick={() => void openConversation(conversation)}
                            className="min-w-0 flex-1 text-right transition hover:opacity-70"
                          >
                            <span className="block truncate text-sm font-bold">
                              {conversation.title}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {formatConversationMeta(conversation.updated_at, language)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => hidePreviousConversation(conversation.id)}
                            className="shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label={text(
                              "إخفاء من البحث السابق",
                              "Hide from previous searches",
                            )}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {recent.slice(0, 5).map((r) => (
                      <button
                        key={r}
                        onClick={() => submit(r)}
                        className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {turns.map((t, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {(i === 0 || !isSameDay(turns[i - 1].userCreatedAt, t.userCreatedAt)) && (
                  <div className="flex items-center gap-3 py-1 text-[11px] font-bold text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    <span>{formatMessageDate(t.userCreatedAt, language)}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div className="self-start max-w-[85%] bg-gradient-to-br from-primary to-muted-foreground text-primary-foreground rounded-3xl rounded-ss-md px-4 py-2.5 shadow-soft">
                  <p className="text-sm leading-relaxed">{t.user}</p>
                </div>
                {t.loading && (
                  <div
                    className="self-end glass rounded-3xl rounded-se-md px-4 py-3 text-muted-foreground shadow-soft"
                    role="status"
                    aria-label={text("جاري الرد", "Waiting for reply")}
                  >
                    <span className="inline-flex items-center gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    </span>
                  </div>
                )}
                {t.error && (
                  <div className="self-end text-sm text-destructive bg-destructive/10 rounded-3xl rounded-se-md px-4 py-3">
                    {t.error === "حدث خطأ، حاولي مرة أخرى."
                      ? text("حدث خطأ، حاولي مرة أخرى.", "Something went wrong. Please try again.")
                      : t.error}
                  </div>
                )}
                {t.reply && (
                  <div className="self-end max-w-[90%] glass rounded-3xl rounded-se-md px-4 py-3 shadow-soft border border-border/50">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {t.reply}
                    </p>
                  </div>
                )}
                {t.products && t.products.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                    {t.products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="w-full">{chatBar}</div>
          </div>
        )}
      </div>
    </div>
  );
}
