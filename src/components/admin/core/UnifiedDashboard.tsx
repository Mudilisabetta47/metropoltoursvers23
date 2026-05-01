import { useEffect, useState } from "react";
import {
  TrendingUp, Users, Bus, AlertTriangle, FileText, Inbox,
  DollarSign, Shield, Activity, Mail,
} from "lucide-react";
import { StatWidget } from "./StatWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay } from "date-fns";

interface Stats {
  bookings7d: number;
  bookingsPrev7d: number;
  revenue30d: number;
  openInquiries: number;
  openComplaints: number;
  unreadMail: number;
  expiringCompliance: number;
  expiringLicenses: number;
  expiringVignettes: number;
  activeBuses: number;
  todayDepartures: number;
  pendingPayroll: number;
}

export function UnifiedDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isOffice } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = startOfDay(new Date()).toISOString();
      const d7 = startOfDay(subDays(new Date(), 7)).toISOString();
      const d14 = startOfDay(subDays(new Date(), 14)).toISOString();
      const d30 = startOfDay(subDays(new Date(), 30)).toISOString();
      const in30 = format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd");
      const in60 = format(new Date(Date.now() + 60 * 86400000), "yyyy-MM-dd");

      const [
        b7, b14, rev, inq, comp, mail, fc, dl, vig, bus, dep, pay,
      ] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", d7),
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", d14).lt("created_at", d7),
        supabase.from("bookings").select("price_paid").gte("created_at", d30).eq("status", "confirmed"),
        supabase.from("package_tour_inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("admin_mailbox").select("id", { count: "exact", head: true }).eq("is_read", false).eq("folder", "inbox"),
        supabase.from("fleet_compliance").select("id", { count: "exact", head: true }).lte("due_date", in30),
        supabase.from("driver_licenses").select("id", { count: "exact", head: true }).lte("expires_at", in60),
        supabase.from("vignettes").select("id", { count: "exact", head: true }).lte("valid_until", in30),
        supabase.from("buses").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("trips").select("id", { count: "exact", head: true }).eq("departure_date", format(new Date(), "yyyy-MM-dd")),
        supabase.from("payroll_entries").select("id", { count: "exact", head: true }).eq("status", "draft"),
      ]);

      const revenue = (rev.data ?? []).reduce((sum: number, r: any) => sum + Number(r.price_paid ?? 0), 0);

      setStats({
        bookings7d: b7.count ?? 0,
        bookingsPrev7d: b14.count ?? 0,
        revenue30d: revenue,
        openInquiries: inq.count ?? 0,
        openComplaints: comp.count ?? 0,
        unreadMail: mail.count ?? 0,
        expiringCompliance: fc.count ?? 0,
        expiringLicenses: dl.count ?? 0,
        expiringVignettes: vig.count ?? 0,
        activeBuses: bus.count ?? 0,
        todayDepartures: dep.count ?? 0,
        pendingPayroll: pay.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="cockpit-glass rounded-xl h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const trend7d = stats.bookingsPrev7d === 0
    ? 100
    : Math.round(((stats.bookings7d - stats.bookingsPrev7d) / stats.bookingsPrev7d) * 100);

  const fmtEur = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Section: Business */}
      <div>
        <div className="cockpit-group-label mb-3 px-1">Business</div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <StatWidget
            label="Buchungen (7T)"
            value={stats.bookings7d}
            icon={<TrendingUp className="w-4 h-4" />}
            trend={{ value: Math.abs(trend7d), direction: trend7d > 0 ? "up" : trend7d < 0 ? "down" : "flat", label: "vs. Vorwoche" }}
            accent="success"
            onClick={() => navigate("/admin/tour-bookings")}
          />
          <StatWidget
            label="Umsatz (30T)"
            value={fmtEur(stats.revenue30d)}
            icon={<DollarSign className="w-4 h-4" />}
            accent="success"
            onClick={() => navigate("/admin/finances")}
          />
          <StatWidget
            label="Offene Anfragen"
            value={stats.openInquiries}
            icon={<FileText className="w-4 h-4" />}
            hint="Warten auf Bearbeitung"
            accent={stats.openInquiries > 5 ? "warning" : "default"}
            onClick={() => navigate("/admin/inquiries")}
          />
          <StatWidget
            label="Reklamationen"
            value={stats.openComplaints}
            icon={<AlertTriangle className="w-4 h-4" />}
            hint="Offen / In Bearbeitung"
            accent={stats.openComplaints > 0 ? "warning" : "default"}
            onClick={() => navigate("/admin/complaints")}
          />
        </div>
      </div>

      {/* Section: Operations */}
      <div>
        <div className="cockpit-group-label mb-3 px-1">Operations</div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <StatWidget
            label="Heute Abfahrten"
            value={stats.todayDepartures}
            icon={<Activity className="w-4 h-4" />}
            accent="default"
            onClick={() => navigate("/admin/departures")}
          />
          <StatWidget
            label="Aktive Busse"
            value={stats.activeBuses}
            icon={<Bus className="w-4 h-4" />}
            onClick={() => navigate("/admin/buses")}
          />
          <StatWidget
            label="Ungelesene Mails"
            value={stats.unreadMail}
            icon={<Inbox className="w-4 h-4" />}
            accent={stats.unreadMail > 10 ? "warning" : "default"}
            onClick={() => navigate("/admin/mailbox")}
          />
          <StatWidget
            label="Lohn-Entwürfe"
            value={stats.pendingPayroll}
            icon={<Users className="w-4 h-4" />}
            hint="Warten auf Freigabe"
            onClick={() => navigate("/admin/payroll")}
          />
        </div>
      </div>

      {/* Section: Compliance Alerts */}
      {(isAdmin || isOffice) && (
        <div>
          <div className="cockpit-group-label mb-3 px-1">Compliance & Ablauf-Warnungen</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatWidget
              label="TÜV/UVV in 30 Tagen"
              value={stats.expiringCompliance}
              icon={<Shield className="w-4 h-4" />}
              accent={stats.expiringCompliance > 0 ? "warning" : "default"}
              hint="Pflichtprüfungen fällig"
              onClick={() => navigate("/admin/compliance")}
            />
            <StatWidget
              label="Führerscheine in 60T"
              value={stats.expiringLicenses}
              icon={<Users className="w-4 h-4" />}
              accent={stats.expiringLicenses > 0 ? "warning" : "default"}
              hint="Module 95 / Klasse D"
              onClick={() => navigate("/admin/licenses")}
            />
            <StatWidget
              label="Vignetten in 30T"
              value={stats.expiringVignettes}
              icon={<Mail className="w-4 h-4" />}
              accent={stats.expiringVignettes > 0 ? "warning" : "default"}
              hint="Auslandsfahrten gefährdet"
              onClick={() => navigate("/admin/vignettes")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
