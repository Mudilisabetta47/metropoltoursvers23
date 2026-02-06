import { useScannerEvents } from "@/hooks/useOperations";
import { 
  Scan, CheckCircle, AlertCircle, Ban, ShieldAlert, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const ScannerPanel = () => {
  const { events, stats, isLoading } = useScannerEvents(100);

  const getResultConfig = (result: string) => {
    switch (result) {
      case 'valid':
        return { 
          icon: <CheckCircle className="w-4 h-4" />, 
          color: 'text-emerald-400', 
          bg: 'bg-emerald-500/20',
          label: 'Gültig'
        };
      case 'invalid':
        return { 
          icon: <AlertCircle className="w-4 h-4" />, 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/20',
          label: 'Ungültig'
        };
      case 'expired':
        return { 
          icon: <Clock className="w-4 h-4" />, 
          color: 'text-zinc-400', 
          bg: 'bg-zinc-500/20',
          label: 'Abgelaufen'
        };
      case 'duplicate':
        return { 
          icon: <Ban className="w-4 h-4" />, 
          color: 'text-orange-400', 
          bg: 'bg-orange-500/20',
          label: 'Duplikat'
        };
      case 'fraud_suspected':
        return { 
          icon: <ShieldAlert className="w-4 h-4" />, 
          color: 'text-red-400', 
          bg: 'bg-red-500/20',
          label: 'Betrug!'
        };
      default:
        return { 
          icon: <Scan className="w-4 h-4" />, 
          color: 'text-zinc-400', 
          bg: 'bg-zinc-500/20',
          label: result
        };
    }
  };

  const getScanTypeLabel = (type: string) => {
    switch (type) {
      case 'check_in': return 'Check-In';
      case 'check_out': return 'Check-Out';
      case 'verification': return 'Kontrolle';
      default: return type;
    }
  };

  // Calculate rate percentages
  const validRate = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 100;

  return (
    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-white">Scanner Activity</h2>
        </div>
        <Badge className="bg-primary/20 text-primary">
          Live Feed
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-zinc-500">Gesamt (1h)</div>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-lg text-center border border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-400">{validRate}%</div>
          <div className="text-xs text-zinc-500">Gültig</div>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-lg text-center border border-amber-500/20">
          <div className="text-2xl font-bold text-amber-400">{stats.invalid}</div>
          <div className="text-xs text-zinc-500">Ungültig</div>
        </div>
        <div className={cn(
          "p-3 rounded-lg text-center border",
          stats.fraud > 0 
            ? "bg-red-500/10 border-red-500/20" 
            : "bg-zinc-800/50 border-zinc-700/50"
        )}>
          <div className={cn(
            "text-2xl font-bold",
            stats.fraud > 0 ? "text-red-400" : "text-zinc-600"
          )}>
            {stats.fraud}
          </div>
          <div className="text-xs text-zinc-500 flex items-center justify-center gap-1">
            {stats.fraud > 0 && <ShieldAlert className="w-3 h-3 text-red-400" />}
            Betrug
          </div>
        </div>
      </div>

      {/* Event Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <Scan className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p className="text-sm">Keine Scan-Events in der letzten Stunde</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {events.slice(0, 20).map((event) => {
            const resultConfig = getResultConfig(event.result);
            
            return (
              <div 
                key={event.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  event.result === 'fraud_suspected' 
                    ? "bg-red-500/10 border-red-500/30 animate-pulse" 
                    : "bg-zinc-800/50 border-zinc-700/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-md", resultConfig.bg, resultConfig.color)}>
                      {resultConfig.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {event.ticket_number || 'Unbekanntes Ticket'}
                        </span>
                        <Badge className={cn("text-[10px] px-1.5 py-0", resultConfig.bg, resultConfig.color)}>
                          {resultConfig.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {getScanTypeLabel(event.scan_type)} • Scanner #{event.scanner_user_id.slice(0, 6)}
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: de })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScannerPanel;
