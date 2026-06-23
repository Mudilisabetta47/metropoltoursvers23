import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Bus, Users, DollarSign, Shield,
  UserCheck, Settings, LogOut, Map, Mail, Inbox, Calendar, Route,
  MapPin, ChevronDown, Calculator, Truck, ClipboardList, Search,
  ChevronRight, Sparkles, Activity, Command, ChevronsLeft,
  ChevronsRight, Menu, X, IdCard, Wallet, Building2, MessageCircleWarning, Tv, Wrench, TrendingUp,
  Sun, Moon, MonitorSmartphone, Briefcase, FileSignature, Receipt, Fuel, Scale,
  Gauge, CalendarClock, AlertTriangle, ClipboardCheck, BookOpen, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/database";
import { CommandPalette } from "@/components/admin/core/CommandPalette";
import { NotificationBell } from "@/components/admin/core/NotificationBell";
import { useCockpitTheme } from "@/hooks/useCockpitTheme";

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
  allowedRoles: AppRole[];
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
    label: "Cockpit",
    items: [
      { path: "/admin/dashboard", label: "Übersicht", icon: LayoutDashboard, allowedRoles: BOOKING_STAFF },
      { path: "/admin/wallboard", label: "Wallboard", icon: Tv, allowedRoles: MANAGEMENT },
      { path: "/admin/ops", label: "Live-Betrieb", icon: Activity, allowedRoles: OPS_STAFF },
      { path: "/admin/departures", label: "Kalender", icon: CalendarClock, allowedRoles: ALL_STAFF },
    ],
  },
  {
    label: "Buchungen",
    items: [
      { path: "/admin/tour-bookings", label: "Reise-Buchungen", icon: FileText, allowedRoles: BOOKING_STAFF },
      { path: "/admin/bus-bookings", label: "Bus-Buchungen", icon: Bus, allowedRoles: BOOKING_STAFF },
      { path: "/admin/inquiries", label: "Anfragen", icon: Mail, allowedRoles: BOOKING_STAFF },
      { path: "/admin/cost-estimate", label: "Angebote", icon: FileSignature, allowedRoles: MANAGEMENT },
    ],
  },
  {
    label: "Fahrten & Betrieb",
    items: [
      { path: "/admin/tour-builder", label: "Tourenplanung", icon: Map, allowedRoles: MANAGEMENT },
      { path: "/admin/dispatch", label: "Fahrt-Disposition", icon: ClipboardList, allowedRoles: OPS_STAFF },
      { path: "/admin/dispo-board", label: "Einsatzplanung (Linien)", icon: ClipboardList, allowedRoles: OPS_STAFF },
      { path: "/admin/driver-compliance", label: "Fahrer-Board", icon: IdCard, allowedRoles: MANAGEMENT },
      { path: "/admin/shifts", label: "Dienstpläne", icon: Users, allowedRoles: MANAGEMENT },
      { path: "/admin/incident-workflow", label: "Vorfall-Workflow", icon: AlertTriangle, allowedRoles: OPS_STAFF },
      { path: "/admin/sla-monitor", label: "Pünktlichkeit & SLA", icon: Gauge, allowedRoles: MANAGEMENT },
    ],
  },
  {
    label: "Kunden & Verträge",
    items: [
      { path: "/admin/customers", label: "Privatkunden", icon: UserCheck, allowedRoles: BOOKING_STAFF },
      { path: "/admin/b2b", label: "B2B-Kunden", icon: Building2, allowedRoles: MANAGEMENT },
      { path: "/admin/complaints", label: "Reklamationen", icon: MessageCircleWarning, allowedRoles: BOOKING_STAFF },
    ],
  },
  {
    label: "Reisen & Angebote",
    items: [
      { path: "/admin/tour-builder", label: "Reisen", icon: Map, allowedRoles: MANAGEMENT },
      { path: "/admin/weekend-trip-builder", label: "Wochenend-Reisen", icon: Sparkles, allowedRoles: MANAGEMENT },
      { path: "/admin/coupons", label: "Gutscheine & Aktionen", icon: Tag, allowedRoles: MANAGEMENT },
      { path: "/admin/dynamic-pricing", label: "Preise & Kontingente", icon: TrendingUp, allowedRoles: MANAGEMENT },
    ],
  },
  {
    label: "Stammdaten",
    items: [
      { path: "/admin/routes", label: "Routen", icon: Route, allowedRoles: MANAGEMENT },
      { path: "/admin/stops", label: "Haltestellen", icon: MapPin, allowedRoles: MANAGEMENT },
      { path: "/admin/buses", label: "Fahrzeuge", icon: Bus, allowedRoles: MANAGEMENT },
    ],
  },
  {
    label: "Flotten-Management",
    items: [
      { path: "/admin/fleet-maintenance", label: "Wartung & TÜV", icon: Wrench, allowedRoles: MANAGEMENT },
      { path: "/admin/fleet-compliance", label: "Compliance", icon: ClipboardCheck, allowedRoles: MANAGEMENT },
      { path: "/admin/fuel-log", label: "Tankungen", icon: Fuel, allowedRoles: MANAGEMENT },
      { path: "/admin/toll-vignettes", label: "Maut & Vignetten", icon: Receipt, allowedRoles: MANAGEMENT },
      { path: "/admin/workshops", label: "Werkstätten", icon: Truck, allowedRoles: MANAGEMENT },
    ],
  },
  {
    label: "Finanzen",
    items: [
      { path: "/admin/finances", label: "Buchhaltung", icon: DollarSign, allowedRoles: MANAGEMENT },
      { path: "/admin/cost-estimate", label: "Kalkulation", icon: Calculator, allowedRoles: MANAGEMENT },
      { path: "/admin/payroll", label: "Lohnabrechnung", icon: Wallet, allowedRoles: ADMIN_ONLY },
      { path: "/admin/payment-audit", label: "Zahlungs-Audit", icon: Shield, allowedRoles: ADMIN_ONLY },
    ],
  },
  {
    label: "Kommunikation",
    items: [
      { path: "/admin/mailbox", label: "Postfach", icon: Inbox, allowedRoles: MANAGEMENT },
      { path: "/admin/templates", label: "E-Mail-Vorlagen", icon: Mail, allowedRoles: MANAGEMENT },
      { path: "/admin/cms", label: "Inhalte (CMS)", icon: BookOpen, allowedRoles: MANAGEMENT },
      { path: "/admin/jobs", label: "Stellenangebote", icon: Briefcase, allowedRoles: ADMIN_ONLY },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/admin/employees", label: "Benutzer & Rollen", icon: Users, allowedRoles: ADMIN_ONLY },
      { path: "/admin/settings", label: "Einstellungen", icon: Settings, allowedRoles: ADMIN_ONLY },
      { path: "/admin/audit", label: "Audit-Log", icon: Shield, allowedRoles: ADMIN_ONLY },
      { path: "/admin/legal", label: "Rechtliches", icon: Scale, allowedRoles: ADMIN_ONLY },
    ],
  },
];

