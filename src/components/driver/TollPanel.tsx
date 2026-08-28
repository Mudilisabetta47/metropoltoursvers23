import { Coins, Info } from "lucide-react";
import { OrderToll } from "@/hooks/useOrderStops";
import { Badge } from "@/components/ui/badge";

interface Props {
  tolls: OrderToll[];
  dataAvailable: boolean | null;
}

const currency = (value: number, code: string | null) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: code || "EUR" }).format(value);

/** Mautabschnitte der berechneten Route. Es werden nur Provider-Daten angezeigt. */
const TollPanel = ({ tolls, dataAvailable }: Props) => {
  const cost = tolls.find((t) => t.expected_cost != null);

  return (
    <div className="space-y-3">
      {cost && (
        <div className="rounded-xl bg-emerald-500/10 p-4 flex items-center gap-3">
          <Coins className="w-7 h-7 text-emerald-400" />
          <div>
            <p className="text-xs text-zinc-400">Mautkosten laut Routenanbieter</p>
            <p className="text-xl font-bold text-white">
              {currency(Number(cost.expected_cost), cost.currency)}
            </p>
            {cost.requires_transponder && (
              <p className="text-xs text-zinc-400">Elektronische Mautbox erforderlich</p>
            )}
          </div>
        </div>
      )}

      {tolls.length === 0 ? (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-400 flex gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          {dataAvailable === false
            ? "Für diese Route liefert der Routenanbieter keine Mautinformationen. Bitte Mautvorgaben der Disposition beachten."
            : "Auf der berechneten Route wurden keine mautpflichtigen Abschnitte gefunden."}
        </div>
      ) : (
        <div className="space-y-2">
          {tolls.map((t) => (
            <div
              key={t.id}
              className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{t.name}</p>
                <p className="text-xs text-zinc-400">
                  ab km {Number(t.distance_from_start_km ?? 0).toFixed(1)}
                </p>
              </div>
              {t.country_code && (
                <Badge className="bg-zinc-800 text-zinc-300">{t.country_code}</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-zinc-500">
        Angaben stammen aus der Routenberechnung und sind Richtwerte – die tatsächliche Maut kann je
        nach Fahrzeugklasse, Achszahl und Emissionsklasse abweichen.
      </p>
    </div>
  );
};

export default TollPanel;
