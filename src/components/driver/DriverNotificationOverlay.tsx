import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell, Navigation, MessageSquare, X, Check,
  AlertTriangle, MapPin, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface DriverMessage {
  id: string;
  recipient_id: string | null;
  subject: string;
  message: string;
  priority: string;
  is_broadcast: boolean;
  read_at: string | null;
  created_at: string;
}

interface DriverNav {
  id: string;
  destination_name: string;
  destination_address: string | null;
  destination_lat: number;
  destination_lng: number;
  notes: string | null;
  status: string;
  created_at: string;
}

interface DriverNotificationOverlayProps {
  userId: string;
}

const DriverNotificationOverlay = ({ userId }: DriverNotificationOverlayProps) => {
  const [messages, setMessages] = useState<DriverMessage[]>([]);
  const [navCommands, setNavCommands] = useState<DriverNav[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [activeNav, setActiveNav] = useState<DriverNav | null>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("driver_messages")
      .select("*")
      .or(`recipient_id.eq.${userId},is_broadcast.eq.true`)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setMessages(data as DriverMessage[]);
  }, [userId]);

  const fetchNavCommands = useCallback(async () => {
    const { data } = await supabase
      .from("driver_navigation")
      .select("*")
      .eq("driver_user_id", userId)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) {
      setNavCommands(data as DriverNav[]);
      // Auto-show the latest pending navigation
      const pending = (data as DriverNav[]).find(n => n.status === "pending");
      if (pending && (!activeNav || activeNav.id !== pending.id)) {
        setActiveNav(pending);
        setExpanded(true);
        // Vibrate to alert driver
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }
  }, [userId, activeNav]);

  useEffect(() => {
    fetchMessages();
    fetchNavCommands();

    // Realtime subscriptions
    const msgChannel = supabase
      .channel("driver_msg_" + userId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "driver_messages",
      }, (payload: any) => {
        const msg = payload.new as DriverMessage;
        if (msg.recipient_id === userId || msg.is_broadcast) {
          setMessages(prev => [msg, ...prev]);
          if (msg.priority === "critical" || msg.priority === "urgent") {
            setExpanded(true);
            if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
          }
          toast.warning(`Neue Nachricht: ${msg.subject}`, { duration: 8000 });
        }
      })
      .subscribe();

    const navChannel = supabase
      .channel("driver_nav_" + userId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "driver_navigation",
        filter: `driver_user_id=eq.${userId}`,
      }, (payload: any) => {
        const nav = payload.new as DriverNav;
        setNavCommands(prev => [nav, ...prev]);
        setActiveNav(nav);
        setExpanded(true);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        toast.info(`Neues Navigationsziel: ${nav.destination_name}`, { duration: 10000 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(navChannel);
    };
  }, [userId, fetchMessages, fetchNavCommands]);

  const markMessageRead = async (msgId: string) => {
    await supabase
      .from("driver_messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("id", msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const updateNavStatus = async (navId: string, status: "active" | "completed" | "dismissed") => {
    await supabase
      .from("driver_navigation")
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq("id", navId);
    if (status === "completed" || status === "dismissed") {
      setNavCommands(prev => prev.filter(n => n.id !== navId));
      if (activeNav?.id === navId) setActiveNav(null);
    } else {
      setNavCommands(prev => prev.map(n => n.id === navId ? { ...n, status } : n));
    }
  };

  const openInMaps = (nav: DriverNav) => {
    const url = nav.destination_lat && nav.destination_lng && nav.destination_lat !== 0
      ? `https://www.google.com/maps/dir/?api=1&destination=${nav.destination_lat},${nav.destination_lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nav.destination_name)}`;
    window.open(url, "_blank");
    updateNavStatus(nav.id, "active");
  };

  const totalCount = messages.length + navCommands.length;
  const hasCritical = messages.some(m => m.priority === "critical") || navCommands.length > 0;

  if (totalCount === 0 && !activeNav) return null;

  return (
    <div className="fixed top-16 right-2 left-2 z-50 max-w-md mx-auto">
      {/* Notification Badge / Toggle */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border shadow-lg transition-all",
            hasCritical
              ? "bg-red-500/20 border-red-500/40 animate-pulse"
              : "bg-zinc-900/95 border-zinc-700"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            hasCritical ? "bg-red-500" : "bg-cyan-600"
          )}>
            {navCommands.length > 0 ? (
              <Navigation className="w-5 h-5 text-white" />
            ) : (
              <Bell className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white">
              {navCommands.length > 0
                ? `Neues Navigationsziel`
                : `${totalCount} neue Nachricht${totalCount > 1 ? "en" : ""}`}
            </p>
            <p className="text-xs text-zinc-400">Tippen zum Anzeigen</p>
          </div>
          <span className={cn(
            "text-lg font-bold",
            hasCritical ? "text-red-400" : "text-cyan-400"
          )}>
            {totalCount}
          </span>
        </button>
      )}

      {/* Expanded Panel */}
      {expanded && (
        <div className="bg-zinc-900/98 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Benachrichtigungen
            </h3>
            <button onClick={() => setExpanded(false)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-auto p-2 space-y-2">
            {/* Active Navigation Commands */}
            {navCommands.map((nav) => (
              <div
                key={nav.id}
                className={cn(
                  "p-3 rounded-lg border",
                  nav.status === "pending"
                    ? "bg-emerald-500/10 border-emerald-500/30 animate-pulse"
                    : "bg-emerald-500/5 border-emerald-500/20"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">Navigationsziel</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-lg">{nav.destination_name}</span>
                </div>
                {nav.notes && (
                  <p className="text-xs text-zinc-400 mb-2">📝 {nav.notes}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => openInMaps(nav)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" /> In Maps öffnen
                  </Button>
                  <Button
                    onClick={() => updateNavStatus(nav.id, "completed")}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300"
                    size="sm"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => updateNavStatus(nav.id, "dismissed")}
                    variant="ghost"
                    className="text-zinc-500"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {format(new Date(nav.created_at), "HH:mm", { locale: de })} Uhr
                </p>
              </div>
            ))}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-3 rounded-lg border",
                  msg.priority === "critical"
                    ? "bg-red-500/10 border-red-500/30"
                    : msg.priority === "urgent"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-zinc-800/50 border-zinc-700"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-sm font-bold text-white flex-1">{msg.subject}</span>
                  {msg.priority === "critical" && (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  {msg.priority === "urgent" && (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-xs text-zinc-300 mb-2">{msg.message}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-zinc-600">
                    {format(new Date(msg.created_at), "HH:mm", { locale: de })} Uhr
                  </p>
                  <Button
                    onClick={() => markMessageRead(msg.id)}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 text-xs h-6"
                  >
                    <Check className="w-3 h-3 mr-1" /> Gelesen
                  </Button>
                </div>
              </div>
            ))}

            {totalCount === 0 && (
              <div className="text-center py-6 text-zinc-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                <p className="text-xs">Keine neuen Benachrichtigungen</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverNotificationOverlay;
