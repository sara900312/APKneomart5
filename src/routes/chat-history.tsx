import { useEffect, useState } from "react";
import { ArrowRight, History, Loader2, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "@/lib/i18n";
import {
  ensureAnonymousUser,
  listConversations,
  loadConversationMessages,
  type Conversation,
  type StoredMessage,
} from "@/lib/chatHistory";

export const Route = createFileRoute("/chat-history")({
  head: () => ({ meta: [{ title: "الدردشات — NEOMART" }] }),
  component: ChatHistoryPage,
});

function formatMeta(value: string, language: "ar" | "en") {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDay(value: string, language: "ar" | "en") {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-IQ" : "en-US", {
    dateStyle: "full",
  }).format(new Date(value));
}

function ChatHistoryPage() {
  const { language, direction, text } = useLocale();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureAnonymousUser().then(async () => {
      if (cancelled) return;
      setAuthenticated(true);
      const items = await listConversations();
      if (!cancelled) setConversations(items);
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function openConversation(conversation: Conversation) {
    setSelected(conversation);
    setMessagesLoading(true);
    setError(false);
    try {
      setMessages(await loadConversationMessages(conversation.id));
    } catch {
      setError(true);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  return (
    <div dir={direction} className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            {text("رجوع", "Back")}
          </Link>
          <h1 className="text-sm font-bold">{text("الدردشات", "Chats")}</h1>
          <Link to="/" className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
            {text("جديد", "New")}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        {!authenticated && !loading && !error && (
          <div className="rounded-3xl border border-border/50 bg-card/60 p-6 text-center">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-bold">{text("جاري تجهيز الدردشات...", "Preparing your chats...")}</p>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {text("جاري تحميل الدردشات...", "Loading chats...")}
          </div>
        )}
        {authenticated && !loading && (
          <>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black">{text("كل الدردشات", "All chats")}</h2>
            </div>
            {conversations.length === 0 ? (
              <p className="rounded-2xl border border-border/50 bg-card/60 p-5 text-center text-sm text-muted-foreground">
                {text("لا توجد محادثات محفوظة بعد", "No saved chats yet")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void openConversation(conversation)}
                    className={`rounded-2xl border p-4 text-right transition hover:border-primary/40 ${selected?.id === conversation.id ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/60"}`}
                  >
                    <span className="block truncate text-sm font-bold">{conversation.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{formatMeta(conversation.updated_at, language)}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {error && <p className="text-center text-sm text-destructive">{text("تعذر تحميل المحادثة", "Unable to load this chat")}</p>}
        {selected && (
          <section className="mt-3 flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/40 p-4">
            <h2 className="text-base font-black">{selected.title}</h2>
            {messagesLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {text("جاري تحميل الرسائل...", "Loading messages...")}
              </div>
            ) : messages.map((message, index) => (
              <div key={message.id} className="flex flex-col gap-2">
                {(index === 0 || new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString()) && (
                  <div className="flex items-center gap-3 py-1 text-[11px] font-bold text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    <span>{formatDay(message.created_at, language)}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div className={message.role === "user" ? "self-start max-w-[85%] rounded-3xl rounded-ss-md bg-primary px-4 py-3 text-sm text-primary-foreground" : "self-end max-w-[90%] rounded-3xl rounded-se-md border border-border/50 bg-background/70 px-4 py-3 text-sm leading-relaxed"}>
                  {message.content}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
