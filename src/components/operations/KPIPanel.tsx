import { useOperationsKPIs } from "@/hooks/useOperations";
import { 
  Bus, Users, CheckCircle, Clock, AlertTriangle, 
  Ticket, Scan, ShieldAlert, TrendingUp, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'good' | 'warning' | 'critical';
  className?: string;
}

const KPICard = ({ icon, label, value, subValue, trend, status, className }: KPICardProps) => {
  const statusColors = {
    good: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  const valueColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  };

  return (
    <div className={cn(
      "p-4 rounded-xl border bg-zinc-900/50 backdrop-blur-sm transition-all hover:bg-zinc-900/80",
      status ? statusColors[status] : 'border-zinc-800',
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          "p-2 rounded-lg",
          status === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
          status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
          status === 'critical' ? 'bg-red-500/20 text-red-400' :
          'bg-zinc-800 text-zinc-400'
        )}>
          {icon}
        </div>
        {trend && (
          <TrendingUp className={cn(
            "w-4 h-4",
            trend === 'up' ? 'text-emerald-400' :
            trend === 'down' ? 'text-red-400 rotate-180' :
            'text-zinc-500'
          )} />
        )}
      </div>
      <div className={cn(
        "text-2xl font-bold mb-0.5",
        status ? valueColors[status] : 'text-white'
      )}>
        {value}
      </div>
      <div className="text-xs text-zinc-400">{label}</div>
      {subValue && (
        <div className="text-[10px] text-zinc-500 mt-1">{subValue}</div>
      )}
    </div>
  );
};

const KPIPanel = () => {
  const { kpis, isLoading, refresh } = useOperationsKPIs();

  const getCheckInStatus = (rate: number): 'good' | 'warning' | 'critical' => {
    if (rate >= 95) return 'good';
    if (rate >= 80) return 'warning';
    return 'critical';
  };

  const getDelayStatus = (delay: number): 'good' | 'warning' | 'critical' => {
    if (delay <= 5) return 'good';
    if (delay <= 15) return 'warning';
    return 'critical';
  };

  const getIncidentStatus = (count: number): 'good' | 'warning' | 'critical' => {
    if (count === 0) return 'good';
    if (count <= 3) return 'warning';
    return 'critical';
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Live Operations KPIs</h2>
          <p className="text-xs text-zinc-500">Auto-refresh every 30 seconds</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refresh}
          disabled={isLoading}
          className="text-zinc-400 hover:text-white"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KPICard
          icon={<Bus className="w-4 h-4" />}
          label="Aktive Fahrten"
          value={kpis.activeTrips}
          subValue="Heute geplant"
          status="good"
        />
        
        <KPICard
          icon={<Users className="w-4 h-4" />}
          label="Mitarbeiter im Dienst"
          value={kpis.activeEmployees}
          subValue="Aktuell aktiv"
          status="good"
        />
        
        <KPICard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Check-in Rate"
          value={`${kpis.checkInRate}%`}
          subValue="Letzte Stunde"
          status={getCheckInStatus(kpis.checkInRate)}
        />
        
        <KPICard
          icon={<Clock className="w-4 h-4" />}
          label="Ø Verspätung"
          value={`${kpis.avgDelay} min`}
          subValue="Durchschnitt aktive Busse"
          status={getDelayStatus(kpis.avgDelay)}
        />
        
        <KPICard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Aktive Störungen"
          value={kpis.activeIncidents}
          subValue="Offen / In Bearbeitung"
          status={getIncidentStatus(kpis.activeIncidents)}
        />
        
        <KPICard
          icon={<Ticket className="w-4 h-4" />}
          label="Buchungen (60 min)"
          value={kpis.bookingsLastHour}
          subValue="Neue Buchungen"
        />
      </div>

      {/* Scanner Stats Row */}
      <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center gap-2 mb-3">
          <Scan className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Ticket Intelligence</span>
          <span className="text-xs text-zinc-500 ml-auto">Letzte 60 Minuten</span>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{kpis.scansPerMinute}</div>
            <div className="text-[10px] text-zinc-500">Scans/min</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-emerald-400">{kpis.validScans}</div>
            <div className="text-[10px] text-zinc-500">Gültig</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">{kpis.invalidScans}</div>
            <div className="text-[10px] text-zinc-500">Ungültig</div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-xl font-bold",
              kpis.fraudSuspected > 0 ? "text-red-400" : "text-zinc-600"
            )}>
              {kpis.fraudSuspected}
            </div>
            <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              {kpis.fraudSuspected > 0 && <ShieldAlert className="w-3 h-3 text-red-400" />}
              Betrugsverdacht
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIPanel;
