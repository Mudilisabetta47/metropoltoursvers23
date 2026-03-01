import { useState, useEffect } from "react";
import { Plus, Loader2, MapPin } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const AdminStops = () => {
  const [stops, setStops] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [routesRes, stopsRes] = await Promise.all([
        supabase.from("routes").select("id, name").order("name"),
        supabase.from("stops").select("*, routes(name)").order("stop_order"),
      ]);
      setRoutes(routesRes.data || []);
      setStops(stopsRes.data || []);
      setIsLoading(false);
    };
    load();
  }, []);

  const filtered = selectedRoute === "all" ? stops : stops.filter(s => s.route_id === selectedRoute);

  return (
    <AdminLayout title="Haltestellen" subtitle="Alle Haltestellen verwalten" actions={
      <Select value={selectedRoute} onValueChange={setSelectedRoute}>
        <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Route filtern" /></SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="all" className="text-white">Alle Routen</SelectItem>
          {routes.map(r => <SelectItem key={r.id} value={r.id} className="text-white">{r.name}</SelectItem>)}
        </SelectContent>
      </Select>
    }>
      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div> : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">#</TableHead>
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Stadt</TableHead>
                <TableHead className="text-zinc-400">Route</TableHead>
                <TableHead className="text-zinc-400">Preis ab Start</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="border-zinc-800">
                    <TableCell className="text-zinc-500">{s.stop_order}</TableCell>
                    <TableCell className="text-white font-medium">{s.name}</TableCell>
                    <TableCell className="text-zinc-300">{s.city}</TableCell>
                    <TableCell className="text-zinc-400">{(s as any).routes?.name || "–"}</TableCell>
                    <TableCell className="text-emerald-400">{Number(s.price_from_start).toFixed(2)}€</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">Keine Haltestellen</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminStops;
