import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, Loader2, Trash2, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Employee {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: string[];
  created_at: string;
}

const AdminEmployees = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", role: "office" as string, first_name: "", last_name: "" });
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      // Get all user_roles that are not 'customer'
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (!roles) { setIsLoading(false); return; }

      // Group roles by user
      const userRoles: Record<string, string[]> = {};
      roles.forEach((r: any) => {
        if (r.role === "customer") return;
        if (!userRoles[r.user_id]) userRoles[r.user_id] = [];
        userRoles[r.user_id].push(r.role);
      });

      const userIds = Object.keys(userRoles);
      if (userIds.length === 0) {
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name, created_at")
        .in("user_id", userIds);

      const emps: Employee[] = (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        roles: userRoles[p.user_id] || [],
        created_at: p.created_at,
      }));

      setEmployees(emps);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const inviteEmployee = async () => {
    if (!addForm.email.trim()) return;
    setIsInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-employee", {
        body: {
          email: addForm.email.trim(),
          role: addForm.role,
          first_name: addForm.first_name.trim() || undefined,
          last_name: addForm.last_name.trim() || undefined,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: data.invited ? "📧 Einladung gesendet" : "✅ Rolle vergeben",
        description: data.message,
      });

      setAddModal(false);
      setAddForm({ email: "", role: "office", first_name: "", last_name: "" });
      loadEmployees();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Fehler", description: err.message || "Einladung fehlgeschlagen", variant: "destructive" });
    }
    setIsInviting(false);
  };

  const removeRole = async (userId: string, role: string) => {
    if (!confirm(`Rolle "${role}" wirklich entfernen?`)) return;
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    toast({ title: `Rolle "${role}" entfernt` });
    loadEmployees();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-red-600 text-xs">{role}</Badge>;
      case "office": return <Badge className="bg-blue-600 text-xs">{role}</Badge>;
      case "agent": return <Badge className="bg-purple-600 text-xs">{role}</Badge>;
      case "driver": return <Badge className="bg-amber-600 text-xs">{role}</Badge>;
      default: return <Badge className="bg-zinc-600 text-xs">{role}</Badge>;
    }
  };

  const roleDescriptions: Record<string, string> = {
    admin: "Vollzugriff auf alle Bereiche",
    office: "Buchungen, Reisen, Finanzen (eingeschränkt)",
    agent: "Buchungen verwalten, PII-Zugriff",
    driver: "Nur Fahrten + Check-in",
  };

  return (
    <AdminLayout title="Mitarbeiter & Rollen" subtitle={`${employees.length} Mitarbeiter mit Sonderrollen`} actions={
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddModal(true)}>
        <UserPlus className="w-3 h-3 mr-1" /> Mitarbeiter einladen
      </Button>
    }>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* Role Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["admin", "office", "agent", "driver"].map(role => (
              <Card key={role} className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-2xl font-bold text-white">{employees.filter(e => e.roles.includes(role)).length}</div>
                    {getRoleBadge(role)}
                  </div>
                  <div className="text-xs text-zinc-500">{roleDescriptions[role]}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Employee Table */}
          <Card className="bg-zinc-900 border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">E-Mail</TableHead>
                  <TableHead className="text-zinc-400">Rollen</TableHead>
                  <TableHead className="text-zinc-400">Seit</TableHead>
                  <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={5} className="text-center text-zinc-500 py-8">Keine Mitarbeiter mit Sonderrollen</TableCell>
                  </TableRow>
                ) : (
                  employees.map(emp => (
                    <TableRow key={emp.user_id} className="border-zinc-800">
                      <TableCell className="text-white font-medium">{emp.first_name || "–"} {emp.last_name || ""}</TableCell>
                      <TableCell className="text-zinc-400">{emp.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {emp.roles.map(r => (
                            <div key={r} className="flex items-center gap-0.5">
                              {getRoleBadge(r)}
                              {r !== "admin" && (
                                <button onClick={() => removeRole(emp.user_id, r)} className="text-zinc-500 hover:text-red-400 ml-0.5">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">{format(new Date(emp.created_at), "dd.MM.yy", { locale: de })}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-zinc-400 h-7" onClick={() => { setAddForm({ email: emp.email, role: "office", first_name: emp.first_name || "", last_name: emp.last_name || "" }); setAddModal(true); }}>
                          <Plus className="w-3 h-3 mr-1" /> Rolle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Permissions Matrix */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Berechtigungsmatrix</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Bereich</TableHead>
                    <TableHead className="text-zinc-400 text-center">Admin</TableHead>
                    <TableHead className="text-zinc-400 text-center">Office</TableHead>
                    <TableHead className="text-zinc-400 text-center">Agent</TableHead>
                    <TableHead className="text-zinc-400 text-center">Fahrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { area: "Buchungen", admin: true, office: true, agent: true, driver: false },
                    { area: "Reiseverwaltung", admin: true, office: true, agent: false, driver: false },
                    { area: "Finanzen", admin: true, office: true, agent: false, driver: false },
                    { area: "Fahrten / Check-in", admin: true, office: true, agent: true, driver: true },
                    { area: "Kunden (CRM)", admin: true, office: true, agent: true, driver: false },
                    { area: "Mitarbeiter", admin: true, office: false, agent: false, driver: false },
                    { area: "Einstellungen", admin: true, office: false, agent: false, driver: false },
                    { area: "Rechtliches", admin: true, office: true, agent: false, driver: false },
                  ].map(row => (
                    <TableRow key={row.area} className="border-zinc-800">
                      <TableCell className="text-white text-sm">{row.area}</TableCell>
                      {[row.admin, row.office, row.agent, row.driver].map((v, i) => (
                        <TableCell key={i} className="text-center">
                          {v ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-600">–</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-emerald-400" /> Mitarbeiter einladen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">Vorname</Label>
                <Input value={addForm.first_name} onChange={(e) => setAddForm(f => ({ ...f, first_name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Max" />
              </div>
              <div>
                <Label className="text-zinc-400">Nachname</Label>
                <Input value={addForm.last_name} onChange={(e) => setAddForm(f => ({ ...f, last_name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Mustermann" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400">E-Mail-Adresse</Label>
              <Input value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" placeholder="mitarbeiter@example.com" type="email" />
            </div>
            <div>
              <Label className="text-zinc-400">Rolle</Label>
              <Select value={addForm.role} onValueChange={(v) => setAddForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="admin" className="text-white">Admin – Vollzugriff</SelectItem>
                  <SelectItem value="office" className="text-white">Office – Buchungen/Reisen/Finanzen</SelectItem>
                  <SelectItem value="agent" className="text-white">Agent – Buchungen</SelectItem>
                  <SelectItem value="driver" className="text-white">Fahrer – Nur Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-zinc-400">
                  <p className="font-medium text-zinc-300 mb-1">So funktioniert die Einladung:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Der Mitarbeiter erhält eine E-Mail mit Einladungslink</li>
                    <li>Nach Aktivierung wird die Rolle automatisch zugewiesen</li>
                    <li>Falls der Account bereits existiert, wird nur die Rolle vergeben</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={inviteEmployee} disabled={isInviting || !addForm.email.trim()}>
              {isInviting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
              {isInviting ? "Wird gesendet…" : "Einladung senden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEmployees;
