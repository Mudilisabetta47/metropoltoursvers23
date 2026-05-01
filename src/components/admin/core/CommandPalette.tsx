import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, FileText, Bus, Users, DollarSign, Mail, Inbox,
  Calendar, Route, MapPin, Calculator, Truck, ClipboardList, Map,
  Sparkles, Activity, Shield, Settings, Search, Wrench, AlertTriangle,
  Fuel, Receipt, IdCard, Building2, MessageSquareWarning, FileSpreadsheet,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Übersicht", icon: LayoutDashboard, group: "Cockpit" },
  { path: "/admin/ops", label: "Leitstand", icon: Activity, group: "Disposition" },
  { path: "/admin/tour-bookings", label: "Reise-Buchungen", icon: FileText, group: "Buchungen" },
  { path: "/admin/bus-bookings", label: "Bus-Buchungen", icon: Bus, group: "Buchungen" },
  { path: "/admin/inquiries", label: "Anfragen", icon: Mail, group: "Buchungen" },
  { path: "/admin/departures", label: "Fahrten", icon: Calendar, group: "Disposition" },
  { path: "/admin/shifts", label: "Dienstpläne", icon: ClipboardList, group: "Disposition" },
  { path: "/admin/tour-builder", label: "Reisen-Builder", icon: Map, group: "Disposition" },
  { path: "/admin/routes", label: "Routen", icon: Route, group: "Stammdaten" },
  { path: "/admin/stops", label: "Haltestellen", icon: MapPin, group: "Stammdaten" },
  { path: "/admin/buses", label: "Fahrzeuge", icon: Truck, group: "Stammdaten" },
  { path: "/admin/customers", label: "Kunden", icon: Users, group: "CRM" },
  { path: "/admin/b2b", label: "B2B-Kunden", icon: Building2, group: "CRM" },
  { path: "/admin/complaints", label: "Reklamationen", icon: MessageSquareWarning, group: "CRM" },
  { path: "/admin/finances", label: "Buchhaltung", icon: DollarSign, group: "Finanzen" },
  { path: "/admin/cost-estimate", label: "Kalkulation", icon: Calculator, group: "Finanzen" },
  { path: "/admin/coupons", label: "Gutscheine", icon: Sparkles, group: "Finanzen" },
  { path: "/admin/payroll", label: "Lohn & Spesen", icon: Receipt, group: "Personal" },
  { path: "/admin/licenses", label: "Führerscheine", icon: IdCard, group: "Personal" },
  { path: "/admin/employees", label: "Mitarbeiter", icon: Users, group: "Personal" },
  { path: "/admin/compliance", label: "TÜV/UVV/Tachograph", icon: Shield, group: "Flotte" },
  { path: "/admin/fuel", label: "Tankungen", icon: Fuel, group: "Flotte" },
  { path: "/admin/damages", label: "Schäden", icon: AlertTriangle, group: "Flotte" },
  { path: "/admin/workshops", label: "Werkstätten", icon: Wrench, group: "Flotte" },
  { path: "/admin/toll", label: "Mautkonten", icon: FileSpreadsheet, group: "Flotte" },
  { path: "/admin/vignettes", label: "Vignetten", icon: FileSpreadsheet, group: "Flotte" },
  { path: "/admin/mailbox", label: "Postfach", icon: Inbox, group: "Kommunikation" },
  { path: "/admin/templates", label: "E-Mail Vorlagen", icon: Mail, group: "Kommunikation" },
  { path: "/admin/cms", label: "Inhalte (CMS)", icon: ClipboardList, group: "System" },
  { path: "/admin/audit", label: "Audit-Log", icon: Shield, group: "System" },
  { path: "/admin/legal", label: "Rechtliches", icon: Shield, group: "System" },
  { path: "/admin/settings", label: "Einstellungen", icon: Settings, group: "System" },
];

interface SearchHit {
  type: "booking" | "customer" | "tour";
  id: string;
  label: string;
  sub: string;
  link: string;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  // ⌘K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Async search (debounced)
  useEffect(() => {
    if (!query || query.length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const q = query.trim();
      const results: SearchHit[] = [];

      try {
        // Bookings by ticket
        const { data: tickets } = await supabase
          .from("bookings")
          .select("id, ticket_number, passenger_first_name, passenger_last_name, status")
          .or(`ticket_number.ilike.%${q}%,passenger_last_name.ilike.%${q}%`)
          .limit(5);
        tickets?.forEach((b: any) => results.push({
          type: "booking",
          id: b.id,
          label: b.ticket_number,
          sub: `${b.passenger_first_name ?? ""} ${b.passenger_last_name ?? ""} · ${b.status}`,
          link: `/admin/booking/${b.id}`,
        }));

        // Customers
        if (isAdmin) {
          const { data: customers } = await supabase
            .from("profiles")
            .select("id, user_id, email, first_name, last_name")
            .or(`email.ilike.%${q}%,last_name.ilike.%${q}%,first_name.ilike.%${q}%`)
            .limit(5);
          customers?.forEach((c: any) => results.push({
            type: "customer",
            id: c.id,
            label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email,
            sub: c.email,
            link: `/admin/customers?q=${encodeURIComponent(c.email)}`,
          }));
        }

        // Package tours
        const { data: tours } = await supabase
          .from("package_tours")
          .select("id, destination, slug")
          .ilike("destination", `%${q}%`)
          .limit(5);
        tours?.forEach((t: any) => results.push({
          type: "tour",
          id: t.id,
          label: t.destination,
          sub: "Pauschalreise",
          link: `/admin/tour-builder?id=${t.id}`,
        }));
      } catch (e) {
        console.error("Search error:", e);
      }

      setHits(results);
      setLoading(false);
    }, 250);

    return () => clearTimeout(handle);
  }, [query, isAdmin]);

  const groupedNav = useMemo(() => {
    const groups: Record<string, typeof NAV_ITEMS> = {};
    NAV_ITEMS.forEach((i) => {
      groups[i.group] = groups[i.group] || [];
      groups[i.group].push(i);
    });
    return groups;
  }, []);

  const go = (path: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Suche nach Tickets, Kunden, Reisen oder Befehlen…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {loading ? "Suche läuft…" : query.length < 2 ? "Min. 2 Zeichen eingeben." : "Keine Treffer."}
        </CommandEmpty>

        {hits.length > 0 && (
          <>
            <CommandGroup heading="Treffer">
              {hits.map((h) => (
                <CommandItem key={`${h.type}-${h.id}`} onSelect={() => go(h.link)} value={`${h.label} ${h.sub}`}>
                  <Search className="mr-2 h-4 w-4 text-[#00CC36]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{h.label}</div>
                    <div className="text-[11px] text-zinc-500 truncate">{h.sub}</div>
                  </div>
                  <span className="text-[10px] uppercase text-zinc-600 ml-2">{h.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {Object.entries(groupedNav).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.path} onSelect={() => go(item.path)} value={`${group} ${item.label}`}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
