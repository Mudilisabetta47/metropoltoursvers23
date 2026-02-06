import { useSystemStatus } from "@/hooks/useOperations";
import { 
  Activity, Wifi, WifiOff, AlertTriangle, CheckCircle2, 
  Clock, Zap, RefreshCw 
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

  const overallStatusConfig = {
    online: { label: 'ONLINE', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    degraded: { label: 'DEGRADED', color: 'bg-amber-500', textColor: 'text-amber-400' },
    incident: { label: 'INCIDENT', color: 'bg-red-500', textColor: 'text-red-400' },
  };

  const config = overallStatusConfig[overallStatus];
  const avgLatency = services.length > 0 
    ? Math.round(services.reduce((acc, s) => acc + s.latency_ms, 0) / services.length)
    : 0;

  return (
    <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        {/* Overall Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", config.color)} />
            <span className={cn("text-xs font-bold tracking-wider", config.textColor)}>
              {config.label}
            </span>
          </div>
          
          <div className="h-4 w-px bg-zinc-700" />
          
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
            <Activity className="w-3 h-3" />
            <span>{services.filter(s => s.status === 'online').length}/{services.length} Services</span>
          </div>
        </div>

        {/* Service Status Pills */}
        <div className="hidden lg:flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading...
            </div>
          ) : (
            services.slice(0, 6).map((service) => (
              <div 
                key={service.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/50"
              >
                <span className={getStatusColor(service.status)}>
                  {getStatusIcon(service.status)}
                </span>
                <span className="text-xs text-zinc-300 capitalize">{service.service_name}</span>
                <span className="text-[10px] text-zinc-500">{service.latency_ms}ms</span>
              </div>
            ))
          )}
        </div>

        {/* Right side metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Avg Latency: <span className="text-zinc-200">{avgLatency}ms</span></span>
          </div>
          
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3 h-3" />
            <span>Last Sync: <span className="text-zinc-200">{format(new Date(), 'HH:mm:ss')}</span></span>
          </div>
          
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-medium">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusBar;
