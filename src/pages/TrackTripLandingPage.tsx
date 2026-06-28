import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Search, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  tripNumber: z
    .string()
    .trim()
    .min(1, { message: "Bitte gib deine Fahrtnummer ein." })
    .regex(/^[0-9]{6,15}$/, {
      message: "Ungültige Fahrtnummer. Erwartet werden 6–15 Ziffern (z.B. 2434219419).",
    }),
  postalCode: z
    .string()
    .trim()
    .min(1, { message: "Bitte gib die Postleitzahl deines Abfahrtsorts ein." })
    .regex(/^[0-9]{5}$/, {
      message: "Ungültige Postleitzahl. Eine deutsche PLZ besteht aus genau 5 Ziffern.",
    }),
});

type FieldErrors = Partial<Record<"tripNumber" | "postalCode" | "form", string>>;

const TrackTripLandingPage = () => {
  const [tripNumber, setTripNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = formSchema.safeParse({ tripNumber, postalCode });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "tripNumber" | "postalCode";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("verify_line_trip_access", {
        p_trip_number: parsed.data.tripNumber,
        p_postal_code: parsed.data.postalCode,
      });

      if (error) {
        setErrors({ form: "Überprüfung fehlgeschlagen. Bitte versuche es gleich erneut." });
        return;
      }

      if (!data) {
        setErrors({
          form: "Fahrtnummer und Postleitzahl passen nicht zusammen. Bitte prüfe deine Buchungsbestätigung.",
        });
        return;
      }

      // Mark this trip as verified for the detail page
      try {
        sessionStorage.setItem(`verfolge:verified:${data}`, "1");
      } catch {
        // Ignore storage errors (e.g. private mode)
      }
      navigate(`/verfolge/${encodeURIComponent(data)}`);
    } catch {
      setErrors({ form: "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Fahrt verfolgen</h1>
            <p className="text-muted-foreground">
              Zum Schutz deiner Privatsphäre brauchen wir die Fahrtnummer{" "}
              <span className="font-medium text-foreground">und</span> die Postleitzahl deines
              Abfahrtsorts.
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div className="space-y-2">
                <label htmlFor="trip-number" className="text-sm font-medium">
                  Fahrtnummer
                </label>
                <Input
                  id="trip-number"
                  value={tripNumber}
                  onChange={(e) => {
                    setTripNumber(onlyDigits(e.target.value, 15));
                    if (errors.tripNumber || errors.form) setErrors({});
                  }}
                  placeholder="z.B. 2434219419"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={!!errors.tripNumber}
                  aria-describedby={errors.tripNumber ? "trip-error" : "trip-hint"}
                  className={cn(
                    "h-12 text-base tracking-wider",
                    errors.tripNumber && "border-destructive focus-visible:ring-destructive",
                  )}
                  disabled={loading}
                />
                {errors.tripNumber ? (
                  <p id="trip-error" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.tripNumber}
                  </p>
                ) : (
                  <p id="trip-hint" className="text-xs text-muted-foreground">
                    6–15 Ziffern. Steht auf deinem Ticket oder in der Buchungsbestätigung.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="postal-code" className="text-sm font-medium">
                  PLZ Abfahrtsort
                </label>
                <Input
                  id="postal-code"
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(onlyDigits(e.target.value, 5));
                    if (errors.postalCode || errors.form) setErrors({});
                  }}
                  placeholder="z.B. 30159"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  aria-invalid={!!errors.postalCode}
                  aria-describedby={errors.postalCode ? "plz-error" : "plz-hint"}
                  className={cn(
                    "h-12 text-base tracking-wider max-w-[180px]",
                    errors.postalCode && "border-destructive focus-visible:ring-destructive",
                  )}
                  disabled={loading}
                />
                {errors.postalCode ? (
                  <p id="plz-error" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.postalCode}
                  </p>
                ) : (
                  <p id="plz-hint" className="text-xs text-muted-foreground">
                    Genau 5 Ziffern. PLZ der Stadt, in der deine Fahrt startet.
                  </p>
                )}
              </div>

              {errors.form && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="gap-2 h-12"
                disabled={loading || tripNumber.length === 0 || postalCode.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Überprüfe…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Fahrt verfolgen
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Diese zwei Angaben stellen sicher, dass nur Fahrgäste den Live-Standort sehen
                  können.
                </span>
              </div>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackTripLandingPage;
