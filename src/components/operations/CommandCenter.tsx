import { useState } from "react";
import { useCommandActions } from "@/hooks/useOperations";
import { 
  Zap, Ban, Clock, UserCheck, Send, RefreshCw,
  CheckCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CommandAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const commands: CommandAction[] = [
  {
    id: 'cancel_trip',
    icon: <Ban className="w-5 h-5" />,
    label: 'Fahrt abbrechen',
    description: 'Eine aktive Fahrt abbrechen',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 hover:bg-red-500/20',
  },
  {
    id: 'report_delay',
    icon: <Clock className="w-5 h-5" />,
    label: 'Verspätung melden',
    description: 'Verspätung für eine Fahrt melden',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
  },
  {
    id: 'reassign_driver',
    icon: <UserCheck className="w-5 h-5" />,
    label: 'Fahrer neu zuweisen',
    description: 'Einen Fahrer einem anderen Bus zuweisen',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    id: 'send_notification',
    icon: <Send className="w-5 h-5" />,
    label: 'Push-Nachricht',
    description: 'Nachricht an Mitarbeiter senden',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
  },
  {
    id: 'system_refresh',
    icon: <RefreshCw className="w-5 h-5" />,
    label: 'System-Refresh',
    description: 'Alle Daten neu synchronisieren',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
  },
];

const CommandCenter = () => {
  const { cancelTrip, reportDelay, reassignDriver, logCommand } = useCommandActions();
  const { toast } = useToast();
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleExecuteCommand = async () => {
    if (!activeCommand) return;
    setIsExecuting(true);

    try {
      let result: { error: Error | null } = { error: null };

      switch (activeCommand) {
        case 'cancel_trip':
          if (formData.tripId && formData.reason) {
            result = await cancelTrip(formData.tripId, formData.reason);
          }
          break;
        case 'report_delay':
          if (formData.tripId && formData.delayMinutes) {
            result = await reportDelay(formData.tripId, parseInt(formData.delayMinutes));
          }
          break;
        case 'reassign_driver':
          if (formData.shiftId && formData.busId) {
            result = await reassignDriver(formData.shiftId, formData.busId);
          }
          break;
        case 'send_notification':
          await logCommand('SEND_NOTIFICATION', 'broadcast', null, { message: formData.message });
          break;
        case 'system_refresh':
          await logCommand('SYSTEM_REFRESH', 'system', null, {});
          // Trigger page reload after brief delay
          setTimeout(() => window.location.reload(), 1000);
          break;
      }

      if (result.error) {
        toast({
          title: "Fehler",
          description: "Befehl konnte nicht ausgeführt werden",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erfolgreich",
          description: "Befehl wurde ausgeführt",
        });
        setActiveCommand(null);
        setFormData({});
      }
    } catch {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderCommandForm = () => {
    switch (activeCommand) {
      case 'cancel_trip':
        return (
          <div className="space-y-4">
            <div>
              <Label>Trip ID</Label>
              <Input
                value={formData.tripId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, tripId: e.target.value }))}
                placeholder="UUID der Fahrt"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label>Grund</Label>
              <Textarea
                value={formData.reason || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Grund für die Stornierung..."
                className="bg-zinc-800 border-zinc-700 mt-1"
                rows={3}
              />
            </div>
          </div>
        );
      case 'report_delay':
        return (
          <div className="space-y-4">
            <div>
              <Label>Trip ID</Label>
              <Input
                value={formData.tripId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, tripId: e.target.value }))}
                placeholder="UUID der Fahrt"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label>Verspätung (Minuten)</Label>
              <Input
                type="number"
                value={formData.delayMinutes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, delayMinutes: e.target.value }))}
                placeholder="z.B. 15"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
          </div>
        );
      case 'reassign_driver':
        return (
          <div className="space-y-4">
            <div>
              <Label>Schicht ID</Label>
              <Input
                value={formData.shiftId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, shiftId: e.target.value }))}
                placeholder="UUID der Schicht"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label>Neuer Bus ID</Label>
              <Input
                value={formData.busId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, busId: e.target.value }))}
                placeholder="UUID des neuen Busses"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
          </div>
        );
      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label>Nachricht</Label>
              <Textarea
                value={formData.message || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Nachricht an alle Mitarbeiter..."
                className="bg-zinc-800 border-zinc-700 mt-1"
                rows={4}
              />
            </div>
          </div>
        );
      case 'system_refresh':
        return (
          <div className="p-4 bg-zinc-800 rounded-lg text-center">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="text-zinc-300">Alle Daten werden neu synchronisiert.</p>
            <p className="text-xs text-zinc-500 mt-1">Die Seite wird automatisch neu geladen.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Command Center</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {commands.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => setActiveCommand(cmd.id)}
            className={cn(
              "p-4 rounded-lg border border-zinc-700/50 transition-all text-left",
              cmd.bgColor
            )}
          >
            <div className={cn("mb-2", cmd.color)}>{cmd.icon}</div>
            <div className="text-sm font-medium text-white">{cmd.label}</div>
            <div className="text-xs text-zinc-500 mt-1">{cmd.description}</div>
          </button>
        ))}
      </div>

      {/* Command Dialog */}
      <Dialog open={!!activeCommand} onOpenChange={(open) => !open && setActiveCommand(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {commands.find(c => c.id === activeCommand)?.icon}
              {commands.find(c => c.id === activeCommand)?.label}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {commands.find(c => c.id === activeCommand)?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {renderCommandForm()}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => { setActiveCommand(null); setFormData({}); }}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleExecuteCommand}
              disabled={isExecuting}
              className="bg-primary"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ausführen...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Befehl ausführen
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommandCenter;
