import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  hidden_from_recent: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function ensureAnonymousUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user) return sessionData.session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error("anonymous_user_missing");
  return data.user;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id, title, hidden_from_recent, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createConversation(userId: string, title: string) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("id, user_id, title, hidden_from_recent, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function loadConversationMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, user_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveMessage(params: {
  conversationId: string;
  userId: string;
  role: StoredMessage["role"];
  content: string;
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
    })
    .select("id, conversation_id, user_id, role, content, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function touchConversation(conversationId: string) {
  const { error } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function hideConversation(conversationId: string) {
  const { error } = await supabase
    .from("conversations")
    .update({ hidden_from_recent: true })
    .eq("id", conversationId);
  if (error) throw error;
}

export function makeConversationTitle(message: string) {
  const title = message.trim().replace(/\s+/g, " ");
  return title.length > 60 ? `${title.slice(0, 57)}...` : title;
}
