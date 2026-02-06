import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Map, AlertTriangle, Users, Scan, 
  Zap, FileText, Settings, LogOut, ChevronLeft, ChevronRight,
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
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Access control
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h1 className="text-2xl font-bold mb-2 text-white">Admin-Zugang erforderlich</h1>
          <p className="text-zinc-400 mb-6">
            Sie benötigen Admin-Rechte für das Operations Dashboard.
          </p>
          <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700">
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview' as TabType, label: 'Übersicht', icon: LayoutDashboard },
    { id: 'map' as TabType, label: 'Live-Karte', icon: Map },
    { id: 'incidents' as TabType, label: 'Incidents', icon: AlertTriangle },
    { id: 'employees' as TabType, label: 'Mitarbeiter', icon: Users },
    { id: 'scanner' as TabType, label: 'Scanner', icon: Scan },
    { id: 'commands' as TabType, label: 'Commands', icon: Zap },
    { id: 'logs' as TabType, label: 'Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* System Status Bar */}
      <SystemStatusBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-56"
        )}>
          <div className={cn(
            "p-4 border-b border-zinc-800 flex items-center",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="font-bold text-sm">OPS CENTER</h1>
                  <p className="text-[10px] text-zinc-500">Live Operations</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 p-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1",
                  activeTab === item.id 
                    ? 'bg-emerald-600/20 text-emerald-400' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
                  sidebarCollapsed && "justify-center"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className={cn(
            "p-3 border-t border-zinc-800",
            sidebarCollapsed && "flex flex-col items-center gap-2"
          )}>
            {!sidebarCollapsed && (
              <div className="text-xs text-zinc-500 mb-2 truncate">{user?.email}</div>
            )}
            <div className={cn("flex gap-2", sidebarCollapsed && "flex-col")}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 flex-1"
                onClick={() => navigate('/admin/cms')}
                title="CMS"
              >
                <Settings className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">CMS</span>}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => signOut()}
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-auto p-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <KPIPanel />
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="h-[400px]">
                    <LiveMap />
                  </div>
                  <ScannerPanel />
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <CommandCenter />
                  <LogsPanel />
                </div>
                
                <EmployeePanel />
              </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <div className="h-full min-h-[600px]">
                <LiveMap />
              </div>
            )}

            {/* Incidents Tab */}
            {activeTab === 'incidents' && (
              <div className="h-full">
                <IncidentPanel />
              </div>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
              <EmployeePanel />
            )}

            {/* Scanner Tab */}
            {activeTab === 'scanner' && (
              <ScannerPanel />
            )}

            {/* Commands Tab */}
            {activeTab === 'commands' && (
              <div className="space-y-4">
                <CommandCenter />
                <LogsPanel />
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <LogsPanel />
            )}
          </div>

          {/* Right Panel for Incidents (visible in overview) */}
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
