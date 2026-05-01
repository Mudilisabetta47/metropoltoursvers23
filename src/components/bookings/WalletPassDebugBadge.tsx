import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2, XCircle, Smartphone, Apple, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  bookingId: string;
  bookingStatus: string;
  className?: string;
}

const detectOS = (): { label: string; icon: typeof Apple } => {
  if (typeof navigator === "undefined") return { label: "Unbekannt", icon: Monitor };
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)) {
    return { label: "iOS · Apple Wallet", icon: Apple };
  }
  if (/Android/i.test(ua)) return { label: "Android · Google Wallet", icon: Smartphone };
  return { label: "Desktop · Link teilen", icon: Monitor };
};

export function WalletPassDebugBadge({ bookingId, bookingStatus, className }: Props) {
  const [passExists, setPassExists] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("wallet_passes")
        .select("id, is_voided")
        .eq("booking_id", bookingId)
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setPassExists(!!data && !data.is_voided);
    })();
    return () => { cancelled = true; };
  }, [bookingId]);

  const os = detectOS();
  const OsIcon = os.icon;
  const buttonVisible = bookingStatus !== "cancelled";

  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 p-2.5 text-[11px] space-y-1.5", className)}>
      <div className="flex items-center gap-1.5 font-semibold text-foreground/80">
        <Info className="w-3 h-3" />
        Wallet-Pass · Diagnose
      </div>
      <div className="grid grid-cols-1 gap-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <span>Buchungsstatus</span>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono">{bookingStatus}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Gerät / Wallet-Typ</span>
          <span className="flex items-center gap-1 text-foreground/80">
            <OsIcon className="w-3 h-3" /> {os.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Pass bereits erstellt</span>
          {passExists === null ? (
            <span className="text-muted-foreground/60">prüft…</span>
          ) : passExists ? (
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="w-3 h-3" /> Ja
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <XCircle className="w-3 h-3" /> Nein
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <span>Button sichtbar</span>
          {buttonVisible ? (
            <span className="flex items-center gap-1 text-primary font-medium">
              <CheckCircle2 className="w-3 h-3" /> Ja
            </span>
          ) : (
            <span className="flex items-center gap-1 text-destructive font-medium">
              <XCircle className="w-3 h-3" /> Nein – Buchung storniert
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletPassDebugBadge;