const AdminLayout = ({ children, title, subtitle, actions }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles, hasAnyStaffRole, isLoading: authLoading, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { mode: themeMode, resolved: themeResolved, setMode: setThemeMode } = useCockpitTheme();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const canAccess = (allowedRoles: AppRole[]) => roles.some(r => allowedRoles.includes(r));

  if (authLoading) {
    return (
      <div className="min-h-screen cockpit-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-cockpit-mono text-xs uppercase tracking-widest">Cockpit wird initialisiert</span>
        </div>
      </div>
    );
  }

  if (!user || !hasAnyStaffRole) {
    return (
      <div className="min-h-screen cockpit-bg flex items-center justify-center px-4">
        <div className="cockpit-glass-strong rounded-2xl p-10 max-w-md w-full text-center">
          <Shield className="w-14 h-14 mx-auto mb-5 text-zinc-600" strokeWidth={1.5} />
          <h1 className="text-2xl font-bold mb-2 text-white tracking-tight">Zugang erforderlich</h1>
          <p className="text-zinc-400 mb-6 text-sm">Sie benötigen eine Mitarbeiter-Rolle, um auf das Cockpit zuzugreifen.</p>
          <Button onClick={() => navigate("/auth")} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black font-semibold w-full">
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  const roleLabel = roles.includes("admin") ? "Admin" :
    roles.includes("office") ? "Office" :
    roles.includes("agent") ? "Agent" :
    roles.includes("driver") ? "Fahrer" : "Staff";

  // Build breadcrumb from current path
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentItem = menuSections.flatMap(s => s.items).find(i => i.path === location.pathname);
  const currentSection = menuSections.find(s => s.items.some(i => i.path === location.pathname));

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "ME";

  const SidebarContent = () => (
    <>
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter(item => canAccess(item.allowedRoles));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label} className="mb-5">
              {!collapsed && (
                <div className="cockpit-group-label px-3 mb-2">{section.label}</div>
              )}
              {collapsed && <div className="h-px cockpit-divider my-3 mx-2" />}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "w-full group flex items-center gap-3 rounded-lg text-[13px] transition-all duration-150 relative",
                        collapsed ? "justify-center p-2.5" : "px-3 py-2",
                        isActive
                          ? "cockpit-active-rail font-medium"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-[#00CC36]" : "text-zinc-500 group-hover:text-zinc-300")} strokeWidth={1.75} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && isActive && (
                        <div className="ml-auto size-1 rounded-full bg-[#00CC36] brand-glow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer: status + user */}
      <div className="border-t cockpit-border p-3 space-y-2">
        {!collapsed && (
          <div className="cockpit-glass rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-[#00CC36] animate-pulse brand-glow-sm" />
            <span className="text-[11px] text-zinc-300">Alle Systeme stabil</span>
            <span className="ml-auto text-[10px] text-zinc-500 font-cockpit-mono">
              {now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className={cn(
            "w-full flex items-center gap-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors",
            collapsed ? "justify-center p-2" : "px-3 py-2"
          )}
          title={collapsed ? "Abmelden" : undefined}
        >
          <div className="size-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {userInitials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[11px] text-white font-medium truncate">{user?.email}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{roleLabel}</div>
              </div>
              <LogOut className="w-3.5 h-3.5 shrink-0" />
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen cockpit-bg text-zinc-100 flex relative overflow-hidden">
      {/* Background grid overlay */}
      <div className="fixed inset-0 cockpit-grid pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r cockpit-border bg-[#0b0e14]/80 backdrop-blur-xl transition-[width] duration-200 z-20",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 size-6 rounded-full cockpit-glass-strong border cockpit-border flex items-center justify-center text-zinc-400 hover:text-[#00CC36] transition-colors z-10"
          title={collapsed ? "Erweitern" : "Einklappen"}
        >
          {collapsed ? <ChevronsRight className="w-3 h-3" /> : <ChevronsLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 cockpit-glass-strong border-r cockpit-border z-50 flex flex-col transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 size-7 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-400 z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col relative z-10">
        {/* Top Bar */}
        <header className="border-b cockpit-border bg-[#0b0e14] sticky top-0 z-30">
          {/* Row 1: Brand context bar — Mandant / Geschäftsjahr / Arbeitsbereich + global search */}
          <div className="h-12 flex items-center gap-0 px-0 border-b border-white/[0.04]">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden size-12 hover:bg-white/5 flex items-center justify-center text-zinc-400"
              aria-label="Menü öffnen"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand pill */}
            <div className="flex items-center gap-2 pl-4 pr-5 h-full border-r border-white/[0.06]">
              <div className="w-7 h-7 rounded-md bg-[#00CC36] flex items-center justify-center shadow-[0_0_18px_-4px_rgba(0,204,54,0.7)]">
                <Bus className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <div className="leading-none">
                <div className="text-[13px] font-bold text-white tracking-tight">
                  METROPOL<span className="text-[#00CC36]">•</span>TOURS
                </div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 mt-0.5">Cockpit</div>
              </div>
            </div>

            {/* Context selectors — visually like dropdowns */}
            <div className="hidden md:flex items-stretch h-full">
              {[
                { label: "Mandant", value: "METROPOL TOURS DE" },
                { label: "Geschäftsjahr", value: "2026" },
                { label: "Arbeitsbereich", value: "Reisebetrieb" },
              ].map((ctx) => (
                <button
                  key={ctx.label}
                  type="button"
                  className="group h-full px-4 flex items-center gap-2 border-r border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="text-left leading-tight">
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">{ctx.label}</div>
                    <div className="text-[12px] text-zinc-100 font-medium flex items-center gap-1">
                      {ctx.value}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </button>
              ))}
            </div>

            {/* Global search */}
            <div className="flex-1 flex items-center px-3 h-full border-r border-white/[0.04]">
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex items-center gap-2 w-full max-w-[640px] mx-auto h-8 px-3 rounded-md bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/[0.1] text-left transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-[12px] text-zinc-500 flex-1 truncate">
                  Buchung, Kunde, Fahrzeug, Rechnung… <span className="text-zinc-600">(Strg+K)</span>
                </span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-cockpit-mono text-zinc-400">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </button>
            </div>

            {/* Right utilities */}
            <div className="flex items-stretch h-full">
              <button
                onClick={() => {
                  const next = themeMode === "auto"
                    ? (themeResolved === "dark" ? "light" : "dark")
                    : themeMode === "dark" ? "light" : "auto";
                  setThemeMode(next);
                }}
                title={
                  themeMode === "auto" ? `Auto (System: ${themeResolved === "dark" ? "Dunkel" : "Hell"})`
                  : themeMode === "dark" ? "Dunkel-Modus" : "Hell-Modus"
                }
                className="w-11 flex items-center justify-center text-zinc-500 hover:text-[#00CC36] hover:bg-white/[0.04] transition-colors border-l border-white/[0.04]"
                aria-label="Theme wechseln"
              >
                {themeMode === "auto" ? <MonitorSmartphone className="w-4 h-4" />
                  : themeMode === "dark" ? <Moon className="w-4 h-4" />
                  : <Sun className="w-4 h-4" />}
              </button>

              <div className="border-l border-white/[0.04] flex items-center px-1">
                <NotificationBell />
              </div>

              <button
                onClick={() => navigate("/admin/help")}
                title="Hilfe"
                className="w-11 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors border-l border-white/[0.04]"
                aria-label="Hilfe"
              >
                <span className="w-5 h-5 rounded-full border border-zinc-600 text-[10px] font-bold flex items-center justify-center">?</span>
              </button>

              <button
                onClick={() => navigate("/admin/settings")}
                title="Einstellungen"
                className="w-11 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors border-l border-white/[0.04]"
                aria-label="Einstellungen"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User chip */}
              <button
                onClick={() => navigate("/admin/profile")}
                className="flex items-center gap-2 h-full pl-3 pr-4 border-l border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#00CC36] to-emerald-700 text-black text-[11px] font-bold flex items-center justify-center">
                  {userInitials}
                </div>
                <div className="hidden xl:block text-left leading-tight">
                  <div className="text-[11px] text-zinc-200 font-medium truncate max-w-[140px]">
                    {user?.email?.split("@")[0] || "Nutzer"}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-[#00CC36]">
                    {roles?.[0] || "Staff"}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Row 2: Breadcrumb + live status */}
          <div className="h-9 flex items-center gap-3 px-4 lg:px-6 text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <LayoutDashboard className="w-3 h-3" />
              <span>Cockpit</span>
              {currentSection && (
                <>
                  <ChevronRight className="w-3 h-3 text-zinc-700" />
                  <span>{currentSection.label}</span>
                </>
              )}
              {currentItem && (
                <>
                  <ChevronRight className="w-3 h-3 text-zinc-700" />
                  <span className="text-zinc-200 font-medium">{currentItem.label}</span>
                </>
              )}
            </div>

            <div className="ml-auto hidden md:flex items-center gap-4 font-cockpit-mono text-[10px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-[#00CC36] opacity-60 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#00CC36]" />
                </span>
                SYSTEM ONLINE
              </span>
              <span className="hidden lg:inline">DISPO: <span className="text-zinc-300">{new Date().toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}</span></span>
              <span className="hidden lg:inline">UTC+1</span>
            </div>
          </div>
        </header>

        {/* Page Header */}
        <div className="px-4 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>
          <div className="h-px cockpit-divider mt-5" />
        </div>

        {/* Page Content */}
        <div className="flex-1 px-4 lg:px-8 pb-10 max-w-[1800px] w-full">
          {children}
        </div>
      </main>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};

export default AdminLayout;
