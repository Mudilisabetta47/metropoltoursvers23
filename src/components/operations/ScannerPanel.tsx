import { useScannerEvents } from "@/hooks/useOperations";
import { 
  Scan, CheckCircle, AlertCircle, Ban, ShieldAlert, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const ScannerPanel = () => {
  const { events, stats, isLoading } = useScannerEvents(100);

  const getResultConfig = (result: string) => {
    switch (result) {
      case 'valid': return { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Gültig' };
      case 'invalid': return { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Ungültig' };
      case 'expired': return { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Abgelaufen' };
      case 'duplicate': return { icon: <Ban className="w-3.5 h-3.5" />, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Duplikat' };
      case 'fraud_suspected': return { icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Betrug!' };
      default: return { icon: <Scan className="w-3.5 h-3.5" />, color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: result };
    }
  };

  const getScanTypeLabel = (type: string) => {
    switch (type) {
      case 'check_in': return 'Einstieg';
      case 'check_out': return 'Ausstieg';
      case 'verification': return 'Kontrolle';
      default: return type;
    }
  };

  const validRate = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 100;

  return (
    <div className="p-4 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scan className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Scanner-Aktivität</h2>
        </div>
        <span className="text-[10px] text-zinc-600">Letzte 60 Minuten</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="p-2 bg-[#0c1018] rounded text-center">
          <div className="text-lg font-bold text-white">{stats.total}</div>
          <div className="text-[10px] text-zinc-500">Gesamt</div>
        </div>
        <div className="p-2 bg-emerald-950/20 rounded text-center border border-emerald-800/20">
          <div className="text-lg font-bold text-emerald-400">{validRate}%</div>
          <div className="text-[10px] text-zinc-500">Gültig</div>
        </div>
        <div className="p-2 bg-amber-950/20 rounded text-center border border-amber-800/20">
          <div className="text-lg font-bold text-amber-400">{stats.invalid}</div>
          <div className="text-[10px] text-zinc-500">Ungültig</div>
        </div>
        <div className={cn(
          "p-2 rounded text-center border",
          stats.fraud > 0 ? "bg-red-950/20 border-red-800/20" : "bg-[#0c1018] border-transparent"
        )}>
          <div className={cn("text-lg font-bold", stats.fraud > 0 ? "text-red-400" : "text-zinc-600")}>{stats.fraud}</div>
          <div className="text-[10px] text-zinc-500">Betrug</div>
        </div>
      </div>

      {/* Event Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-6">
          <Scan className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
          <p className="text-xs text-zinc-600">Keine Scan-Ereignisse in der letzten Stunde</p>
          <p className="text-[10px] text-zinc-700 mt-1 italic">Letzte Aktivität wird automatisch angezeigt</p>
        </div>
      ) : (
        <div className="max-h-[280px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1e2836] hover:bg-transparent">
                <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Zeit</TableHead>
                <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Ticket</TableHead>
                <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Art</TableHead>
                <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Gerät</TableHead>
                <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Ergebnis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 15).map((event, i) => {
                const resultConfig = getResultConfig(event.result);
                return (
                  <TableRow 
                    key={event.id}
                    className={cn(
                      "border-[#1e2836]",
                      event.result === 'fraud_suspected' && "bg-red-950/20",
                      i % 2 === 0 && event.result !== 'fraud_suspected' && "bg-[#0c1018]/50"
                    )}
                  >
                    <TableCell className="text-zinc-400 text-[11px] py-1.5 px-2 font-mono">
                      {format(new Date(event.created_at), 'HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-white text-[11px] py-1.5 px-2 font-mono">
                      {event.ticket_number ? event.ticket_number.slice(-8) : '—'}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-[11px] py-1.5 px-2">
                      {getScanTypeLabel(event.scan_type)}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-[11px] py-1.5 px-2">
                      #{event.scanner_user_id.slice(0, 6)}
                    </TableCell>
                    <TableCell className="py-1.5 px-2">
                      <Badge className={cn("text-[9px] px-1 py-0", resultConfig.bg, resultConfig.color)}>
                        {resultConfig.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ScannerPanel;
