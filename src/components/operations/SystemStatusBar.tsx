import { useSystemStatus } from "@/hooks/useOperations";
import { 
  Activity, WifiOff, AlertTriangle, CheckCircle2, 
  Clock, Zap, RefreshCw, Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SystemStatusBar = () => {
  const { services, overallStatus, isLoading } = useSystemStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400';
      case 'degraded': return 'text-amber-400';
      case 'offline': return 'text-red-500';
      case 'maintenance': return 'text-blue-400';
      default: return 'text-zinc-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="w-3 h-3" />;
      case 'degraded': return <AlertTriangle className="w-3 h-3" />;
      case 'offline': return <WifiOff className="w-3 h-3" />;
      case 'maintenance': return <RefreshCw className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'online';
      case 'degraded': return 'eingeschränkt';
      case 'offline': return 'offline';
      case 'maintenance': return 'Wartung';
      default: return status;
    }
  };

  const overallStatusConfig = {
    online: { label: 'BETRIEB NORMAL', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    degraded: { label: 'EINSCHRÄNKUNGEN', color: 'bg-amber-500', textColor: 'text-amber-400' },
    incident: { label: 'STÖRUNG AKTIV', color: 'bg-red-500', textColor: 'text-red-400' },
  };

  const config = overallStatusConfig[overallStatus];
  const avgLatency = services.length > 0 
    ? Math.round(services.reduce((acc, s) => acc + s.latency_ms, 0) / services.length)
    : 0;
  const onlineCount = services.filter(s => s.status === 'online').length;

  // Service name translations
  const serviceNameMap: Record<string, string> = {
    api: 'API',
    booking: 'Buchung',
    database: 'Datenbank',
    notifications: 'Benachrichtigungen',
    scanner: 'Scanner',
    tracking: 'Ortung',
    payment: 'Zahlung',
  };

  return (
    <div className="bg-[#0c1018] border-b border-[#1a2232] px-4 py-1.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: System status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", config.color, overallStatus !== 'online' && "animate-pulse")} />
            <span className={cn("text-[11px] font-bold tracking-wider", config.textColor)}>
              {config.label}
            </span>
          </div>
          <div className="h-3 w-px bg-[#1a2232]" />
          <span className="text-[11px] text-zinc-500">{onlineCount}/{services.length} Dienste</span>
        </div>

        {/* Center: Service pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
              <RefreshCw className="w-3 h-3 animate-spin" /> Laden...
            </div>
          ) : (
            services.slice(0, 6).map((service) => (
              <div 
                key={service.id}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-[10px]",
                  service.status === 'online' 
                    ? "bg-[#111820] border border-[#1a2838] text-zinc-400" 
                    : service.status === 'degraded'
                      ? "bg-amber-950/30 border border-amber-800/30 text-amber-400"
                      : "bg-red-950/30 border border-red-800/30 text-red-400"
                )}
              >
                <span className={getStatusColor(service.status)}>{getStatusIcon(service.status)}</span>
                <span className="font-medium">{serviceNameMap[service.service_name.toLowerCase()] || service.service_name}</span>
                <span className="text-zinc-600">—</span>
                <span className={getStatusColor(service.status)}>{getStatusLabel(service.status)}</span>
                <span className="text-zinc-600">—</span>
                <span className="text-zinc-500">{service.latency_ms} ms</span>
              </div>
            ))
          )}
        </div>

        {/* Right: Performance */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-zinc-500">
            <Zap className="w-3 h-3 text-zinc-600" />
            <span>Ø {avgLatency} ms</span>
          </div>
          <div className="h-3 w-px bg-[#1a2232]" />
          <div className="flex items-center gap-1 text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>Datenstand: {format(new Date(), 'HH:mm:ss')}</span>
          </div>
          <div className="h-3 w-px bg-[#1a2232]" />
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-400 text-[10px] font-medium">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusBar;
