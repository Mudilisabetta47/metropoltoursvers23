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
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Personal heute</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0">
            {activeCount} Aktiv
          </Badge>
          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0">
            {breakCount} Pause
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0">
            {scheduledCount} Geplant
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
        </div>
      ) : shifts.length === 0 ? (
        <div className="flex items-center gap-3 py-2 px-3 bg-[#0c1018] rounded-md">
          <Users className="w-5 h-5 text-zinc-700 flex-shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Keine Schichten für heute geplant</p>
            <p className="text-[10px] text-zinc-700 italic">Schichten werden in der Personalplanung erstellt</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedShifts).map(([role, roleShifts]) => (
            <div key={role}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded bg-[#0c1018] text-zinc-500">
                  {getRoleIcon(role)}
                </div>
                <span className="text-xs font-medium text-zinc-400">{getRoleLabel(role)}</span>
                <span className="text-[10px] text-zinc-600">({roleShifts.length})</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {roleShifts.map((shift) => {
                  const statusConfig = getStatusConfig(shift.status);
                  
                  return (
                    <div 
                      key={shift.id}
                      className="p-2 bg-[#0c1018] rounded border border-[#1e2836] hover:border-[#2a3a50] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-white">
                          #{shift.user_id.slice(0, 6)}
                        </span>
                        <Badge className={cn("text-[9px] px-1 py-0", statusConfig.color)}>
                          {statusConfig.icon}
                          <span className="ml-0.5">{statusConfig.label}</span>
                        </Badge>
                      </div>
                      
                      <div className="text-[10px] text-zinc-500">
                        {new Date(shift.shift_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        {shift.shift_end && (
                          <> – {new Date(shift.shift_end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </div>
                      
                      {shift.assigned_bus_id && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600">
                          <Bus className="w-2.5 h-2.5" />
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
