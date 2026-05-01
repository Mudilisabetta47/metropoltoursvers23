import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Smartphone, Apple, ExternalLink, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface WalletPassButtonProps {
  bookingId: string;
  ticketNumber: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  className?: string;
  /** Optional: Tour-Buchung statt Bus-Buchung (anderer Backend-Pfad falls später separiert) */
  bookingType?: "bus" | "tour";
}

interface PassData {
  pass_url: string;
  serial: string;
  pass_type: "apple" | "google";
}

const isiOS = () => typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1));

const isAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

export function WalletPassButton({
  bookingId, ticketNumber, variant = "outline", size = "sm", className,
}: WalletPassButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pass, setPass] = useState<PassData | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async (passType: "apple" | "google") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-wallet-pass", {
        body: { booking_id: bookingId, pass_type: passType },
      });
      if (error) throw error;
      if (!data?.pass_url) throw new Error("Pass konnte nicht erstellt werden");
      setPass({ pass_url: data.pass_url, serial: data.serial, pass_type: passType });
    } catch (e: any) {
      toast.error(e.message || "Wallet-Pass konnte nicht erstellt werden");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    setOpen(true);
    setPass(null);
    // Smart default: erstes Format passend zum Gerät
    const defaultType: "apple" | "google" = isAndroid() ? "google" : "apple";
    await generate(defaultType);
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

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Zur Wallet hinzufügen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Boarding Pass · {ticketNumber}
            </DialogTitle>
            <DialogDescription>
              Speichern Sie Ihr Ticket in Apple Wallet oder Google Wallet – immer griffbereit, auch offline.
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
              <iframe
                src={pass.pass_url}
                title="Boarding Pass"
                className="w-full h-72 border-0"
                sandbox="allow-same-origin"
              />
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
              <Button variant="outline" className="w-full" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4 mr-2 text-primary" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Kopiert" : "Link kopieren"}
              </Button>
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
    </>
  );
}

export default WalletPassButton;
