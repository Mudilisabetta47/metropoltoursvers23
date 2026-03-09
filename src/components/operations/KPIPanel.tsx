import { useOperationsKPIs } from "@/hooks/useOperations";
import { 
  Bus, Users, CheckCircle, Clock, AlertTriangle, 
  Ticket, ShieldAlert, RefreshCw, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  emptyText?: string;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  className?: string;
}

const KPICard = ({ icon, label, value, subValue, emptyText, status = 'neutral', className }: KPICardProps) => {
  const isEmpty = value === 0 || value === '0' || value === '0 min' || value === '100%';
  const borderColors = {
    good: 'border-emerald-800/50',
    warning: 'border-amber-700/50',
    critical: 'border-red-700/60 shadow-[0_0_12px_-4px_rgba(239,68,68,0.3)]',
    neutral: 'border-[#1e2836]',
  };
  const iconBg = {
    good: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    critical: 'bg-red-500/10 text-red-400',
    neutral: 'bg-zinc-800/50 text-zinc-400',
  };
  const valueColor = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
    neutral: 'text-white',
  };

  return (
    <div className={cn(
      "p-3 rounded-lg border bg-[#111820] transition-all",
      borderColors[status],
      status === 'critical' && "ring-1 ring-red-500/20",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-1.5 rounded-md", iconBg[status])}>
          {icon}
        </div>
        {status === 'critical' && <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />}
      </div>
      <div className={cn("text-xl font-bold mb-0.5", valueColor[status])}>
        {value}
      </div>
      <div className="text-[11px] text-zinc-500 font-medium">{label}</div>
      {subValue && <div className="text-[10px] text-zinc-600 mt-0.5">{subValue}</div>}
      {isEmpty && emptyText && <div className="text-[10px] text-zinc-600 mt-0.5 italic">{emptyText}</div>}
    </div>
  );
};

const KPIPanel = () => {
  const { kpis, isLoading, refresh } = useOperationsKPIs();

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

  const getCheckInStatus = (rate: number): 'good' | 'warning' | 'critical' => {
    if (rate >= 95) return 'good';
    if (rate >= 80) return 'warning';
    return 'critical';
  };

  // Alert strip
  const hasAlerts = kpis.activeIncidents > 0 || kpis.fraudSuspected > 0;

  return (
    <div className="space-y-3">
      {/* Operations Alert Strip */}
      <div className={cn(
        "px-4 py-2 rounded-lg border flex items-center gap-3",
        hasAlerts
          ? "bg-red-950/30 border-red-800/40"
          : "bg-emerald-950/20 border-emerald-800/30"
      )}>
        {hasAlerts ? (
          <>
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <div className="flex items-center gap-4 text-xs">
              {kpis.activeIncidents > 0 && (
                <span className="text-red-300 font-medium">
                  {kpis.activeIncidents} aktive Störung{kpis.activeIncidents > 1 ? 'en' : ''}
                </span>
              )}
              {kpis.fraudSuspected > 0 && (
                <span className="text-orange-300 font-medium">
                  {kpis.fraudSuspected} Betrugsverdacht
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">Keine kritischen Vorfälle — Betrieb läuft normal</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">Aktualisierung: alle 30 Sek.</span>
          <Button 
            variant="ghost" size="sm"
            onClick={refresh} disabled={isLoading}
            className="text-zinc-500 hover:text-white h-6 px-2"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPI Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Betriebsübersicht</h2>
      </div>

      {/* KPI Cards - Priority sorted: incidents → delay → trips → employees → validation → bookings */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        <KPICard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Aktive Störungen"
          value={kpis.activeIncidents}
          subValue="Offen / In Bearbeitung"
          emptyText="Keine Störungen gemeldet"
          status={getIncidentStatus(kpis.activeIncidents)}
        />
        <KPICard
          icon={<Clock className="w-4 h-4" />}
          label="Ø Verspätung"
          value={`${kpis.avgDelay} min`}
          subValue="Durchschnitt aktive Fahrzeuge"
          emptyText="Alle pünktlich"
          status={getDelayStatus(kpis.avgDelay)}
        />
        <KPICard
          icon={<Bus className="w-4 h-4" />}
          label="Aktive Fahrten"
          value={kpis.activeTrips}
          subValue="Heute geplant"
          emptyText="Keine aktiven Fahrten"
          status={kpis.activeTrips > 0 ? 'good' : 'neutral'}
        />
        <KPICard
          icon={<Users className="w-4 h-4" />}
          label="Personal im Dienst"
          value={kpis.activeEmployees}
          subValue="Aktuell aktiv"
          emptyText="Kein Personal im Dienst"
          status={kpis.activeEmployees > 0 ? 'good' : 'neutral'}
        />
        <KPICard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Validierungsquote"
          value={`${kpis.checkInRate}%`}
          subValue="Erfolgreiche Scans (1h)"
          emptyText="Keine Scans in der letzten Stunde"
          status={getCheckInStatus(kpis.checkInRate)}
        />
        <KPICard
          icon={<Ticket className="w-4 h-4" />}
          label="Neue Buchungen"
          value={kpis.bookingsLastHour}
          subValue="Letzte 60 Minuten"
          emptyText="Keine neuen Buchungen"
          status={kpis.bookingsLastHour > 0 ? 'good' : 'neutral'}
        />
      </div>

      {/* Scan Intelligence Row */}
      <div className="p-3 rounded-lg border border-[#1e2836] bg-[#111820]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-zinc-300">Ticketprüfung</span>
          </div>
          <span className="text-[10px] text-zinc-600">Letzte 60 Minuten</span>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{kpis.scansPerMinute}</div>
            <div className="text-[10px] text-zinc-500">Scans/min</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">{kpis.validScans}</div>
            <div className="text-[10px] text-zinc-500">Gültig</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{kpis.invalidScans}</div>
            <div className="text-[10px] text-zinc-500">Ungültig</div>
          </div>
          <div className="text-center">
            <div className={cn("text-lg font-bold", kpis.fraudSuspected > 0 ? "text-red-400" : "text-zinc-600")}>
              {kpis.fraudSuspected}
            </div>
            <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              {kpis.fraudSuspected > 0 && <ShieldAlert className="w-3 h-3 text-red-400" />}
              Betrugsverdacht
            </div>
          </div>
        </div>

        {kpis.validScans === 0 && kpis.invalidScans === 0 && (
          <div className="text-center text-[10px] text-zinc-600 mt-2 italic">
            Keine Scan-Ereignisse in den letzten 60 Minuten
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIPanel;
