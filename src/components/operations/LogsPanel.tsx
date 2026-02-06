import { useAuditLogs, useCommandLogs } from "@/hooks/useOperations";
import { 
  FileText, Zap, AlertCircle, CheckCircle, 
  Clock, Database, User, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

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

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success': return 'text-emerald-400 bg-emerald-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      case 'pending': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-zinc-400 bg-zinc-500/20';
    }
  };

  return (
    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Audit & Logs</h2>
      </div>

      <Tabs defaultValue="commands" className="w-full">
        <TabsList className="w-full bg-zinc-800 border-zinc-700">
          <TabsTrigger value="commands" className="flex-1">
            <Zap className="w-4 h-4 mr-2" />
            Commands
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex-1">
            <Database className="w-4 h-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commands" className="mt-4">
          {commandLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : commandLogs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Zap className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm">Keine Befehle protokolliert</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {commandLogs.map((log) => (
                <div 
                  key={log.id}
                  className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-white">{log.command_type}</span>
                    </div>
                    <Badge className={cn("text-[10px] px-1.5 py-0", getResultColor(log.result))}>
                      {log.result}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    {log.target_type && (
                      <span>Target: {log.target_type}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: de })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm">Keine Audit-Logs vorhanden</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div 
                  key={log.id}
                  className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-sm font-medium text-white">{log.action}</span>
                    </div>
                    <Badge className="text-[10px] px-1.5 py-0 bg-zinc-700 text-zinc-300">
                      {log.table_name}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.user_id.slice(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: de })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogsPanel;
