import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Map, AlertTriangle, Users, Scan, 
  Zap, FileText, ChevronLeft, ChevronRight,
  Globe, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Operations Components
import SystemStatusBar from "@/components/operations/SystemStatusBar";
import KPIPanel from "@/components/operations/KPIPanel";
import LiveMap from "@/components/operations/LiveMap";
import IncidentPanel from "@/components/operations/IncidentPanel";
import EmployeePanel from "@/components/operations/EmployeePanel";
import ScannerPanel from "@/components/operations/ScannerPanel";
import CommandCenter from "@/components/operations/CommandCenter";
import LogsPanel from "@/components/operations/LogsPanel";

type TabType = 'overview' | 'map' | 'incidents' | 'employees' | 'scanner' | 'commands' | 'logs';

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isOffice, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user || !(isAdmin || isOffice)) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 p-6 bg-[#141a24] border border-[#1e2836] rounded-xl text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h1 className="text-2xl font-bold mb-2 text-white">Zugang erforderlich</h1>
          <p className="text-zinc-400 mb-6">Sie benötigen Admin-Rechte für den Leitstand.</p>
          <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700">Anmelden</Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview' as TabType, label: 'Übersicht', icon: LayoutDashboard },
    { id: 'map' as TabType, label: 'Live-Ortung', icon: Map },
    { id: 'incidents' as TabType, label: 'Vorfälle', icon: AlertTriangle },
    { id: 'employees' as TabType, label: 'Personal', icon: Users },
    { id: 'scanner' as TabType, label: 'Ticketprüfung', icon: Scan },
    { id: 'commands' as TabType, label: 'Maßnahmen', icon: Zap },
    { id: 'logs' as TabType, label: 'Protokolle', icon: FileText },
  ].filter(item => {
    if (item.id === 'commands' && !isAdmin) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0e14] text-zinc-100 flex flex-col">
      <SystemStatusBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "bg-[#0f1420] border-r border-[#1a2232] flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-14" : "w-48"
        )}>
          <div className={cn(
            "p-3 border-b border-[#1a2232] flex items-center",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h1 className="font-bold text-xs">LEITSTAND</h1>
                  <p className="text-[9px] text-zinc-500">Betriebssteuerung</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-[#1a2232] text-zinc-500"
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          <nav className="flex-1 p-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mb-0.5",
                  activeTab === item.id 
                    ? 'bg-emerald-600/15 text-emerald-400 border-l-2 border-emerald-500' 
                    : 'text-zinc-400 hover:bg-[#141c28] hover:text-zinc-200',
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-xs">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className={cn("p-2 border-t border-[#1a2232]", sidebarCollapsed && "flex justify-center")}>
            <Button 
              variant="ghost" size="sm" 
              className="text-zinc-500 hover:text-white hover:bg-[#141c28] h-7 text-xs w-full"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ChevronLeft className="w-3 h-3" />
              {!sidebarCollapsed && <span className="ml-1">Zurück zum Admin</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <KPIPanel />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="h-[400px]"><LiveMap /></div>
                  <ScannerPanel />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <CommandCenter />
                  <LogsPanel />
                </div>
                <EmployeePanel />
              </div>
            )}
            {activeTab === 'map' && <div className="h-full min-h-[600px]"><LiveMap /></div>}
            {activeTab === 'incidents' && <IncidentPanel />}
            {activeTab === 'employees' && <EmployeePanel />}
            {activeTab === 'scanner' && <ScannerPanel />}
            {activeTab === 'commands' && <div className="space-y-4"><CommandCenter /><LogsPanel /></div>}
            {activeTab === 'logs' && <LogsPanel />}
          </div>

          {activeTab === 'overview' && (
            <div className="hidden 2xl:block w-80 flex-shrink-0">
              <IncidentPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OperationsDashboard;
