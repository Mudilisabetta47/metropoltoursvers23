import { useEmployeeShifts, EmployeeShift } from "@/hooks/useOperations";
import { 
  Users, Clock, Bus, Scan, Headphones, 
  CheckCircle, Coffee, AlertCircle, UserX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const EmployeePanel = () => {
  const { shifts, isLoading } = useEmployeeShifts();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Aktiv', color: 'text-emerald-400 bg-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> };
      case 'break':
        return { label: 'Pause', color: 'text-amber-400 bg-amber-500/20', icon: <Coffee className="w-3 h-3" /> };
      case 'scheduled':
        return { label: 'Geplant', color: 'text-blue-400 bg-blue-500/20', icon: <Clock className="w-3 h-3" /> };
      case 'completed':
        return { label: 'Beendet', color: 'text-zinc-400 bg-zinc-500/20', icon: <CheckCircle className="w-3 h-3" /> };
      case 'absent':
        return { label: 'Abwesend', color: 'text-red-400 bg-red-500/20', icon: <UserX className="w-3 h-3" /> };
      default:
        return { label: status, color: 'text-zinc-400 bg-zinc-500/20', icon: <AlertCircle className="w-3 h-3" /> };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'driver': return <Bus className="w-4 h-4" />;
      case 'scanner': return <Scan className="w-4 h-4" />;
      case 'dispatcher': return <Headphones className="w-4 h-4" />;
      case 'support': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'driver': return 'Fahrer';
      case 'scanner': return 'Scanner';
      case 'dispatcher': return 'Disponent';
      case 'support': return 'Support';
      default: return role;
    }
  };

  const activeCount = shifts.filter(s => s.status === 'active').length;
  const breakCount = shifts.filter(s => s.status === 'break').length;
  const scheduledCount = shifts.filter(s => s.status === 'scheduled').length;

  // Group by role
  const groupedShifts = shifts.reduce((acc, shift) => {
    if (!acc[shift.role]) acc[shift.role] = [];
    acc[shift.role].push(shift);
    return acc;
  }, {} as Record<string, EmployeeShift[]>);

  return (
    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-white">Mitarbeiter Operations</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge className="bg-emerald-500/20 text-emerald-400">
            {activeCount} Aktiv
          </Badge>
          <Badge className="bg-amber-500/20 text-amber-400">
            {breakCount} Pause
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400">
            {scheduledCount} Geplant
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p className="text-sm">Keine Schichten für heute</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedShifts).map(([role, roleShifts]) => (
            <div key={role}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-400">
                  {getRoleIcon(role)}
                </div>
                <span className="text-sm font-medium text-zinc-300">{getRoleLabel(role)}</span>
                <span className="text-xs text-zinc-500">({roleShifts.length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {roleShifts.map((shift) => {
                  const statusConfig = getStatusConfig(shift.status);
                  
                  return (
                    <div 
                      key={shift.id}
                      className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          User #{shift.user_id.slice(0, 6)}
                        </span>
                        <Badge className={cn("text-[10px] px-1.5 py-0", statusConfig.color)}>
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500">Schicht:</span>
                          <div className="text-zinc-300">
                            {new Date(shift.shift_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            {shift.shift_end && (
                              <> - {new Date(shift.shift_end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</>
                            )}
                          </div>
                        </div>
                        
                        {shift.actual_start && (
                          <div>
                            <span className="text-zinc-500">Start:</span>
                            <div className="text-zinc-300">
                              {formatDistanceToNow(new Date(shift.actual_start), { addSuffix: true, locale: de })}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {shift.assigned_bus_id && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                          <Bus className="w-3 h-3" />
                          Bus #{shift.assigned_bus_id.slice(0, 6)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeePanel;
