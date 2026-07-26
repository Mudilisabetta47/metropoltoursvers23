import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageSquare, Bell } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

const ChatTab = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("driver_messages")
      .select("*")
      .or(`recipient_id.eq.${userId},is_broadcast.eq.true`)
      .order("created_at", { ascending: true })
      .limit(50);
    setMessages(data || []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("fis-chat-" + userId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "driver_messages" },
        (p: any) => {
          const m = p.new;
          if (m.recipient_id === userId || m.is_broadcast) {
            setMessages((prev) => [...prev, m]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const { error } = await (supabase as any).from("driver_messages").insert({
        recipient_id: null,
        subject: "Fahrer → Disposition",
        message: trimmed.slice(0, 1000),
        priority: "normal",
        is_broadcast: false,
        sender_id: userId,
      });
      if (error) throw error;
      setText("");
    } catch (e: any) {
      toast.error("Nachricht nicht gesendet", { description: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[calc(100vh-160px)] rounded-2xl bg-[#131720] border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-emerald-400" />
        <div className="text-sm font-semibold text-white">Disposition</div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto" />
        <span className="text-xs text-zinc-500">Live</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-zinc-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-sm">Keine Nachrichten. Schreib der Zentrale eine erste Nachricht.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  mine ? "bg-emerald-600 text-white rounded-br-sm" :
                  m.priority === "critical" ? "bg-red-500/20 border border-red-500/40 text-red-100 rounded-bl-sm" :
                  m.priority === "urgent" ? "bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-bl-sm" :
                  "bg-white/5 border border-white/10 text-white rounded-bl-sm"
                }`}>
                  {m.subject && !mine && <div className="text-xs font-bold opacity-80 mb-0.5">{m.subject}</div>}
                  <div className="text-sm whitespace-pre-wrap">{m.message}</div>
                  <div className="text-[10px] opacity-60 mt-1">
                    {format(new Date(m.created_at), "HH:mm", { locale: de })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-white/5 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Nachricht an Disposition…"
          maxLength={1000}
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-emerald-500/50"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;
