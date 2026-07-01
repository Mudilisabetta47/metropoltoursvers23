import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Search, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  tripNumber: z
    .string()
    .trim()
    .min(1, { message: "Bitte gib deine Fahrtnummer ein." })
    .regex(/^(MT-\d{4}-[A-Z0-9]{6,}|[0-9]{6,15})$/i, {
      message: "Ungültige Fahrtnummer. Erwartet z.B. MT-2026-ABC123 oder 6–15 Ziffern.",
    }),
});

type FieldErrors = Partial<Record<"tripNumber" | "form", string>>;

const TrackTripLandingPage = () => {
  const [tripNumber, setTripNumber] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sanitize = (v: string) =>
    v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = formSchema.safeParse({ tripNumber });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "tripNumber";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const value = parsed.data.tripNumber.toUpperCase();
    setLoading(true);
    try {
      let found = false;

      if (/^MT-/i.test(value)) {
        const { data } = await supabase
          .from("trip_registry")
          .select("trip_uid")
          .eq("trip_uid", value)
          .maybeSingle();
        found = !!data;
      } else {
        const { data } = await supabase
          .from("line_trips")
          .select("id")
          .eq("trip_number", value)
          .maybeSingle();
        found = !!data;
      }

      if (!found) {
        setErrors({
          form: "Diese Fahrtnummer wurde nicht gefunden. Bitte prüfe deine Buchungsbestätigung.",
        });
        return;
      }

      navigate(`/verfolge/${encodeURIComponent(value)}`);
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
              Gib deine Fahrtnummer ein, um den Live-Standort deines Busses zu sehen.
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
                    setTripNumber(sanitize(e.target.value));
                    if (errors.tripNumber || errors.form) setErrors({});
                  }}
                  placeholder="z.B. MT-2026-ABC123"
                  inputMode="text"
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
                    Format MT-JJJJ-XXXXXX oder 6–15 Ziffern. Steht auf deinem Ticket oder in der Buchungsbestätigung.
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
                disabled={loading || tripNumber.length === 0}
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
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackTripLandingPage;
