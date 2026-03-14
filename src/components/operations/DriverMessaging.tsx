import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Megaphone, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DriverMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  message: string;
  priority: string;
  is_broadcast: boolean;
  read_at: string | null;
  created_at: string;
}

const DriverMessaging = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DriverMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [isBroadcast, setIsBroadcast] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("driver_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) setMessages(data as DriverMessage[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("driver_messages_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_messages" }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim() || !user) return;
    const { error } = await supabase.from("driver_messages").insert({
      sender_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      priority,
      is_broadcast: isBroadcast,
      recipient_id: isBroadcast ? null : null, // would select specific driver
    } as any);
    if (error) {
      toast.error("Fehler beim Senden");
    } else {
      setSubject("");
      setMessage("");
      setPriority("normal");
      setDialogOpen(false);
      toast.success("Nachricht gesendet");
    }
  };

  const unreadCount = messages.filter(m => !m.read_at).length;

  return (
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Fahrer-Nachrichten</h2>
          {unreadCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-5 px-2 text-[9px] bg-cyan-600 hover:bg-cyan-700">
              <Send className="w-2.5 h-2.5 mr-0.5" /> Senden
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111820] border-[#1e2836] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-200">Nachricht an Fahrer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBroadcast(true)}
                  className={cn(
                    "flex-1 p-2 rounded border text-[11px] flex items-center gap-1.5 justify-center",
                    isBroadcast ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-[#0c1018] border-[#1e2836] text-zinc-500"
                  )}
                >
                  <Megaphone className="w-3 h-3" /> Alle Fahrer
                </button>
                <button
                  onClick={() => setIsBroadcast(false)}
                  className={cn(
                    "flex-1 p-2 rounded border text-[11px] flex items-center gap-1.5 justify-center",
                    !isBroadcast ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-[#0c1018] border-[#1e2836] text-zinc-500"
                  )}
                >
                  <User className="w-3 h-3" /> Einzeln
                </button>
              </div>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Betreff..."
                className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs"
              />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nachricht..."
                className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs min-h-[80px]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPriority(priority === "normal" ? "urgent" : "normal")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-[10px]",
                    priority === "urgent" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-[#0c1018] text-zinc-500 border border-[#1e2836]"
                  )}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {priority === "urgent" ? "Dringend" : "Normal"}
                </button>
                <div className="flex-1" />
                <Button onClick={handleSend} disabled={!subject.trim() || !message.trim()} className="bg-cyan-600 hover:bg-cyan-700">
                  Senden
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-3">
          <MessageSquare className="w-5 h-5 mx-auto mb-1 text-zinc-700" />
          <p className="text-[10px] text-zinc-600">Keine Nachrichten gesendet</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[200px] overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className={cn(
              "p-2 rounded border",
              m.priority === "urgent" ? "bg-red-500/5 border-red-500/20" : "bg-[#0c1018] border-[#1e2836]"
            )}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {m.is_broadcast ? (
                  <Megaphone className="w-2.5 h-2.5 text-cyan-400" />
                ) : (
                  <User className="w-2.5 h-2.5 text-zinc-500" />
                )}
                <span className="text-[11px] font-medium text-white truncate">{m.subject}</span>
                {m.priority === "urgent" && <AlertTriangle className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />}
              </div>
              <p className="text-[10px] text-zinc-400 line-clamp-2">{m.message}</p>
              <p className="text-[9px] text-zinc-600 mt-1">
                {format(new Date(m.created_at), "dd. MMM HH:mm", { locale: de })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverMessaging;
