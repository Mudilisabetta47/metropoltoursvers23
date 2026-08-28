import { useState } from "react";
import { Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const DELAY_REASONS = [
  "Stau",
  "Baustelle",
  "Unfall auf der Strecke",
  "Fahrgastaufkommen",
  "Grenzkontrolle",
  "Technisches Problem",
  "Witterung",
  "Wartezeit Kunde",
] as const;

const QUICK_MINUTES = [5, 10, 15, 20, 30, 45, 60, 90];

interface Props {
  currentDelay: number;
  onSubmit: (minutes: number, reason: string, note: string) => void | Promise<void>;
  busy?: boolean;
}

/** Verspätung in wenigen Sekunden melden – groß genug für die Bedienung im Bus. */
const DelaySheet = ({ currentDelay, onSubmit, busy }: Props) => {
  const [minutes, setMinutes] = useState(currentDelay || 10);
  const [reason, setReason] = useState<string>(DELAY_REASONS[0]);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-zinc-400 mb-2">Verspätung</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_MINUTES.map((m) => (
            <Button
              key={m}
              variant="outline"
              className={cn(
                "h-14 text-base",
                minutes === m && "bg-amber-500 text-black border-amber-500 hover:bg-amber-500",
              )}
              onClick={() => setMinutes(m)}
            >
              +{m}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-zinc-400 mb-2">Grund</p>
        <div className="grid grid-cols-2 gap-2">
          {DELAY_REASONS.map((r) => (
            <Button
              key={r}
              variant="outline"
              className={cn(
                "h-12 text-xs justify-start",
                reason === r && "bg-zinc-700 border-zinc-500 text-white",
              )}
              onClick={() => setReason(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ergänzung für die Zentrale (optional)"
        className="bg-white text-black min-h-[70px]"
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-14"
          disabled={busy}
          onClick={() => onSubmit(0, "Verspätung aufgeholt", note)}
        >
          <Clock className="w-5 h-5 mr-2" /> Pünktlich
        </Button>
        <Button
          className="h-14 bg-amber-500 hover:bg-amber-600 text-black"
          disabled={busy}
          onClick={() => onSubmit(minutes, reason, note)}
        >
          <Send className="w-5 h-5 mr-2" /> +{minutes} min melden
        </Button>
      </div>
    </div>
  );
};

export default DelaySheet;
