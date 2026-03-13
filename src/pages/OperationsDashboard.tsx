import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Map, AlertTriangle, Users, Scan, 
  Zap, FileText, ChevronLeft, ChevronRight,
  Globe, Shield, Radio, Activity, Clock, Maximize2, Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Operations Components
import SystemStatusBar from "@/components/operations/SystemStatusBar";
import KPIPanel from "@/components/operations/KPIPanel";
import LiveMap from "@/components/operations/LiveMap";
import IncidentPanel from "@/components/operations/IncidentPanel";
import EmployeePanel from "@/components/operations/EmployeePanel";
import ScannerPanel from "@/components/operations/ScannerPanel";
import CommandCenter from "@/components/operations/CommandCenter";
import LogsPanel from "@/components/operations/LogsPanel";

type ViewMode = 'center' | 'map' | 'incidents' | 'employees' | 'scanner' | 'commands' | 'logs';

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isOffice, isLoading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useState(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080c12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
              <Radio className="w-6 h-6 text-emerald-500 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
          </div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase">Leitstand wird initialisiert...</p>
        </div>
      </div>
    );
  }

  if (!user || !(isAdmin || isOffice)) {
    return (
      <div className="min-h-screen bg-[#080c12] flex items-center justify-center">
        <div className="max-w-sm w-full mx-4 p-8 bg-[#0e1420] border border-[#1a2436] rounded-2xl text-center">
          <Shield className="w-14 h-14 mx-auto mb-4 text-zinc-700" />
          <h1 className="text-xl font-bold mb-2 text-white">Zugang erforderlich</h1>
          <p className="text-zinc-500 text-sm mb-6">Admin-Rechte für den Leitstand benötigt.</p>
          <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700 w-full">Anmelden</Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'center' as ViewMode, label: 'Mission Control', icon: LayoutDashboard, accent: 'emerald' },
    { id: 'map' as ViewMode, label: 'Live-Ortung', icon: Map, accent: 'blue' },
    { id: 'incidents' as ViewMode, label: 'Vorfälle', icon: AlertTriangle, accent: 'amber' },
    { id: 'employees' as ViewMode, label: 'Personal', icon: Users, accent: 'violet' },
    { id: 'scanner' as ViewMode, label: 'Ticketprüfung', icon: Scan, accent: 'cyan' },
    { id: 'commands' as ViewMode, label: 'Leitstelle', icon: Zap, accent: 'orange' },
    { id: 'logs' as ViewMode, label: 'Protokolle', icon: FileText, accent: 'zinc' },
  ].filter(item => {
    if (item.id === 'commands' && !isAdmin) return false;
    return true;
  });

  return (
    <div className="h-screen bg-[#080c12] text-zinc-100 flex flex-col overflow-hidden">
      {/* Top Bar - System Status */}
      <SystemStatusBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Compact Navigation */}
        <aside className={cn(
          "bg-[#0b1018] border-r border-[#141e2e] flex flex-col transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[52px]" : "w-44"
        )}>
          {/* Logo / Brand */}
          <div className={cn(
            "h-12 flex items-center border-b border-[#141e2e] px-2",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-[10px] tracking-[0.2em] text-emerald-400 truncate">LEITSTAND</h1>
                  <p className="text-[8px] text-zinc-600 truncate">Operations Center</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 px-1.5 space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg text-[11px] font-medium transition-all duration-200",
                    sidebarCollapsed ? "justify-center p-2" : "px-2.5 py-2",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-[#111a28]"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-emerald-400")} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-1.5 border-t border-[#141e2e] space-y-1">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-1.5 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-[#111a28] transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
            <Button 
              variant="ghost" size="sm" 
              className={cn(
                "text-zinc-600 hover:text-white hover:bg-[#111a28] h-7 text-[10px] w-full",
                sidebarCollapsed && "px-0"
              )}
              onClick={() => navigate('/admin/dashboard')}
            >
              <ChevronLeft className="w-3 h-3" />
              {!sidebarCollapsed && <span className="ml-1">Admin</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* View Header */}
          <div className="h-10 bg-[#0b1018]/80 border-b border-[#141e2e] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-zinc-300">
                  {navItems.find(n => n.id === activeView)?.label || 'Mission Control'}
                </span>
              </div>
              <div className="h-4 w-px bg-[#1a2436]" />
              <span className="text-[10px] text-zinc-600">
                {format(currentTime, 'EEEE, dd. MMMM yyyy', { locale: de })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3 h-3 text-zinc-600" />
                <span className="text-zinc-400 font-mono tabular-nums">
                  {format(currentTime, 'HH:mm:ss')}
                </span>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </Badge>
            </div>
          </div>

          {/* View Content */}
          <div className="flex-1 overflow-auto">
            {activeView === 'center' && <MissionControlView rightExpanded={rightPanelExpanded} onToggleRight={() => setRightPanelExpanded(!rightPanelExpanded)} />}
            {activeView === 'map' && (
              <div className="h-full p-3">
                <div className="h-full rounded-xl overflow-hidden border border-[#1a2436]">
                  <LiveMap />
                </div>
              </div>
            )}
            {activeView === 'incidents' && (
              <div className="h-full">
                <IncidentPanel />
              </div>
            )}
            {activeView === 'employees' && (
              <div className="p-4">
                <EmployeePanel />
              </div>
            )}
            {activeView === 'scanner' && (
              <div className="p-4">
                <ScannerPanel />
              </div>
            )}
            {activeView === 'commands' && (
              <div className="p-4 space-y-4 max-w-5xl">
                <CommandCenter />
                <LogsPanel />
              </div>
            )}
            {activeView === 'logs' && (
              <div className="p-4 max-w-5xl">
                <LogsPanel />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// ─── Mission Control View (Overview) ────────────────────────────────────────

interface MissionControlViewProps {
  rightExpanded: boolean;
  onToggleRight: () => void;
}

const MissionControlView = ({ rightExpanded, onToggleRight }: MissionControlViewProps) => {
  return (
    <div className="h-full flex flex-col">
      {/* KPI Strip */}
      <div className="p-3 pb-0">
        <KPIPanel />
      </div>

      {/* Main Grid: Map + Incidents + Panels */}
      <div className="flex-1 p-3 flex gap-3 min-h-0">
        {/* Left Column: Map + Bottom Panels */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Map */}
          <div className="flex-1 min-h-[280px] rounded-xl overflow-hidden border border-[#1a2436]">
            <LiveMap />
          </div>

          {/* Bottom Panel Row */}
          <div className="grid grid-cols-2 gap-3" style={{ height: '320px' }}>
            <div className="overflow-auto rounded-xl">
              <ScannerPanel />
            </div>
            <div className="overflow-auto rounded-xl">
              <CommandCenter />
            </div>
          </div>
        </div>

        {/* Right Column: Incidents + Logs */}
        <div className={cn(
          "flex flex-col gap-3 transition-all duration-300",
          rightExpanded ? "w-96" : "w-72"
        )}>
          {/* Toggle */}
          <div className="flex justify-end">
            <button
              onClick={onToggleRight}
              className="p-1 rounded text-zinc-600 hover:text-zinc-400 hover:bg-[#111a28] transition-colors"
              title={rightExpanded ? 'Panel verkleinern' : 'Panel vergrößern'}
            >
              {rightExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Incidents */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-[#1a2436]">
            <IncidentPanel />
          </div>

          {/* Logs */}
          <div className="h-[280px] overflow-hidden rounded-xl">
            <LogsPanel />
          </div>
        </div>
      </div>

      {/* Employee Strip */}
      <div className="p-3 pt-0">
        <EmployeePanel />
      </div>
    </div>
  );
};

export default OperationsDashboard;
