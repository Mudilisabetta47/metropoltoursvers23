import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiBadgeProps {
  className?: string;
  /** "corner" = kleines Overlay auf dem Bild, "inline" = Textzeile unter dem Bild */
  variant?: "corner" | "inline";
  label?: string;
}

/**
 * Transparenz-Kennzeichnung für KI-generierte Bilder (EU AI Act, Art. 50).
 */
export default function AiBadge({ className, variant = "corner", label = "KI-generiert" }: AiBadgeProps) {
  if (variant === "inline") {
    return (
      <p className={cn("text-[11px] text-muted-foreground flex items-center gap-1", className)}>
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        <span>Bild {label}</span>
      </p>
    );
  }

  return (
    <span
      title="Dieses Bild wurde mit künstlicher Intelligenz erstellt."
      className={cn(
        "absolute bottom-2 right-2 z-20 pointer-events-none select-none",
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "bg-black/55 backdrop-blur-sm text-white/90 text-[10px] font-medium tracking-wide",
        "border border-white/20",
        className,
      )}
    >
      <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
      {label}
    </span>
  );
}
