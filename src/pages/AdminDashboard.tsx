import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Bus, Calendar, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ routes: 0, buses: 0, tourBookings: 0, pendingBookings: 0, revenue: 0 });

  useEffect(() => {
    if (user && isAdmin) loadStats();
  }, [user, isAdmin]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [routesRes, busesRes, tourBookingsRes] = await Promise.all([
        supabase.from("routes").select("id", { count: "exact", head: true }),
        supabase.from("buses").select("id", { count: "exact", head: true }),
        supabase.from("tour_bookings").select("id, status, total_price"),
      ]);
      const tbs = tourBookingsRes.data || [];
      setStats({
        routes: routesRes.count || 0,
        buses: busesRes.count || 0,
        tourBookings: tbs.length,
        pendingBookings: tbs.filter((b: any) => b.status === "pending").length,
        revenue: tbs.filter((b: any) => b.status !== "cancelled").reduce((s: number, b: any) => s + Number(b.total_price), 0),
      });
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  return (
    <AdminLayout title="Übersicht" subtitle="System-Übersicht und Statistiken" actions={
      <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoading} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Aktualisieren
      </Button>
    }>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-emerald-600/50" onClick={() => navigate("/admin/tour-bookings")}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><Route className="w-4 h-4" />Reise-Buchungen</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-emerald-400">{stats.tourBookings}</div></CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-amber-600/50" onClick={() => navigate("/admin/tour-bookings")}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><Calendar className="w-4 h-4" />Offen</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-amber-400">{stats.pendingBookings}</div></CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Umsatz</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-emerald-400">{stats.revenue.toFixed(0)}€</div></CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><Bus className="w-4 h-4" />Busse / Routen</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-white">{stats.buses} / {stats.routes}</div></CardContent>
          </Card>
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-sm text-zinc-400">Schnellzugriff</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 justify-start h-auto py-3" onClick={() => navigate("/admin/tour-bookings")}>
                <Route className="w-4 h-4 mr-2 text-emerald-400" /> Buchungen
              </Button>
              <Button variant="outline" className="border-zinc-700 text-zinc-300 justify-start h-auto py-3" onClick={() => navigate("/admin/departures")}>
                <Calendar className="w-4 h-4 mr-2 text-emerald-400" /> Abfahrten
              </Button>
              <Button variant="outline" className="border-zinc-700 text-zinc-300 justify-start h-auto py-3" onClick={() => navigate("/admin/tour-builder")}>
                <Plus className="w-4 h-4 mr-2 text-emerald-400" /> Reise anlegen
              </Button>
              <Button variant="outline" className="border-zinc-700 text-zinc-300 justify-start h-auto py-3" onClick={() => navigate("/admin/customers")}>
                <Bus className="w-4 h-4 mr-2 text-emerald-400" /> Kunden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
