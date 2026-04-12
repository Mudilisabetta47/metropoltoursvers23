import { useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LocationShareButtonProps {
  userId: string;
}

const LocationShareButton = ({ userId }: LocationShareButtonProps) => {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const { toast } = useToast();

  const shareLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Fehler", description: "Geolocation wird nicht unterstützt.", variant: "destructive" });
      return;
    }

    setSharing(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const today = new Date().toISOString().split("T")[0];
      const { data: shift } = await supabase
        .from("employee_shifts")
        .select("assigned_bus_id, assigned_trip_id")
        .eq("user_id", userId)
        .eq("shift_date", today)
        .in("status", ["scheduled", "active"])
        .order("shift_start", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!shift?.assigned_bus_id) {
        toast({ title: "Kein Bus zugewiesen", description: "Heute ist kein Bus für Sie eingeplant.", variant: "destructive" });
        setSharing(false);
        return;
      }

      const { error } = await supabase.from("vehicle_positions").upsert(
        {
          driver_user_id: userId,
          bus_id: shift.assigned_bus_id,
          trip_id: shift.assigned_trip_id || null,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed_kmh: pos.coords.speed ? Math.round(pos.coords.speed * 3.6 * 10) / 10 : 0,
          heading: pos.coords.heading || 0,
          status: "on_time",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "driver_user_id" }
      );

      if (error) throw error;

      setShared(true);
      toast({ title: "Standort geteilt ✓", description: "Ihre Position wurde erfolgreich aktualisiert." });
      setTimeout(() => setShared(false), 3000);
    } catch (err: any) {
      if (err?.code === 1) {
        toast({ title: "Zugriff verweigert", description: "Bitte erlauben Sie den Standortzugriff.", variant: "destructive" });
      } else {
        toast({ title: "Fehler", description: "Standort konnte nicht geteilt werden.", variant: "destructive" });
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Button
      onClick={shareLocation}
      disabled={sharing}
      variant={shared ? "outline" : "default"}
      className="gap-2"
    >
      {sharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : shared ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <MapPin className="w-4 h-4" />
      )}
      {sharing ? "Wird ermittelt..." : shared ? "Standort geteilt" : "Standort jetzt teilen"}
    </Button>
  );
};

export default LocationShareButton;
