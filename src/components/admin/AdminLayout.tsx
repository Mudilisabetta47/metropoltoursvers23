import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Bus, Users, DollarSign, Shield,
  UserCheck, Settings, LogOut, Map, Mail, Calendar, Route,
  MapPin, ChevronDown, Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/database";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

interface MenuItem {
  path: string;
  label: string;
  icon: any;
  allowedRoles: AppRole[]; // which roles can see this item
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const ALL_STAFF: AppRole[] = ["admin", "office", "agent"];
const MANAGEMENT: AppRole[] = ["admin", "office"];
const ADMIN_ONLY: AppRole[] = ["admin"];
const BOOKING_STAFF: AppRole[] = ["admin", "office", "agent"];
const OPS_STAFF: AppRole[] = ["admin", "office"];

const menuSections: MenuSection[] = [
  {
    label: "Buchungen",
    items: [
      { path: "/admin/dashboard", label: "Übersicht", icon: LayoutDashboard, allowedRoles: BOOKING_STAFF },
      { path: "/admin/tour-bookings", label: "Reise-Buchungen", icon: FileText, allowedRoles: BOOKING_STAFF },
      { path: "/admin/bus-bookings", label: "Bus-Buchungen", icon: Bus, allowedRoles: BOOKING_STAFF },
      { path: "/admin/inquiries", label: "Anfragen", icon: Mail, allowedRoles: BOOKING_STAFF },
    ],
  },
  {
    label: "Reisen",
    items: [
      { path: "/admin/tour-builder", label: "Reisen verwalten", icon: Map, allowedRoles: MANAGEMENT },
      { path: "/admin/cms", label: "CMS / Inhalte", icon: FileText, allowedRoles: MANAGEMENT },
    ],
  },
  {
    label: "Operativ",
    items: [
      { path: "/admin/ops", label: "Operations Center", icon: LayoutDashboard, allowedRoles: OPS_STAFF },
      { path: "/admin/departures", label: "Abfahrten", icon: Calendar, allowedRoles: ALL_STAFF },
      { path: "/admin/routes", label: "Routen", icon: Route, allowedRoles: MANAGEMENT },
      { path: "/admin/stops", label: "Haltestellen", icon: MapPin, allowedRoles: MANAGEMENT },
      { path: "/admin/buses", label: "Busse", icon: Bus, allowedRoles: MANAGEMENT },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      { path: "/admin/customers", label: "Kunden (CRM)", icon: UserCheck, allowedRoles: BOOKING_STAFF },
      { path: "/admin/finances", label: "Finanzen", icon: DollarSign, allowedRoles: MANAGEMENT },
      { path: "/admin/legal", label: "Rechtliches", icon: Shield, allowedRoles: ADMIN_ONLY },
      { path: "/admin/employees", label: "Mitarbeiter", icon: Users, allowedRoles: ADMIN_ONLY },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/admin/templates", label: "E-Mail Vorlagen", icon: Mail, allowedRoles: MANAGEMENT },
      { path: "/admin/settings", label: "Einstellungen", icon: Settings, allowedRoles: ADMIN_ONLY },
    ],
  },
];

const AdminLayout = ({ children, title, subtitle, actions }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles, hasAnyStaffRole, isLoading: authLoading, signOut } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter menu items by role
  const canAccess = (allowedRoles: AppRole[]) => {
    return roles.some(r => allowedRoles.includes(r));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user || !hasAnyStaffRole) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <h1 className="text-2xl font-bold mb-2 text-white">Zugang erforderlich</h1>
            <p className="text-zinc-400 mb-6">Sie benötigen eine Mitarbeiter-Rolle.</p>
            <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700">
              Anmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get role label
  const roleLabel = roles.includes("admin") ? "Admin" :
    roles.includes("office") ? "Office" :
    roles.includes("agent") ? "Agent" :
    roles.includes("driver") ? "Fahrer" : "Staff";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">METROPOL TOURS</h1>
              <p className="text-[10px] text-zinc-500">{roleLabel}-Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {menuSections.map((section) => {
            // Filter items by role
            const visibleItems = section.items.filter(item => canAccess(item.allowedRoles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="mb-1">
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-zinc-500 uppercase tracking-wider hover:text-zinc-300"
                >
                  {section.label}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", collapsedSections[section.label] && "-rotate-90")} />
                </button>
                {!collapsedSections[section.label] && visibleItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors mb-0.5",
                        isActive
                          ? "bg-emerald-600/20 text-emerald-400"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="text-[10px] text-zinc-500 mb-1.5 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 text-xs"
            onClick={() => signOut()}
          >
            <LogOut className="w-3 h-3 mr-1.5" />
            Abmelden
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-4 lg:p-6 max-w-[1800px]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle && <p className="text-zinc-500 text-sm">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
