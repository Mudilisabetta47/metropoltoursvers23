import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bus, MapPin, Send, Navigation, AlertTriangle, X,
  MessageSquare, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VehiclePosition {
  id: string;
  bus_id: string;
  trip_id: string | null;
  latitude: number;
  longitude: number;
  heading: number;
  speed_kmh: number;
  status: string;
  delay_minutes: number;
  driver_name: string | null;
  driver_user_id?: string;
  passenger_count: number;
  eta_next_stop: string | null;
}

interface VehicleActionPanelProps {
  vehicle: VehiclePosition | null;
  onClose: () => void;
}

type PanelView = "info" | "message" | "navigate";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "hamburg": { lat: 53.5511, lng: 9.9937 },
  "bremen": { lat: 53.0793, lng: 8.8017 },
  "hannover": { lat: 52.3759, lng: 9.732 },
  "berlin": { lat: 52.52, lng: 13.405 },
  "münchen": { lat: 48.1351, lng: 11.582 },
  "köln": { lat: 50.9375, lng: 6.9603 },
  "frankfurt": { lat: 50.1109, lng: 8.6821 },
  "düsseldorf": { lat: 51.2277, lng: 6.7735 },
  "stuttgart": { lat: 48.7758, lng: 9.1829 },
  "dortmund": { lat: 51.5136, lng: 7.4653 },
  "osnabrück": { lat: 52.2799, lng: 8.0472 },
  "bielefeld": { lat: 52.0302, lng: 8.5325 },
  "münster": { lat: 51.9607, lng: 7.6261 },
  "oldenburg": { lat: 53.1435, lng: 8.2146 },
  "kiel": { lat: 54.3213, lng: 10.1349 },
  "lübeck": { lat: 53.8655, lng: 10.6866 },
};

