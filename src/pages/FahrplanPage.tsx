import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Bus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import BoardingSchedule, { type BoardingStop } from "@/components/schedule/BoardingSchedule";
import { setPageSeo } from "@/lib/seo";

interface TripRow {
  id: string;
  title: string | null;
  departure_date: string;
  departure_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  stops: BoardingStop[];
  tripUid?: string | null;
}

/** Öffentlicher Fahrplan: alle kommenden Fahrten mit Zustiegsorten, Abfahrtszeiten und Steig. */
export default function FahrplanPage() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageSeo?.({
      title: "Fahrplan & Zustiegsorte | METROPOL TOURS",
      description:
        "Alle Abfahrtszeiten und Zustiegsorte unserer Busreisen – inklusive Steig-Angaben (z. B. Bremen ZOB Steig 5) und Live-Tracking.",
      path: "/fahrplan",
    });
  }, []);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: tripRows } = await supabase
        .from("trips")
        .select("id, title, departure_date, departure_time, arrival_date, arrival_time")
        .gte("departure_date", today)
        .order("departure_date")
        .limit(20);

      const ids = (tripRows ?? []).map((t) => t.id);
      if (ids.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      const [{ data: stopRows }, { data: registryRows }] = await Promise.all([
        supabase
          .from("trip_schedule_stops")
          .select("id, trip_id, label, location, stop_type, planned_arrival, planned_departure, notes, sort_order")
          .in("trip_id", ids)
          .order("sort_order"),
        supabase.from("trip_registry").select("trip_uid, source_id").in("source_id", ids),
      ]);

      setTrips(
        (tripRows ?? []).map((t) => ({
          ...t,
          stops: (stopRows ?? []).filter((s: any) => s.trip_id === t.id) as BoardingStop[],
          tripUid: (registryRows ?? []).find((r: any) => r.source_id === t.id)?.trip_uid ?? null,
        })),
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="h-2 bg-emerald-500" />
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/"><Logo className="h-8" /></Link>
          <Link to="/verfolge">
            <Button variant="outline" size="sm"><Radio className="w-4 h-4 mr-1" />Bus live verfolgen</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Fahrplan & Zustiegsorte</h1>
          <p className="text-zinc-600 mt-2">
            Hier finden Sie alle Abfahrtszeiten und Zustiegsorte. Am <strong>Bremen ZOB</strong> fahren wir ab{" "}
            <strong>Steig 5</strong>.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : trips.length === 0 ? (
          <p className="text-zinc-500">Aktuell ist kein Fahrplan veröffentlicht.</p>
        ) : (
          trips.map((t) => (
            <article key={t.id} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-emerald-600" />
                    {t.title || "Busreise"}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Abfahrt {format(new Date(`${t.departure_date}T00:00:00`), "EEEE, dd.MM.yyyy", { locale: de })}
                    {t.departure_time && ` · ${t.departure_time.slice(0, 5)} Uhr`}
                    {t.arrival_date &&
                      ` · Rückkehr ${format(new Date(`${t.arrival_date}T00:00:00`), "dd.MM.yyyy", { locale: de })}`}
                  </p>
                </div>
                {t.tripUid && (
                  <Link to={`/verfolge/${t.tripUid}`}>
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                      <Radio className="w-4 h-4 mr-1" />Live verfolgen
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-5">
                <BoardingSchedule stops={t.stops} />
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
