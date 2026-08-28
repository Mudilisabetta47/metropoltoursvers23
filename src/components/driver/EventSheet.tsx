import { useState } from "react";
import {
  AlertTriangle, Car, Coffee, Users, Fuel, Wrench, CloudRain, ShieldAlert, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const DRIVER_EVENT_TYPES = [
  { key: "traffic_jam", label: "Stau", icon: Car },
  { key: "break", label: "Pause", icon: Coffee },
  { key: "passenger_issue", label: "Fahrgast", icon: Users },
  { key: "refuel", label: "Tanken", icon: Fuel },
  { key: "technical", label: "Technik", icon: Wrench },
  { key: "weather", label: "Witterung", icon: CloudRain },
  { key: "accident", label: "Unfall", icon: ShieldAlert },
  { key: "other", label: "Sonstiges", icon: AlertTriangle },
] as const;

export type DriverEventType = (typeof DRIVER_EVENT_TYPES)[number]["key"];

interface Props {
  onSubmit: (type: DriverEventType, note: string) => void | Promise<void>;
  busy?: boolean;
}

/** Fahrtrelevante Ereignisse mit GPS-Stempel an die Zentrale melden. */
const EventSheet = ({ onSubmit, busy }: Props) => {
  const [type, setType] = useState<DriverEventType>("traffic_jam");
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {DRIVER_EVENT_TYPES.map((e) => {
          const Icon = e.icon;
          return (
            <Button
              key={e.key}
              variant="outline"
              className={cn(
                "h-20 flex-col gap-1 text-[11px]",
                type === e.key && "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-600",
              )}
              onClick={() => setType(e.key)}
            >
              <Icon className="w-6 h-6" />
              {e.label}
            </Button>
          );
        })}
      </div>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Kurze Beschreibung für die Zentrale"
        className="bg-white text-black min-h-[80px]"
      />

      <Button
        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700"
        disabled={busy}
        onClick={() => onSubmit(type, note)}
      >
        <Send className="w-5 h-5 mr-2" /> Ereignis melden
      </Button>
      <p className="text-[11px] text-zinc-500">
        Jede Meldung wird mit Zeitstempel und aktueller GPS-Position protokolliert.
      </p>
    </div>
  );
};

export default EventSheet;
