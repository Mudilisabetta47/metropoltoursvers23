import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Wallet, Smartphone, Apple, ExternalLink, Copy, Check,
  CheckCircle2, AlertCircle, RefreshCw, CircleDashed,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface WalletPassButtonProps {
  bookingId: string;
  ticketNumber: string;
  customerEmail?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  className?: string;
  bookingType?: "bus" | "tour";
}

interface PassData {
  pass_url: string;
  pass_html?: string;
  serial: string;
  pass_type: "apple" | "google";
}

interface PassStatus {
  state: "none" | "active" | "expired" | "voided";
  pass_type: "apple" | "google" | null;
  last_updated: string | null;
  pass_url: string | null;
  serial: string | null;
}

// Pass gilt 90 Tage als "frisch" – danach Empfehlung neu zu generieren
const PASS_FRESHNESS_DAYS = 90;

const isiOS = () => typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1));

const isAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

function computeState(row: any | null): PassStatus {
  if (!row) return { state: "none", pass_type: null, last_updated: null, pass_url: null, serial: null };
  if (row.is_voided) {
    return { state: "voided", pass_type: row.pass_type, last_updated: row.last_updated, pass_url: row.pass_url, serial: row.serial_number };
  }
  const ageMs = Date.now() - new Date(row.last_updated).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return {
    state: ageDays > PASS_FRESHNESS_DAYS ? "expired" : "active",
    pass_type: row.pass_type,
    last_updated: row.last_updated,
    pass_url: row.pass_url,
    serial: row.serial_number,
  };
}

