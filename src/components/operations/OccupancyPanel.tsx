import { useVehiclePositions } from "@/hooks/useOperations";
import { Bus, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const OccupancyPanel = () => {
  const { vehicles, isLoading } = useVehiclePositions();

  const activeVehicles = vehicles.filter(v => v.status !== 'offline');

  const totalCapacity = activeVehicles.length * 50; // assume 50 seats
  const totalPassengers = activeVehicles.reduce((sum, v) => sum + (v.passenger_count || 0), 0);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0;

  return (
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Auslastung Live</h2>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">{avgOccupancy}% Ø</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        </div>
      ) : activeVehicles.length === 0 ? (
        <div className="flex items-center gap-3 py-2 px-3 bg-[#0c1018] rounded-md">
          <Bus className="w-5 h-5 text-zinc-700 flex-shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Keine aktiven Fahrzeuge</p>
            <p className="text-[10px] text-zinc-700 italic">Fahrzeuge werden automatisch erkannt</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeVehicles.map((v) => {
            const capacity = 50;
            const occupancy = Math.round(((v.passenger_count || 0) / capacity) * 100);
            const barColor = occupancy > 85 ? "bg-red-500" : occupancy > 60 ? "bg-amber-500" : "bg-emerald-500";

            return (
              <div key={v.id} className="p-2 bg-[#0c1018] rounded border border-[#1e2836]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Bus className="w-3 h-3 text-zinc-500" />
                    <span className="text-[11px] font-medium text-white">Bus #{v.bus_id.slice(0, 6)}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold",
                    occupancy > 85 ? "text-red-400" : occupancy > 60 ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {v.passenger_count || 0}/{capacity}
                  </span>
                </div>
                <div className="h-1.5 bg-[#1e2836] rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${Math.min(occupancy, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OccupancyPanel;
