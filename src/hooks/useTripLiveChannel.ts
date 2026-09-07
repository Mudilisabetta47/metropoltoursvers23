import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Direkter Realtime-Kanal zwischen Fahrer-App und öffentlicher Live-Verfolgungsseite.
 * Der Fahrer sendet Ereignisse (Halt, Verspätung, Abfahrt), die Verfolgungsseite
 * aktualisiert sich sofort – ohne auf das nächste Polling-Intervall zu warten.
 */
export type TripLiveEvent =
  | "stops_changed"
  | "delay_changed"
  | "stop_arrival"
  | "stop_departure"
  | "unscheduled_stop"
  | "status_changed";

const channelName = (tripId: string) => `trip-live-${tripId}`;

/** Fahrerseite: Ereignisse senden und sehen, wie viele Fahrgäste gerade mitverfolgen. */
export const useDriverLiveChannel = (tripId: string | null | undefined) => {
  const channelRef = useRef<any>(null);
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    if (!tripId) {
      channelRef.current = null;
      setViewers(0);
      return;
    }
    const channel = supabase.channel(channelName(tripId), {
      config: { presence: { key: "driver" }, broadcast: { self: false } },
    });

    const syncViewers = () => {
      const state = channel.presenceState() as Record<string, any[]>;
      const count = Object.values(state)
        .flat()
        .filter((p: any) => p?.role === "viewer").length;
      setViewers(count);
    };

    channel
      .on("presence", { event: "sync" }, syncViewers)
      .on("presence", { event: "join" }, syncViewers)
      .on("presence", { event: "leave" }, syncViewers)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ role: "driver", at: new Date().toISOString() });
          syncViewers();
        }
      });

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const publish = useCallback(
    (event: TripLiveEvent, payload: Record<string, unknown> = {}) => {
      const channel = channelRef.current;
      if (!channel) return;
      try {
        channel.send({
          type: "broadcast",
          event,
          payload: { ...payload, at: new Date().toISOString() },
        });
      } catch {
        /* Broadcast ist rein optional – Datenbank bleibt führend */
      }
    },
    [],
  );

  return { viewers, publish };
};

/** Fahrgastseite: auf Fahrer-Ereignisse hören und sofort neu laden. */
export const useTrackerLiveChannel = (
  tripId: string | null | undefined,
  onEvent: (event: TripLiveEvent) => void,
) => {
  const [driverOnline, setDriverOnline] = useState(false);
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!tripId) return;
    const channel = supabase.channel(channelName(tripId), {
      config: { presence: { key: `viewer-${Math.random().toString(36).slice(2)}` } },
    });

    const syncDriver = () => {
      const state = channel.presenceState() as Record<string, any[]>;
      setDriverOnline(
        Object.values(state)
          .flat()
          .some((p: any) => p?.role === "driver"),
      );
    };

    const events: TripLiveEvent[] = [
      "stops_changed",
      "delay_changed",
      "stop_arrival",
      "stop_departure",
      "unscheduled_stop",
      "status_changed",
    ];
    events.forEach((event) => {
      channel.on("broadcast", { event }, () => handler.current(event));
    });

    channel
      .on("presence", { event: "sync" }, syncDriver)
      .on("presence", { event: "join" }, syncDriver)
      .on("presence", { event: "leave" }, syncDriver)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ role: "viewer", at: new Date().toISOString() });
          syncDriver();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { driverOnline };
};
