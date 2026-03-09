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
  { key: "pending", label: "Neu", color: "bg-yellow-500", textColor: "text-yellow-800 bg-yellow-50 border-yellow-200" },
  { key: "qualified", label: "Qualifiziert", color: "bg-blue-500", textColor: "text-blue-800 bg-blue-50 border-blue-200" },
  { key: "offer_sent", label: "Angebot", color: "bg-indigo-500", textColor: "text-indigo-800 bg-indigo-50 border-indigo-200" },
  { key: "contacted", label: "Nachfassen", color: "bg-purple-500", textColor: "text-purple-800 bg-purple-50 border-purple-200" },
  { key: "confirmed", label: "Bestätigt", color: "bg-green-500", textColor: "text-green-800 bg-green-50 border-green-200" },
  { key: "converted", label: "Buchung", color: "bg-emerald-500", textColor: "text-emerald-800 bg-emerald-50 border-emerald-200" },
  { key: "cancelled", label: "Verloren", color: "bg-red-500", textColor: "text-red-800 bg-red-50 border-red-200" },
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isAgent)) {
    return (
      <AdminLayout title="Anfragen">
        <div className="flex items-center justify-center py-24">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
              <p className="text-muted-foreground mb-6">Admin- oder Agenten-Rechte erforderlich.</p>
              <Button onClick={() => navigate("/auth")}>Anmelden</Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CRM — Anfragen & Leads</h1>
            <p className="text-sm text-muted-foreground">Vertriebspipeline und Anfragenverwaltung</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchInquiries} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Gesamt", value: stats.total, sub: "Anfragen" },
            { label: "Offen", value: stats.open, sub: "in Bearbeitung", accent: "text-yellow-600" },
            { label: "Gewonnen", value: stats.confirmed, sub: "bestätigt/konvertiert", accent: "text-green-600" },
            { label: "Pipeline-Wert", value: `${stats.pipeline.toLocaleString('de-DE')}€`, sub: "ohne Stornos", accent: "text-primary" },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${kpi.accent || ''}`}>{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label} · {kpi.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline Visualization */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {pipelineStages.map((stage, i) => {
                const count = inquiries.filter(inq => inq.status === stage.key).length;
                return (
                  <button
                    key={stage.key}
                    onClick={() => setStatusFilter(statusFilter === stage.key ? "all" : stage.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all whitespace-nowrap
                      ${statusFilter === stage.key ? stage.textColor + ' ring-2 ring-offset-1 ring-primary/30' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    {stage.label}
                    <span className="text-[10px] opacity-70">({count})</span>
                    {i < pipelineStages.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/40 ml-1" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Suche: Nr., Name, Destination, E-Mail..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-48">
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
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : paginatedInquiries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Keine Anfragen gefunden</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-32">Anfrage-Nr.</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead className="text-center">Pax</TableHead>
                      <TableHead className="text-right">Wert</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reisedatum</TableHead>
                      <TableHead>Eingang</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInquiries.map((inq) => {
                      const stage = getStageConfig(inq.status);
                      return (
                        <TableRow
                          key={inq.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/admin/inquiries/${inq.id}`)}
                        >
                          <TableCell className="font-mono text-xs">{inq.inquiry_number}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{inq.first_name} {inq.last_name}</div>
                            <div className="text-xs text-muted-foreground">{inq.email}</div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{inq.destination}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">{inq.participants}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {inq.total_price.toLocaleString('de-DE')}€
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${stage.textColor} text-[10px] px-2`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${stage.color} mr-1.5`} />
                              {stage.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{inq.departure_date}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(inq.created_at), 'dd.MM.yy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <Eye className="w-4 h-4 text-muted-foreground" />
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
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">
                Seite {currentPage} von {totalPages} ({filteredInquiries.length} Ergebnisse)
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminInquiriesPage;
