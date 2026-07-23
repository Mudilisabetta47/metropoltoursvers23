import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Send, Loader2, Bot, User, Wrench, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Zeige alle offenen Rechnungen",
  "Wie viele Buchungen wurden heute erstellt?",
  "Liste die Fahrten der nächsten 3 Tage",
  "Setze Buchung TKT-2026-000123 auf bestätigt",
];

export default function AdminCopilot() {
  const { hasAnyStaffRole, isLoading, user, roles } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setToken(s?.access_token ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const transport = useMemo(() => {
    if (!token) return null;
    return new DefaultChatTransport({
      api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot-chat`,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: transport ?? undefined,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  if (isLoading) return null;
  if (!hasAnyStaffRole) return <Navigate to="/admin/dashboard" replace />;

  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    if (!text.trim() || !transport || busy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  return (
    <AdminLayout
      title="Copilot"
      subtitle="Interner KI-Assistent – arbeitet mit Buchungen, Fahrten, Rechnungen & mehr."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMessages([])}
          disabled={busy || messages.length === 0}
        >
          Neuer Chat
        </Button>
      }
    >
      <div className="flex flex-col h-[calc(100vh-200px)] max-w-5xl mx-auto">
        {/* Header info bar */}
        <Card className="p-3 mb-4 bg-[#00CC36]/5 border-[#00CC36]/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#00CC36]/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#00CC36]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium">METOURS Copilot</p>
            <p className="text-[11px] text-zinc-400">
              Angemeldet als {user?.email} · Rollen: {roles.join(", ") || "–"} · Alle Aktionen werden protokolliert.
            </p>
          </div>
        </Card>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2"
        >
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00CC36]/15 flex items-center justify-center">
                <Bot className="w-8 h-8 text-[#00CC36]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Wie kann ich helfen?</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Frag mich etwas oder wähle ein Beispiel:
                </p>
              </div>
              <div className="grid gap-2 max-w-xl mx-auto">
                {EXAMPLES.map((e) => (
                  <button
                    key={e}
                    onClick={() => send(e)}
                    disabled={!transport}
                    className="text-left text-sm px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 transition disabled:opacity-50"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {status === "submitted" && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm pl-11">
              <Loader2 className="w-3 h-3 animate-spin" />
              Denke nach...
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              Fehler: {error.message}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mt-4 flex gap-2 items-end"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Frage stellen oder Aufgabe beschreiben..."
            disabled={busy || !transport}
            className="min-h-[52px] max-h-40 resize-none bg-white text-black"
          />
          <Button
            type="submit"
            disabled={busy || !input.trim() || !transport}
            className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-white h-[52px] px-5"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-white/10" : "bg-[#00CC36]/20",
        )}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-[#00CC36]" />}
      </div>
      <div className={cn("flex-1 space-y-2 max-w-[85%]", isUser && "items-end flex flex-col")}>
        {(message.parts ?? []).map((part: any, i: number) => {
          if (part.type === "text") {
            return (
              <div
                key={i}
                className={cn(
                  "text-sm rounded-2xl px-4 py-2.5 whitespace-pre-wrap",
                  isUser
                    ? "bg-[#00CC36] text-white"
                    : "bg-white/5 border border-white/10 text-zinc-100",
                )}
              >
                {part.text}
              </div>
            );
          }
          if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            const name = part.type.replace(/^tool-/, "");
            const state = part.state; // input-available | output-available | output-error
            const ok = state === "output-available";
            const err = state === "output-error";
            return (
              <div
                key={i}
                className="flex items-center gap-2 text-[11px] text-zinc-400 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 font-cockpit-mono"
              >
                <Wrench className="w-3 h-3" />
                <span className="text-zinc-300">{name}</span>
                {ok && <CheckCircle2 className="w-3 h-3 text-[#00CC36]" />}
                {err && <XCircle className="w-3 h-3 text-red-400" />}
                {!ok && !err && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