const VehicleActionPanel = ({ vehicle, onClose }: VehicleActionPanelProps) => {
  const { user } = useAuth();
  const [view, setView] = useState<PanelView>("info");
  const [sending, setSending] = useState(false);

  // Message state
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgPriority, setMsgPriority] = useState<"normal" | "urgent" | "critical">("normal");

  // Navigation state
  const [navDestination, setNavDestination] = useState("");
  const [navNotes, setNavNotes] = useState("");

  if (!vehicle) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_time": return "text-emerald-400 bg-emerald-500/20";
      case "delayed": return "text-amber-400 bg-amber-500/20";
      case "stopped": return "text-blue-400 bg-blue-500/20";
      case "offline": return "text-zinc-400 bg-zinc-500/20";
      case "incident": return "text-red-400 bg-red-500/20";
      default: return "text-zinc-400 bg-zinc-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on_time": return "Pünktlich";
      case "delayed": return "Verspätet";
      case "stopped": return "Angehalten";
      case "offline": return "Offline";
      case "incident": return "Störung";
      default: return status;
    }
  };

  const sendMessage = async () => {
    if (!user || !msgSubject.trim() || !msgBody.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("driver_messages").insert({
        sender_id: user.id,
        recipient_id: vehicle.driver_user_id || null,
        subject: msgSubject.trim(),
        message: msgBody.trim(),
        priority: msgPriority,
        is_broadcast: !vehicle.driver_user_id,
      } as any);
      if (error) throw error;
      toast.success("Nachricht an Fahrer gesendet");
      setMsgSubject("");
      setMsgBody("");
      setMsgPriority("normal");
      setView("info");
    } catch {
      toast.error("Fehler beim Senden");
    } finally {
      setSending(false);
    }
  };

  const sendNavigation = async () => {
    if (!user || !navDestination.trim()) return;
    setSending(true);
    try {
      // Try to resolve city name to coordinates
      const normalized = navDestination.toLowerCase().trim();
      let lat = 0, lng = 0;
      for (const [key, coords] of Object.entries(CITY_COORDS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          lat = coords.lat;
          lng = coords.lng;
          break;
        }
      }

      const { error } = await supabase.from("driver_navigation").insert({
        driver_user_id: vehicle.driver_user_id,
        sent_by: user.id,
        destination_lat: lat,
        destination_lng: lng,
        destination_name: navDestination.trim(),
        destination_address: navDestination.trim(),
        notes: navNotes.trim() || null,
        status: "pending",
      } as any);
      if (error) throw error;
      toast.success("Navigation an Fahrer gesendet");
      setNavDestination("");
      setNavNotes("");
      setView("info");
    } catch {
      toast.error("Fehler beim Senden");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 w-96 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl z-10 max-h-[80vh] overflow-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Bus #{vehicle.bus_id.slice(0, 8)}
              </h3>
              <p className="text-xs text-zinc-400">
                {vehicle.driver_name || "Kein Fahrer zugewiesen"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 mb-3">
          {[
            { id: "info" as PanelView, label: "Info", icon: Bus },
            { id: "message" as PanelView, label: "Nachricht", icon: MessageSquare },
            { id: "navigate" as PanelView, label: "Navigation", icon: Navigation },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                view === tab.id
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:text-zinc-200"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Info View */}
        {view === "info" && (
          <>
            <Badge className={cn("mb-3", getStatusColor(vehicle.status))}>
              {getStatusLabel(vehicle.status)}
              {vehicle.delay_minutes > 0 && ` (+${vehicle.delay_minutes} min)`}
            </Badge>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-zinc-800/50 rounded-lg">
                <div className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Position
                </div>
                <div className="text-white text-xs">
                  {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                </div>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded-lg">
                <div className="text-zinc-400 text-xs mb-1">Geschwindigkeit</div>
                <div className="text-white text-xs">{vehicle.speed_kmh} km/h</div>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded-lg">
                <div className="text-zinc-400 text-xs mb-1">Passagiere</div>
                <div className="text-white text-xs">{vehicle.passenger_count} an Bord</div>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded-lg">
                <div className="text-zinc-400 text-xs mb-1">ETA</div>
                <div className="text-white text-xs">
                  {vehicle.eta_next_stop
                    ? new Date(vehicle.eta_next_stop).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
                    : "-"}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Message View */}
        {view === "message" && (
          <div className="space-y-3">
            <div className="flex gap-1">
              {(["normal", "urgent", "critical"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setMsgPriority(p)}
                  className={cn(
                    "flex-1 py-1.5 rounded text-[11px] font-medium border transition-all",
                    msgPriority === p
                      ? p === "critical"
                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                        : p === "urgent"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-500"
                  )}
                >
                  {p === "critical" ? "🔴 Kritisch" : p === "urgent" ? "🟡 Dringend" : "Normal"}
                </button>
              ))}
            </div>
            <Input
              value={msgSubject}
              onChange={(e) => setMsgSubject(e.target.value)}
              placeholder="Betreff..."
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs"
            />
            <Textarea
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Nachricht an den Fahrer..."
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs min-h-[80px]"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !msgSubject.trim() || !msgBody.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Nachricht senden
            </Button>
          </div>
        )}

        {/* Navigate View */}
        {view === "navigate" && (
          <div className="space-y-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-[11px] text-emerald-400">
                <Navigation className="w-3 h-3 inline mr-1" />
                Sende ein Navigationsziel direkt an den Fahrer. Er sieht es sofort auf seinem Dashboard.
              </p>
            </div>
            <Input
              value={navDestination}
              onChange={(e) => setNavDestination(e.target.value)}
              placeholder="Zielort (z.B. Hamburg ZOB, Köln Hbf...)"
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs"
            />
            <Textarea
              value={navNotes}
              onChange={(e) => setNavNotes(e.target.value)}
              placeholder="Anmerkungen (optional)..."
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs min-h-[60px]"
            />
            <Button
              onClick={sendNavigation}
              disabled={sending || !navDestination.trim() || !vehicle.driver_user_id}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
              Navigation senden
            </Button>
            {!vehicle.driver_user_id && (
              <p className="text-[10px] text-red-400 text-center">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Kein Fahrer zugewiesen – Navigation nicht möglich
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleActionPanel;
