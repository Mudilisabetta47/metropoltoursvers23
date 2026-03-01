import { useState, useEffect } from "react";
import { Eye, ShoppingCart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TourSocialProofProps {
  tourId: string;
  availableSeats: number;
  selectedDateId?: string;
}

const TourSocialProof = ({ tourId, availableSeats, selectedDateId }: TourSocialProofProps) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);

  // Realtime Presence for live viewer count
  useEffect(() => {
    const channel = supabase.channel(`tour-presence-${tourId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tourId]);

  // Query today's bookings for this tour
  useEffect(() => {
    const fetchTodayBookings = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("tour_bookings")
        .select("*", { count: "exact", head: true })
        .eq("tour_id", tourId)
        .gte("created_at", `${today}T00:00:00`)
        .in("status", ["confirmed", "paid", "pending"]);
      setTodayBookings(count || 0);
    };
    fetchTodayBookings();
  }, [tourId]);

  const items = [];

  if (viewerCount > 1) {
    items.push({
      icon: Eye,
      text: `${viewerCount} Personen schauen sich diese Reise gerade an`,
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-500",
    });
  }

  if (todayBookings > 0) {
    items.push({
      icon: ShoppingCart,
      text: `Heute ${todayBookings}× gebucht`,
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-500",
    });
  }

  if (selectedDateId && availableSeats > 0 && availableSeats <= 10) {
    items.push({
      icon: AlertTriangle,
      text: `Nur noch ${availableSeats} Plätze verfügbar`,
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
      iconColor: "text-red-500",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium ${item.bg} ${item.color} animate-fade-in`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${item.iconColor}`} />
            <span>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default TourSocialProof;
