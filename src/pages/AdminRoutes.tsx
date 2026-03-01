import { useState, useEffect } from "react";
import { Plus, Loader2, Route, Pencil, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminRoutes = () => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({ id: "", name: "", description: "", base_price: 0 });

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("routes").select("*").order("name");
    setRoutes(data || []);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editData.id) {
      await supabase.from("routes").update({ name: editData.name, description: editData.description, base_price: editData.base_price }).eq("id", editData.id);
    } else {
      await supabase.from("routes").insert({ name: editData.name, description: editData.description, base_price: editData.base_price });
    }
    toast({ title: "✅ Route gespeichert" });
    setEditModal(false);
    load();
  };

  return (
    <AdminLayout title="Routen" subtitle="Bus-Routen verwalten" actions={
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditData({ id: "", name: "", description: "", base_price: 0 }); setEditModal(true); }}>
        <Plus className="w-4 h-4 mr-1" /> Neue Route
      </Button>
    }>
      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div> : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Beschreibung</TableHead>
                <TableHead className="text-zinc-400">Grundpreis</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 w-20">Aktionen</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {routes.map((r) => (
                  <TableRow key={r.id} className="border-zinc-800">
                    <TableCell className="text-white font-medium">{r.name}</TableCell>
                    <TableCell className="text-zinc-400">{r.description || "–"}</TableCell>
                    <TableCell className="text-emerald-400">{Number(r.base_price).toFixed(2)}€</TableCell>
                    <TableCell><Badge className={r.is_active ? "bg-emerald-600" : "bg-zinc-600"}>{r.is_active ? "Aktiv" : "Inaktiv"}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400" onClick={() => { setEditData({ id: r.id, name: r.name, description: r.description || "", base_price: r.base_price }); setEditModal(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {routes.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">Keine Routen vorhanden</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>{editData.id ? "Route bearbeiten" : "Neue Route"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-zinc-400">Name</Label><Input value={editData.name} onChange={(e) => setEditData(d => ({ ...d, name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-400">Beschreibung</Label><Textarea value={editData.description} onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-400">Grundpreis (€)</Label><Input type="number" value={editData.base_price} onChange={(e) => setEditData(d => ({ ...d, base_price: parseFloat(e.target.value) || 0 }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={save}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRoutes;
