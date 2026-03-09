import { useAuditLogs, useCommandLogs } from "@/hooks/useOperations";
import { 
  FileText, Zap, AlertCircle, CheckCircle, 
  Database, User, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const LogsPanel = () => {
  const { logs: auditLogs, isLoading: auditLoading } = useAuditLogs(30);
  const { logs: commandLogs, isLoading: commandLoading } = useCommandLogs(30);

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('INSERT')) return <CheckCircle className="w-3 h-3 text-emerald-400" />;
    if (action.includes('UPDATE') || action.includes('EDIT')) return <RefreshCw className="w-3 h-3 text-blue-400" />;
    if (action.includes('DELETE') || action.includes('REMOVE')) return <AlertCircle className="w-3 h-3 text-red-400" />;
    if (action.includes('REVEAL') || action.includes('VIEW')) return <User className="w-3 h-3 text-purple-400" />;
    return <Database className="w-3 h-3 text-zinc-400" />;
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success': return <Badge className="text-[9px] px-1 py-0 bg-emerald-500/20 text-emerald-400">OK</Badge>;
      case 'failed': return <Badge className="text-[9px] px-1 py-0 bg-red-500/20 text-red-400">Fehler</Badge>;
      default: return <Badge className="text-[9px] px-1 py-0 bg-zinc-500/20 text-zinc-400">{result}</Badge>;
    }
  };

  // Command type translations
  const cmdLabels: Record<string, string> = {
    CANCEL_TRIP: 'Fahrt storniert',
    REPORT_DELAY: 'Verspätung gemeldet',
    REASSIGN_DRIVER: 'Fahrer zugewiesen',
    SEND_NOTIFICATION: 'Nachricht gesendet',
    EMERGENCY_STOP: 'Notfall-Stopp',
    ROUTE_CHANGE: 'Route geändert',
    CAPACITY_ALERT: 'Kapazitäts-Alert',
    VEHICLE_OFFLINE: 'Fahrzeug gesperrt',
    SYSTEM_REFRESH: 'System-Sync',
  };

  return (
    <div className="p-4 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-zinc-500" />
        <h2 className="text-sm font-semibold text-zinc-300">Protokolle & Audit</h2>
      </div>

      <Tabs defaultValue="commands" className="w-full">
        <TabsList className="w-full bg-[#0c1018] border border-[#1e2836] h-8">
          <TabsTrigger value="commands" className="flex-1 text-xs data-[state=active]:bg-[#1a2232]">
            <Zap className="w-3 h-3 mr-1" /> Maßnahmen
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 text-xs data-[state=active]:bg-[#1a2232]">
            <Database className="w-3 h-3 mr-1" /> Audit-Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commands" className="mt-3">
          {commandLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
            </div>
          ) : commandLogs.length === 0 ? (
            <div className="text-center py-6">
              <Zap className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
              <p className="text-xs text-zinc-600">Keine Maßnahmen protokolliert</p>
              <p className="text-[10px] text-zinc-700 mt-1 italic">Maßnahmen werden hier chronologisch erfasst</p>
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1e2836] hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Zeit</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Maßnahme</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Ziel</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commandLogs.map((log, i) => (
                    <TableRow key={log.id} className={cn("border-[#1e2836]", i % 2 === 0 && "bg-[#0c1018]/50")}>
                      <TableCell className="text-zinc-500 text-[11px] py-1.5 px-2 font-mono">
                        {format(new Date(log.created_at), 'dd.MM. HH:mm')}
                      </TableCell>
                      <TableCell className="text-white text-[11px] py-1.5 px-2">
                        {cmdLabels[log.command_type] || log.command_type}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-[11px] py-1.5 px-2">
                        {log.target_type || '—'}
                      </TableCell>
                      <TableCell className="py-1.5 px-2">{getResultBadge(log.result)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-3">
          {auditLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-6">
              <Database className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
              <p className="text-xs text-zinc-600">Keine Audit-Einträge vorhanden</p>
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1e2836] hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Zeit</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Aktion</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Tabelle</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] h-7 px-2">Benutzer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, i) => (
                    <TableRow key={log.id} className={cn("border-[#1e2836]", i % 2 === 0 && "bg-[#0c1018]/50")}>
                      <TableCell className="text-zinc-500 text-[11px] py-1.5 px-2 font-mono">
                        {format(new Date(log.created_at), 'dd.MM. HH:mm')}
                      </TableCell>
                      <TableCell className="py-1.5 px-2">
                        <div className="flex items-center gap-1.5">
                          {getActionIcon(log.action)}
                          <span className="text-white text-[11px]">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 px-2">
                        <Badge className="text-[9px] px-1 py-0 bg-[#1a2232] text-zinc-400">{log.table_name}</Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-[11px] py-1.5 px-2">
                        {log.user_id.slice(0, 8)}…
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogsPanel;
