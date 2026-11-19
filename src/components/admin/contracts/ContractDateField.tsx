import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  /** YYYY-MM-DD oder null */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/** Freie Datumsauswahl (Vergangenheit, Gegenwart, Zukunft) – setzt nie automatisch "heute". */
export function ContractDateField({ value, onChange, placeholder = "Datum wählen", ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  const thisYear = new Date().getFullYear();

  return (
    <div className="flex gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={ariaLabel}
            className={cn(
              "flex-1 justify-start text-left font-normal bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
              !selected && "text-zinc-400",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? format(selected, "dd.MM.yyyy", { locale: de }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={de}
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : null);
              setOpen(false);
            }}
            captionLayout="dropdown-buttons"
            fromYear={thisYear - 30}
            toYear={thisYear + 10}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            classNames={{
              caption_label: "hidden",
              caption_dropdowns: "flex gap-2",
              dropdown: "rounded-md border border-input bg-background px-2 py-1 text-sm",
              vhidden: "sr-only",
            }}
          />
        </PopoverContent>
      </Popover>
      {selected && (
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Datum entfernen" className="text-zinc-400">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
