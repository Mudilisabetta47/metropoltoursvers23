import { useState } from "react";
import { useIncidents, Incident } from "@/hooks/useOperations";
import { 
  AlertTriangle, AlertCircle, Info, Clock,
  CheckCircle, Play, Eye, Plus, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const IncidentPanel = () => {
  const { incidents, isLoading, updateIncidentStatus, createIncident } = useIncidents();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    severity: 'warning' as 'critical' | 'warning' | 'info',
    type: '',
    title: '',
    description: '',
  });

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { 
          icon: <AlertCircle className="w-4 h-4" />, 
          color: 'text-red-400', 
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          badge: 'bg-red-500 text-white'
        };
      case 'warning':
        return { 
          icon: <AlertTriangle className="w-4 h-4" />, 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/30',
          badge: 'bg-amber-500 text-black'
        };
      case 'info':
        return { 
          icon: <Info className="w-4 h-4" />, 
          color: 'text-blue-400', 
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          badge: 'bg-blue-500 text-white'
        };
      default:
        return { 
          icon: <Info className="w-4 h-4" />, 
          color: 'text-zinc-400', 
          bg: 'bg-zinc-500/20',
          border: 'border-zinc-500/30',
          badge: 'bg-zinc-500 text-white'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return { label: 'Offen', color: 'text-red-400', icon: <AlertCircle className="w-3 h-3" /> };
      case 'acknowledged':
        return { label: 'Bestätigt', color: 'text-amber-400', icon: <Eye className="w-3 h-3" /> };
      case 'in_progress':
        return { label: 'In Bearbeitung', color: 'text-blue-400', icon: <Play className="w-3 h-3" /> };
      case 'resolved':
        return { label: 'Gelöst', color: 'text-emerald-400', icon: <CheckCircle className="w-3 h-3" /> };
      default:
        return { label: status, color: 'text-zinc-400', icon: <Clock className="w-3 h-3" /> };
    }
  };

  const handleStatusChange = async (id: string, newStatus: Incident['status']) => {
    await updateIncidentStatus(id, newStatus);
  };

  const handleCreateIncident = async () => {
    if (!newIncident.title || !newIncident.type) return;
    
    await createIncident(newIncident);
    setShowCreateDialog(false);
    setNewIncident({ severity: 'warning', type: '', title: '', description: '' });
  };

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const warningCount = incidents.filter(i => i.severity === 'warning').length;
  const infoCount = incidents.filter(i => i.severity === 'info').length;

  return (
    <div className="h-full flex flex-col bg-zinc-900/50 border-l border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Incident Center
          </h2>
          <Button 
            size="sm" 
            onClick={() => setShowCreateDialog(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Neu
          </Button>
        </div>

        {/* Summary Badges */}
        <div className="flex gap-2">
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            {criticalCount} Critical
          </Badge>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {warningCount} Warning
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Info className="w-3 h-3 mr-1" />
            {infoCount} Info
          </Badge>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <CheckCircle className="w-12 h-12 mb-3 text-emerald-500/50" />
            <p className="text-sm">Keine aktiven Störungen</p>
          </div>
        ) : (
          incidents.map((incident) => {
            const severityConfig = getSeverityConfig(incident.severity);
            const statusConfig = getStatusConfig(incident.status);

            return (
              <div 
                key={incident.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  severityConfig.border,
                  severityConfig.bg
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded-md", severityConfig.bg, severityConfig.color)}>
                    {severityConfig.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-[10px] px-1.5 py-0", severityConfig.badge)}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-zinc-500">{incident.type}</span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-white truncate">{incident.title}</h4>
                    
                    {incident.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{incident.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className={cn("flex items-center gap-1 text-xs", statusConfig.color)}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                      
                      <span className="text-[10px] text-zinc-500">
                        {formatDistanceToNow(new Date(incident.created_at), { 
                          addSuffix: true, 
                          locale: de 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1 mt-2 pt-2 border-t border-zinc-700/50">
                  {incident.status === 'open' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs flex-1"
                      onClick={() => handleStatusChange(incident.id, 'acknowledged')}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Bestätigen
                    </Button>
                  )}
                  {(incident.status === 'open' || incident.status === 'acknowledged') && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs flex-1"
                      onClick={() => handleStatusChange(incident.id, 'in_progress')}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Bearbeiten
                    </Button>
                  )}
                  {incident.status !== 'resolved' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs flex-1 text-emerald-400 hover:text-emerald-300"
                      onClick={() => handleStatusChange(incident.id, 'resolved')}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Lösen
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Incident Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Neue Störung melden</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Schweregrad</Label>
              <Select 
                value={newIncident.severity} 
                onValueChange={(v) => setNewIncident(prev => ({ ...prev, severity: v as 'critical' | 'warning' | 'info' }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Typ</Label>
              <Select 
                value={newIncident.type} 
                onValueChange={(v) => setNewIncident(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue placeholder="Typ auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle_delay">Fahrzeug Verspätung</SelectItem>
                  <SelectItem value="vehicle_breakdown">Fahrzeug Panne</SelectItem>
                  <SelectItem value="scanner_offline">Scanner Offline</SelectItem>
                  <SelectItem value="route_blocked">Strecke blockiert</SelectItem>
                  <SelectItem value="passenger_issue">Fahrgast Problem</SelectItem>
                  <SelectItem value="system_error">Systemfehler</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Titel</Label>
              <Input
                value={newIncident.title}
                onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 mt-1"
                placeholder="Kurze Beschreibung..."
              />
            </div>
            
            <div>
              <Label>Details (optional)</Label>
              <Textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 mt-1"
                placeholder="Weitere Details..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateIncident}>
              Störung melden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentPanel;
