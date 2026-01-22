import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  Clock, CheckCircle, XCircle, AlertCircle,
  Mail, Phone, Users, Calendar, Euro, Eye,
  RefreshCw, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Ausstehend", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  contacted: { label: "Kontaktiert", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Mail },
  confirmed: { label: "Bestätigt", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  cancelled: { label: "Storniert", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  completed: { label: "Abgeschlossen", color: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertCircle },
};

const AdminInquiriesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isAgent, isLoading: authLoading } = useAuth();
  
  const [inquiries, setInquiries] = useState<PackageTourInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<PackageTourInquiry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && user && (isAdmin || isAgent)) {
      fetchInquiries();
    }
  }, [user, isAdmin, isAgent, authLoading]);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('package_tour_inquiries' as never)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries((data as PackageTourInquiry[]) || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast({
        title: "Fehler beim Laden",
        description: "Die Anfragen konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (inquiryId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('package_tour_inquiries' as never)
        .update({ status: newStatus } as never)
        .eq('id', inquiryId);

      if (error) throw error;

      setInquiries(prev => 
        prev.map(inq => 
          inq.id === inquiryId ? { ...inq, status: newStatus } : inq
        )
      );

      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }

      toast({
        title: "Status aktualisiert",
        description: `Status wurde auf "${statusConfig[newStatus]?.label || newStatus}" geändert.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Fehler",
        description: "Der Status konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter and search
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.inquiry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    confirmed: inquiries.filter(i => i.status === 'confirmed').length,
    revenue: inquiries
      .filter(i => i.status === 'confirmed' || i.status === 'completed')
      .reduce((sum, i) => sum + i.total_price, 0)
  };

  // Access control
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || (!isAdmin && !isAgent)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
              <p className="text-muted-foreground mb-6">
                Sie benötigen Admin- oder Agenten-Rechte, um diese Seite zu sehen.
              </p>
              <Button onClick={() => navigate("/auth")}>
                Anmelden
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pauschalreisen-Anfragen</h1>
            <p className="text-muted-foreground">Verwalten Sie alle eingegangenen Anfragen</p>
          </div>
          <Button onClick={fetchInquiries} variant="outline" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Gesamt</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Ausstehend</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-sm text-muted-foreground">Bestätigt</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.revenue.toLocaleString('de-DE')}€</div>
              <div className="text-sm text-muted-foreground">Umsatz (bestätigt)</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen nach Anfragenummer, Destination, Name, E-Mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : paginatedInquiries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Keine Anfragen gefunden
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anfrage-Nr.</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Teilnehmer</TableHead>
                      <TableHead>Preis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInquiries.map((inquiry) => {
                      const StatusIcon = statusConfig[inquiry.status]?.icon || Clock;
                      return (
                        <TableRow key={inquiry.id}>
                          <TableCell className="font-mono text-sm">
                            {inquiry.inquiry_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {inquiry.destination}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {inquiry.first_name} {inquiry.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {inquiry.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              {inquiry.participants}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {inquiry.total_price.toLocaleString('de-DE')}€
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`${statusConfig[inquiry.status]?.color || ''} flex items-center gap-1 w-fit`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[inquiry.status]?.label || inquiry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(inquiry.created_at), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInquiry(inquiry)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Seite {currentPage} von {totalPages} ({filteredInquiries.length} Ergebnisse)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Anfrage {selectedInquiry?.inquiry_number}
            </DialogTitle>
            <DialogDescription>
              Details und Status-Verwaltung
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">Status ändern:</span>
                <Select 
                  value={selectedInquiry.status} 
                  onValueChange={(value) => updateStatus(selectedInquiry.id, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Customer Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Kundendaten
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{selectedInquiry.first_name} {selectedInquiry.last_name}</div>
                        <div className="text-sm text-muted-foreground">{selectedInquiry.participants} Teilnehmer</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                        {selectedInquiry.email}
                      </a>
                    </div>
                    {selectedInquiry.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${selectedInquiry.phone}`} className="text-primary hover:underline">
                          {selectedInquiry.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Trip Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Reisedaten
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-primary" />
                      <div>
                        <div className="font-medium">{selectedInquiry.destination}</div>
                        <div className="text-sm text-muted-foreground capitalize">{selectedInquiry.tour_id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Abreise: {selectedInquiry.departure_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        {selectedInquiry.total_price.toLocaleString('de-DE')}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedInquiry.message && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Nachricht des Kunden
                  </h4>
                  <div className="p-4 bg-muted rounded-lg text-sm">
                    {selectedInquiry.message}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t">
                <span>
                  Erstellt: {format(new Date(selectedInquiry.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </span>
                <span>
                  Aktualisiert: {format(new Date(selectedInquiry.updated_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => window.location.href = `mailto:${selectedInquiry.email}?subject=Ihre Pauschalreisen-Anfrage ${selectedInquiry.inquiry_number}`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  E-Mail senden
                </Button>
                {selectedInquiry.phone && (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = `tel:${selectedInquiry.phone}`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Anrufen
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminInquiriesPage;
