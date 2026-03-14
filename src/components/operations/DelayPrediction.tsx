import { useVehiclePositions } from "@/hooks/useOperations";
import { Brain, TrendingDown, TrendingUp, Minus, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const DelayPrediction = () => {
  const { vehicles, isLoading } = useVehiclePositions();

  const activeVehicles = vehicles.filter(v => v.status !== 'offline' && v.trip_id);

  // Simple prediction based on current delay trends
  const predictions = activeVehicles.map(v => {
    const currentDelay = v.delay_minutes || 0;
    const speed = v.speed_kmh || 0;

    // Heuristic: if speed is low and delay is growing, predict more delay
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    let predictedDelay = currentDelay;

    if (speed < 20 && currentDelay > 5) {
      trend = 'worsening';
      predictedDelay = Math.round(currentDelay * 1.3);
    } else if (speed > 60 && currentDelay > 0) {
      trend = 'improving';
      predictedDelay = Math.max(0, Math.round(currentDelay * 0.7));
    }

    return {
      ...v,
      trend,
      predictedDelay,
      confidence: speed > 0 ? 'high' : 'low',
    };
  });

  const delayedCount = predictions.filter(p => (p.delay_minutes || 0) > 5).length;

  return (
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Verspätungsprognose</h2>
        </div>
        {delayedCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
            {delayedCount} verzögert
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-3">
          <Brain className="w-5 h-5 mx-auto mb-1 text-zinc-700" />
          <p className="text-[10px] text-zinc-600">Keine aktiven Fahrten für Prognose</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {predictions.map((p) => {
            const currentDelay = p.delay_minutes || 0;
            const trendIcon = p.trend === 'improving' 
              ? <TrendingDown className="w-3 h-3 text-emerald-400" />
              : p.trend === 'worsening'
              ? <TrendingUp className="w-3 h-3 text-red-400" />
              : <Minus className="w-3 h-3 text-zinc-500" />;

            return (
              <div key={p.id} className={cn(
                "p-2 rounded border",
                currentDelay > 15 ? "bg-red-500/5 border-red-500/20"
                  : currentDelay > 5 ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-[#0c1018] border-[#1e2836]"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-white">Bus #{p.bus_id.slice(0, 6)}</span>
                  <div className="flex items-center gap-1.5">
                    {trendIcon}
                    <span className={cn(
                      "text-[10px] font-bold",
                      currentDelay > 15 ? "text-red-400" : currentDelay > 5 ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {currentDelay > 0 ? `+${currentDelay} min` : "Pünktlich"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-zinc-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{p.speed_kmh} km/h</span>
                  </div>
                  {p.predictedDelay !== currentDelay && (
                    <span className={cn(
                      "flex items-center gap-0.5",
                      p.trend === 'improving' ? "text-emerald-400" : "text-red-400"
                    )}>
                      <Clock className="w-2.5 h-2.5" />
                      Prognose: {p.predictedDelay > 0 ? `+${p.predictedDelay} min` : "pünktlich"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DelayPrediction;
