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

const tripNumberSchema = z
  .string()
  .trim()
  .min(1, { message: "Bitte gib eine Fahrtnummer ein." })
  .max(20, { message: "Die Fahrtnummer ist zu lang (max. 20 Zeichen)." })
  .regex(/^[0-9]{6,15}$/, {
    message: "Ungültiges Format. Eine Fahrtnummer besteht aus 6–15 Ziffern (z.B. 2434219419).",
  });

const TrackTripLandingPage = () => {
  const [tripNumber, setTripNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Erlaube nur Ziffern bei der Eingabe für eine bessere UX
    const value = e.target.value.replace(/\D/g, "").slice(0, 20);
    setTripNumber(value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = tripNumberSchema.safeParse(tripNumber);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ungültige Fahrtnummer.");
      return;
    }

    const normalized = parsed.data;
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from("line_trips")
        .select("trip_number")
        .eq("trip_number", normalized)
        .maybeSingle();

      if (dbError) {
        setError("Suche fehlgeschlagen. Bitte versuche es gleich erneut.");
        return;
      }

      if (!data) {
        setError(
          `Keine Fahrt mit der Nummer „${normalized}“ gefunden. Bitte prüfe deine Buchungsbestätigung.`,
        );
        return;
      }

      navigate(`/verfolge/${encodeURIComponent(normalized)}`);
    } catch {
      setError("Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung.");
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
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="trip-number" className="sr-only">
                    Fahrtnummer
                  </label>
                  <Input
                    id="trip-number"
                    value={tripNumber}
                    onChange={handleChange}
                    placeholder="z.B. 2434219419"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-invalid={!!error}
                    aria-describedby={error ? "trip-error" : "trip-hint"}
                    className={cn(
                      "h-12 text-base tracking-wider",
                      error && "border-destructive focus-visible:ring-destructive",
                    )}
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="gap-2"
                  disabled={loading || tripNumber.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Suche…
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Verfolgen
                    </>
                  )}
                </Button>
              </div>

              {error ? (
                <div
                  id="trip-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <p id="trip-hint" className="text-xs text-muted-foreground">
                  Die Fahrtnummer findest du in deiner Buchungsbestätigung oder auf deinem Ticket
                  (6–15 Ziffern).
                </p>
              )}
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackTripLandingPage;
