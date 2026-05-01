import { useEffect, useState } from "react";
import { Bell, Check, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

interface Notification {
  id: string;
  notification_type: string;
  severity: "info" | "warning" | "error" | "success";
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const severityIcon = {
  info: { Icon: Info, color: "text-blue-400" },
  warning: { Icon: AlertTriangle, color: "text-amber-400" },
  error: { Icon: XCircle, color: "text-red-400" },
  success: { Icon: CheckCircle2, color: "text-[#00CC36]" },
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setItems(data as Notification[]);
  };

  useEffect(() => {
    if (!user) return;
    load();

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev].slice(0, 30));
          toast(n.title, {
            description: n.body ?? undefined,
            action: n.link ? { label: "Öffnen", onClick: () => navigate(n.link!) } : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAllRead = async () => {
    const ids = items.filter((i) => !i.is_read).map((i) => i.id);
    if (ids.length === 0) return;
    await supabase.from("admin_notifications").update({ is_read: true, read_at: new Date().toISOString() }).in("id", ids);
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from("admin_notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative size-9 rounded-lg cockpit-glass hover:border-zinc-600 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00CC36] text-black text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0b0e14]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0 bg-[#0b0e14] border-zinc-800 text-zinc-100"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Benachrichtigungen</h3>
            <p className="text-[11px] text-zinc-500">{unreadCount} ungelesen</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-[#00CC36] hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Alle gelesen
            </button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {items.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Keine Benachrichtigungen
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {items.map((n) => {
                const sev = severityIcon[n.severity] ?? severityIcon.info;
                const Icon = sev.Icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 hover:bg-white/[0.03] transition-colors",
                      !n.is_read && "bg-[#00CC36]/[0.04]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", sev.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-white truncate">{n.title}</div>
                        {!n.is_read && <div className="size-2 rounded-full bg-[#00CC36] mt-1.5 shrink-0" />}
                      </div>
                      {n.body && <p className="text-[12px] text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
