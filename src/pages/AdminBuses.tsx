import { useState, useEffect } from "react";
import { Plus, Loader2, Bus, Pencil } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const AdminBuses = () => {
  const [buses, setBuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("buses").select("*").order("name");
      setBuses(data || []);
      setIsLoading(false);
    };
    load();
  }, []);

  return (
    <AdminLayout title="Busse" subtitle="Busflotte verwalten">
      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div> : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Kennzeichen</TableHead>
                <TableHead className="text-zinc-400">Sitzplätze</TableHead>
                <TableHead className="text-zinc-400">Ausstattung</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {buses.map((b) => (
                  <TableRow key={b.id} className="border-zinc-800">
                    <TableCell className="text-white font-medium">{b.name}</TableCell>
                    <TableCell className="text-zinc-300 font-mono">{b.license_plate}</TableCell>
                    <TableCell className="text-zinc-300">{b.total_seats}</TableCell>
                    <TableCell className="text-zinc-400">{(b.amenities || []).join(", ") || "–"}</TableCell>
                    <TableCell><Badge className={b.is_active ? "bg-emerald-600" : "bg-zinc-600"}>{b.is_active ? "Aktiv" : "Inaktiv"}</Badge></TableCell>
                  </TableRow>
                ))}
                {buses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">Keine Busse vorhanden</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminBuses;
