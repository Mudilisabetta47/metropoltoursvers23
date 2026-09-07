import { ReactNode, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Mail, Bus, Users, FileText,
  Calculator, Sparkles, Building2, Search, LogOut, Settings, Menu, X, ArrowLeft,
} from "lucide-react";
import { LogoLight } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useDispoData } from "./hooks/useDispoData";
import "./dispo.css";

const NAV = [
  {
    group: "Disposition",
    items: [
      { to: "/dispo", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/dispo/kalender", label: "Dispo-Kalender", icon: CalendarDays },
      { to: "/dispo/auftraege", label: "Aufträge", icon: ClipboardList },
      { to: "/dispo/angebote", label: "Angebote", icon: FileText },
    ],
  },
  {
    group: "Kommunikation",
    items: [
      { to: "/dispo/postfach", label: "Postfach", icon: Mail },
      { to: "/dispo/kunden", label: "Kunden (CRM)", icon: Building2 },
      { to: "/dispo/assistent", label: "KI-Assistent", icon: Sparkles },
    ],
  },
  {
    group: "Ressourcen",
    items: [
      { to: "/dispo/busse", label: "Busse", icon: Bus },
      { to: "/dispo/fahrer", label: "Fahrer", icon: Users },
      { to: "/dispo/kalkulation", label: "Preiskalkulation", icon: Calculator },
      { to: "/dispo/einstellungen", label: "Einstellungen", icon: Settings },
    ],
  },
];

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const { orders, customers, buses, drivers, emails } = useDispoData();
  const navigate = useNavigate();

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const hits: { label: string; sub: string; to: string }[] = [];
    orders.forEach((o) => {
      if ([o.order_number, o.customer_name, o.company, o.origin, o.destination].some((v) => v?.toLowerCase().includes(t)))
        hits.push({ label: `${o.order_number} · ${o.customer_name}`, sub: `${o.origin ?? "?"} → ${o.destination ?? "?"}`, to: `/dispo/auftraege?id=${o.id}` });
    });
    customers.forEach((c) => {
      if ([c.name, c.company, c.email, c.phone].some((v: string) => v?.toLowerCase().includes(t)))
        hits.push({ label: c.name, sub: c.company ?? c.email ?? "Kunde", to: "/dispo/kunden" });
    });
    emails.forEach((m) => {
      if ([m.subject, m.from_email, m.from_name].some((v) => v?.toLowerCase().includes(t)))
        hits.push({ label: m.subject ?? "(ohne Betreff)", sub: m.from_email ?? "E-Mail", to: `/dispo/postfach?id=${m.id}` });
    });
    buses.forEach((b) => {
      if ([b.name, b.license_plate].some((v: string) => v?.toLowerCase().includes(t)))
        hits.push({ label: b.name, sub: b.license_plate ?? "Bus", to: "/dispo/busse" });
    });
    drivers.forEach((d) => {
      if (d.name.toLowerCase().includes(t)) hits.push({ label: d.name, sub: "Fahrer", to: "/dispo/fahrer" });
    });
    return hits.slice(0, 12);
  }, [q, orders, customers, buses, drivers, emails]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      <input
        className="dispo-input pl-8"
        placeholder="Suche: Aufträge, Kunden, E-Mails, Busse, Fahrer…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {results.length > 0 && (
        <div className="dispo-card absolute z-40 mt-1 w-full overflow-hidden shadow-lg">
          {results.map((r, i) => (
            <button
              key={i}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--dispo-bg))]"
              onClick={() => {
                setQ("");
                navigate(r.to);
              }}
            >
              <div className="font-medium">{r.label}</div>
              <div className="text-xs dispo-muted">{r.sub}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DispoLayout({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const { user, isAdmin, isOffice, loading } = useAuth() as any;
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return <div className="dispo-root flex items-center justify-center p-16 text-sm">Lade Cockpit…</div>;
  }
  if (!user) {
    navigate("/auth");
    return null;
  }
  if (!isAdmin && !isOffice) {
    return (
      <div className="dispo-root flex flex-col items-center justify-center gap-3 p-16">
        <p className="text-sm">Kein Zugriff auf das Dispo-Cockpit.</p>
        <button className="dispo-btn dispo-btn-ghost" onClick={() => navigate("/admin/dashboard")}>
          Zurück zum Backend
        </button>
      </div>
    );
  }

  const sidebar = (
    <aside className="dispo-sidebar flex h-full w-60 shrink-0 flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <LogoLight size="sm" />
      </div>
      <div className="px-3 pb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-white/50">Dispo-Cockpit</div>
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="dispo-nav-group">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={(it as any).end} onClick={() => setMobileOpen(false)}>
                {({ isActive }) => (
                  <span className="dispo-nav-item" data-active={isActive}>
                    <it.icon className="h-4 w-4" />
                    {it.label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-2">
        <button className="dispo-nav-item" onClick={() => navigate("/admin/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Backend
        </button>
        <button className="dispo-nav-item" onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" /> Abmelden
        </button>
      </div>
    </aside>
  );

  return (
    <div className="dispo-root flex">
      <div className="hidden lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="dispo-topbar sticky top-0 z-30 flex flex-wrap items-center gap-3 px-4 py-3">
          <button className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menü">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold dispo-strong">{title}</h1>
            {subtitle && <p className="truncate text-xs dispo-muted">{subtitle}</p>}
          </div>
          <div className="ml-auto flex flex-1 items-center justify-end gap-2">
            <GlobalSearch />
            {actions}
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
