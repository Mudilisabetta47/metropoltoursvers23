import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, RefreshCw, Shield, ChevronLeft, ChevronRight,
  Eye, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface PackageTourInquiry {
  id: string;
  inquiry_number: string;
  tour_id: string;
  destination: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  participants: number;
  message: string | null;
  total_price: number;
  departure_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const pipelineStages = [
  { key: "pending", label: "Neu", color: "bg-yellow-500", activeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  { key: "qualified", label: "Qualifiziert", color: "bg-blue-500", activeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  { key: "offer_sent", label: "Angebot", color: "bg-indigo-500", activeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
  { key: "contacted", label: "Nachfassen", color: "bg-purple-500", activeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  { key: "confirmed", label: "Bestätigt", color: "bg-green-500", activeBg: "bg-green-500/20 text-green-300 border-green-500/40" },
  { key: "converted", label: "Buchung", color: "bg-emerald-500", activeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { key: "cancelled", label: "Verloren", color: "bg-red-500", activeBg: "bg-red-500/20 text-red-300 border-red-500/40" },
];

const getStageConfig = (status: string) =>
  pipelineStages.find(s => s.key === status) || pipelineStages[0];

const AdminInquiriesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isAgent, isLoading: authLoading } = useAuth();

  const [inquiries, setInquiries] = useState<PackageTourInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!authLoading && user && (isAdmin || isAgent)) fetchInquiries();
  }, [user, isAdmin, isAgent, authLoading]);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('package_tour_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInquiries((data as PackageTourInquiry[]) || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast({ title: "Fehler beim Laden", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch =
      inq.inquiry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${inq.first_name} ${inq.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: inquiries.length,
    open: inquiries.filter(i => !["cancelled", "converted", "confirmed"].includes(i.status)).length,
    confirmed: inquiries.filter(i => i.status === "confirmed" || i.status === "converted").length,
    pipeline: inquiries
      .filter(i => !["cancelled"].includes(i.status))
      .reduce((sum, i) => sum + i.total_price, 0),
  };

  if (authLoading) {
    return (
      <AdminLayout title="Anfragen">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isAgent)) {
    return (
      <AdminLayout title="Anfragen">
        <div className="flex items-center justify-center py-24">
          <Card className="max-w-md w-full mx-4 bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-zinc-500" />
              <h1 className="text-2xl font-bold mb-2 text-white">Zugriff verweigert</h1>
              <p className="text-zinc-400 mb-6">Admin- oder Agenten-Rechte erforderlich.</p>
              <Button onClick={() => navigate("/auth")}>Anmelden</Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="CRM — Anfragen & Leads"
      subtitle="Vertriebspipeline und Anfragenverwaltung"
      actions={
        <Button onClick={fetchInquiries} variant="outline" size="sm" disabled={isLoading} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      }
    >
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Gesamt", value: stats.total, sub: "Anfragen", accent: "text-white" },
            { label: "Offen", value: stats.open, sub: "in Bearbeitung", accent: "text-yellow-400" },
            { label: "Gewonnen", value: stats.confirmed, sub: "bestätigt/konvertiert", accent: "text-emerald-400" },
            { label: "Pipeline-Wert", value: `${stats.pipeline.toLocaleString('de-DE')}€`, sub: "ohne Stornos", accent: "text-blue-400" },
          ].map((kpi, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${kpi.accent}`}>{kpi.value}</div>
                <div className="text-xs text-zinc-500">{kpi.label} · {kpi.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline Visualization */}
        <Card className="mb-6 bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {pipelineStages.map((stage, i) => {
                const count = inquiries.filter(inq => inq.status === stage.key).length;
                return (
                  <button
                    key={stage.key}
                    onClick={() => setStatusFilter(statusFilter === stage.key ? "all" : stage.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all whitespace-nowrap
                      ${statusFilter === stage.key
                        ? stage.activeBg + ' ring-2 ring-offset-1 ring-offset-zinc-900 ring-emerald-500/30'
                        : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-zinc-800 hover:text-zinc-300'}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    {stage.label}
                    <span className="text-[10px] opacity-70">({count})</span>
                    {i < pipelineStages.length - 1 && <ArrowRight className="w-3 h-3 text-zinc-600 ml-1" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Suche: Nr., Name, Destination, E-Mail..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-48 bg-zinc-900 border-zinc-700 text-zinc-300">
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {pipelineStages.map(s => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
              </div>
            ) : paginatedInquiries.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">Keine Anfragen gefunden</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400 w-32">Anfrage-Nr.</TableHead>
                      <TableHead className="text-zinc-400">Kunde</TableHead>
                      <TableHead className="text-zinc-400">Destination</TableHead>
                      <TableHead className="text-zinc-400 text-center">Pax</TableHead>
                      <TableHead className="text-zinc-400 text-right">Wert</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400">Reisedatum</TableHead>
                      <TableHead className="text-zinc-400">Eingang</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInquiries.map((inq) => {
                      const stage = getStageConfig(inq.status);
                      return (
                        <TableRow
                          key={inq.id}
                          className="cursor-pointer border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                          onClick={() => navigate(`/admin/inquiries/${inq.id}`)}
                        >
                          <TableCell className="font-mono text-xs text-zinc-400">{inq.inquiry_number}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-white">{inq.first_name} {inq.last_name}</div>
                            <div className="text-xs text-zinc-500">{inq.email}</div>
                          </TableCell>
                          <TableCell className="font-medium text-sm text-zinc-200">{inq.destination}</TableCell>
                          <TableCell className="text-center text-zinc-300">{inq.participants}</TableCell>
                          <TableCell className="text-right font-semibold text-sm text-white">
                            {inq.total_price.toLocaleString('de-DE')}€
                          </TableCell>
                          <TableCell>
                            <Badge className={`${stage.activeBg} text-[10px] px-2 border`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${stage.color} mr-1.5`} />
                              {stage.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500">{inq.departure_date}</TableCell>
                          <TableCell className="text-xs text-zinc-500">
                            {format(new Date(inq.created_at), 'dd.MM.yy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <Eye className="w-4 h-4 text-zinc-500" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-500">
                Seite {currentPage} von {totalPages} ({filteredInquiries.length} Ergebnisse)
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="border-zinc-700 text-zinc-400">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="border-zinc-700 text-zinc-400">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
    </AdminLayout>
  );
};

export default AdminInquiriesPage;