export function WalletPassButton({
  bookingId, ticketNumber, customerEmail, variant = "outline", size = "sm", className, bookingType = "bus",
}: WalletPassButtonProps) {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [pass, setPass] = useState<PassData | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<PassStatus>({ state: "none", pass_type: null, last_updated: null, pass_url: null, serial: null });

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    const { data, error } = await supabase
      .from("wallet_passes")
      .select("pass_type, pass_url, serial_number, last_updated, is_voided")
      .eq(bookingType === "tour" ? "tour_booking_id" : "booking_id", bookingId)
      .eq("booking_type", bookingType)
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("wallet status load failed", error);
    }
    setStatus(computeState(data));
    setStatusLoading(false);
  }, [bookingId, bookingType]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const generate = async (passType: "apple" | "google", forceNew = false) => {
    setLoading(true);
    try {
      // Force-new = bestehenden voiden, damit Edge-Function neuen Pass erzeugt
      if (forceNew) {
        await supabase.from("wallet_passes")
          .update({ is_voided: true })
          .eq(bookingType === "tour" ? "tour_booking_id" : "booking_id", bookingId)
          .eq("booking_type", bookingType);
      }
      const { data, error } = await supabase.functions.invoke("generate-wallet-pass", {
        body: { booking_id: bookingId, ticket_number: ticketNumber, email: customerEmail, pass_type: passType, booking_type: bookingType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.pass_url) throw new Error("Pass konnte nicht erstellt werden");
      setPass({ pass_url: data.pass_url, pass_html: data.pass_html, serial: data.serial, pass_type: passType });
      await loadStatus();
    } catch (e: any) {
      toast.error(e.message || "Wallet-Pass konnte nicht erstellt werden");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    setOpen(true);
    setPass(null);
    const forceNew = status.state === "expired" || status.state === "voided";
    const defaultType: "apple" | "google" =
      (status.pass_type as any) || (isAndroid() ? "google" : "apple");
    await generate(defaultType, forceNew);
  };

  const switchType = async (t: "apple" | "google") => {
    if (pass?.pass_type === t) return;
    await generate(t);
  };

  const copyLink = async () => {
    if (!pass?.pass_url) return;
    await navigator.clipboard.writeText(pass.pass_url);
    setCopied(true);
    toast.success("Link kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  // ---------- Status-Badge & Button-Label ----------
  const renderStatusBadge = () => {
    if (statusLoading) {
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          Pass wird geprüft
        </Badge>
      );
    }
    switch (status.state) {
      case "active":
        return (
          <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/30">
            <CheckCircle2 className="w-3 h-3" />
            Wallet-Pass aktiv
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="gap-1 text-xs bg-accent/10 text-accent border-accent/30">
            <AlertCircle className="w-3 h-3" />
            Pass abgelaufen
          </Badge>
        );
      case "voided":
        return (
          <Badge variant="outline" className="gap-1 text-xs bg-destructive/10 text-destructive border-destructive/30">
            <AlertCircle className="w-3 h-3" />
            Pass ungültig
          </Badge>
        );
      case "none":
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
            <CircleDashed className="w-3 h-3" />
            Noch kein Wallet-Pass
          </Badge>
        );
    }
  };

  const buttonContent = () => {
    if (statusLoading) {
      return <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Pass wird geprüft</>;
    }
    if (status.state === "active") {
      return <><Wallet className="w-4 h-4 mr-2" />Pass anzeigen</>;
    }
    if (status.state === "expired" || status.state === "voided") {
      return <><RefreshCw className="w-4 h-4 mr-2" />Pass neu generieren</>;
    }
    return <><Wallet className="w-4 h-4 mr-2" />Zur Wallet hinzufügen</>;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {renderStatusBadge()}
        {status.state === "active" && status.last_updated && (
          <span className="text-[11px] text-muted-foreground">
            Erstellt am {formatDate(status.last_updated)}
          </span>
        )}
      </div>

      <Button
        variant={variant}
        size={size}
        className={cn("justify-start gap-0 w-full", className)}
        onClick={handleClick}
        disabled={statusLoading}
      >
        {buttonContent()}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Boarding Pass · {ticketNumber}
            </DialogTitle>
            <DialogDescription>
              {status.state === "expired"
                ? "Ihr Pass ist älter als 90 Tage. Wir haben einen neuen erstellt."
                : status.state === "voided"
                ? "Der vorherige Pass wurde ungültig gemacht. Hier ist Ihr neuer Pass."
                : "Speichern Sie Ihr Ticket in Apple Wallet oder Google Wallet – immer griffbereit, auch offline."}
            </DialogDescription>
          </DialogHeader>

          {/* Pass-Type-Switch */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={pass?.pass_type === "apple" ? "default" : "outline"}
              onClick={() => switchType("apple")}
              disabled={loading}
              className="justify-start"
            >
              <Apple className="w-4 h-4 mr-2" />
              Apple Wallet
            </Button>
            <Button
              variant={pass?.pass_type === "google" ? "default" : "outline"}
              onClick={() => switchType("google")}
              disabled={loading}
              className="justify-start"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Google Wallet
            </Button>
          </div>

          {/* Pass-Vorschau */}
          <div className="bg-muted/40 rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : pass ? (
              pass.pass_html ? (
                <iframe
                  srcDoc={pass.pass_html}
                  title="Boarding Pass"
                  className="w-full h-80 border-0 bg-white"
                  sandbox="allow-scripts allow-popups"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground p-6">
                  <Wallet className="w-8 h-8 text-primary" />
                  Pass wurde erstellt. Bitte über den Button unten öffnen.
                </div>
              )
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Pass wird geladen…
              </div>
            )}
          </div>

          {/* Aktionen */}
          {pass && (
            <div className="space-y-2">
              <Button asChild className="w-full" size="lg">
                <a href={pass.pass_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Pass öffnen & speichern
                </a>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 mr-2 text-primary" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Kopiert" : "Link kopieren"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generate(pass.pass_type, true)}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Neu erzeugen
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                {isiOS()
                  ? "📱 iOS: Tippen Sie nach dem Öffnen oben rechts auf „Teilen“ → „Zu Wallet hinzufügen“."
                  : isAndroid()
                  ? "📱 Android: Öffnen Sie den Pass und tippen Sie auf „Zu Google Wallet hinzufügen“."
                  : "💡 Öffnen Sie diesen Link auf Ihrem Smartphone, um den Pass zur Wallet hinzuzufügen."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WalletPassButton;
