import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Palmtree, Briefcase, FileText, Plus, Pencil, Trash2, RefreshCw,
  Star, Tag, UserPlus, Search, Filter, BarChart3, Clock, Settings, MapPin,
  Link2, Unlink, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminTours, useAdminServices, useAdminContent,
  PackageTour, ServiceType
} from "@/hooks/useCMS";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string | null;
  requirements: string[];
  benefits: string[];
  salary_range: string | null;
  is_active: boolean;
  sort_order: number;
}

interface WeekendTrip {
  id: string;
  destination: string;
  slug: string;
  country: string;
  image_url: string | null;
  hero_image_url: string | null;
  gallery_images: string[];
  short_description: string | null;
  full_description: string | null;
  highlights: string[];
  inclusions: string[];
  not_included: string[];
  duration: string | null;
  distance: string | null;
  base_price: number;
  route_id: string | null;
  departure_city: string;
  departure_point: string | null;
  via_stops: any[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const AdminCMS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { tours, isLoading: toursLoading, createTour, updateTour, deleteTour, fetchAll: fetchTours } = useAdminTours();
  const { services, isLoading: servicesLoading, createService, updateService, deleteService, fetchAll: fetchServices } = useAdminServices();
  const { content, isLoading: contentLoading, fetchAll: fetchContent, upsertContent } = useAdminContent();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [weekendTrips, setWeekendTrips] = useState<WeekendTrip[]>([]);
  const [weekendLoading, setWeekendLoading] = useState(true);
  const [weekendSearch, setWeekendSearch] = useState("");
  const [weekendDialog, setWeekendDialog] = useState<{ open: boolean; trip: Partial<WeekendTrip> | null; isNew: boolean }>({ open: false, trip: null, isNew: false });

  // Search & filter
  const [tourSearch, setTourSearch] = useState("");
  const [tourStatusFilter, setTourStatusFilter] = useState<string>("all");
  const [serviceSearch, setServiceSearch] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  // Dialogs
  const [catDialog, setCatDialog] = useState<{ open: boolean; cat: Partial<Category> | null; isNew: boolean }>({ open: false, cat: null, isNew: false });
  const [jobDialog, setJobDialog] = useState<{ open: boolean; job: Partial<JobListing> | null; isNew: boolean }>({ open: false, job: null, isNew: false });
  const [tourDialog, setTourDialog] = useState<{ open: boolean; tour: Partial<PackageTour> | null; isNew: boolean }>({ open: false, tour: null, isNew: false });
  const [serviceDialog, setServiceDialog] = useState<{ open: boolean; service: Partial<ServiceType> | null; isNew: boolean }>({ open: false, service: null, isNew: false });
  const [contentDialog, setContentDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [isSaving, setIsSaving] = useState(false);

  // Tour combination state
  const [combineDialog, setCombineDialog] = useState(false);
  const [combineSelectedTours, setCombineSelectedTours] = useState<string[]>([]);
  const [combineName, setCombineName] = useState("");
  const [combineDescription, setCombineDescription] = useState("");
  const [existingCombinations, setExistingCombinations] = useState<any[]>([]);
  const [combineLoading, setCombineLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchJobs();
    fetchWeekendTrips();
    fetchCombinations();
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    const { data } = await (supabase as any).from('cms_categories').select('*').order('sort_order', { ascending: true });
    setCategories(data || []);
    setCategoriesLoading(false);
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    const { data } = await (supabase as any).from('job_listings').select('*').order('sort_order', { ascending: true });
    setJobListings(data || []);
    setJobsLoading(false);
  };

  const fetchWeekendTrips = async () => {
    setWeekendLoading(true);
    const { data } = await (supabase as any).from('weekend_trips').select('*').order('sort_order', { ascending: true });
    setWeekendTrips(data || []);
    setWeekendLoading(false);
  };

  const fetchCombinations = async () => {
    const { data } = await supabase
      .from('tour_combinations')
      .select('*, tour_combination_members(tour_id)')
      .order('created_at', { ascending: false });
    setExistingCombinations(data || []);
  };

  const openCombineDialog = () => {
    setCombineSelectedTours([]);
    setCombineName("");
    setCombineDescription("");
    setCombineDialog(true);
  };

  const toggleCombineTour = (tourId: string) => {
    setCombineSelectedTours(prev =>
      prev.includes(tourId) ? prev.filter(id => id !== tourId) : [...prev, tourId]
    );
  };

  const handleSaveCombination = async () => {
    if (combineSelectedTours.length < 2) {
      toast({ title: "Mindestens 2 Touren auswählen", variant: "destructive" });
      return;
    }
    if (!combineName.trim()) {
      toast({ title: "Name eingeben", variant: "destructive" });
      return;
    }

    setCombineLoading(true);
    try {
      // Detect common country
      const selectedTourData = tours.filter(t => combineSelectedTours.includes(t.id));
      const countries = [...new Set(selectedTourData.map(t => t.country))];
      const country = countries.length === 1 ? countries[0] : null;

      const { data: combo, error } = await supabase
        .from('tour_combinations')
        .insert({ name: combineName, description: combineDescription || null, country })
        .select()
        .single();

      if (error) throw error;

      const members = combineSelectedTours.map((tourId, i) => ({
        combination_id: combo.id,
        tour_id: tourId,
        sort_order: i,
      }));

      const { error: memberError } = await supabase
        .from('tour_combination_members')
        .insert(members);

      if (memberError) throw memberError;

      toast({ title: "✅ Touren kombiniert", description: `${combineSelectedTours.length} Touren verknüpft. Sitzplätze bleiben unabhängig.` });
      setCombineDialog(false);
      fetchCombinations();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setCombineLoading(false);
    }
  };

  const handleDeleteCombination = async (comboId: string) => {
    const { error } = await supabase.from('tour_combinations').delete().eq('id', comboId);
    if (!error) {
      toast({ title: "Kombination aufgelöst" });
      fetchCombinations();
    }
  };

  // Get combination info for a tour
  const getTourCombinations = (tourId: string) => {
    return existingCombinations.filter(c =>
      c.tour_combination_members?.some((m: any) => m.tour_id === tourId)
    );
  };

  const filteredWeekendTrips = useMemo(() => {
    if (!weekendSearch) return weekendTrips;
    const q = weekendSearch.toLowerCase();
    return weekendTrips.filter(w => w.destination.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q));
  }, [weekendTrips, weekendSearch]);

  // Filtered data
  const filteredTours = useMemo(() => {
    let result = tours;
    if (tourSearch) {
      const q = tourSearch.toLowerCase();
      result = result.filter(t => t.destination.toLowerCase().includes(q) || t.location.toLowerCase().includes(q) || t.country.toLowerCase().includes(q));
    }
    if (tourStatusFilter === "active") result = result.filter(t => t.is_active);
    else if (tourStatusFilter === "inactive") result = result.filter(t => !t.is_active);
    else if (tourStatusFilter === "featured") result = result.filter(t => t.is_featured);
    return result;
  }, [tours, tourSearch, tourStatusFilter]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return services;
    const q = serviceSearch.toLowerCase();
    return services.filter(s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
  }, [services, serviceSearch]);

  const filteredContent = useMemo(() => {
    if (!contentSearch) return content;
    const q = contentSearch.toLowerCase();
    return content.filter(c => c.section_key.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q));
  }, [content, contentSearch]);

  const filteredCategories = useMemo(() => {
    if (!catSearch) return categories;
    const q = catSearch.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, catSearch]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobListings;
    const q = jobSearch.toLowerCase();
    return jobListings.filter(j => j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q));
  }, [jobListings, jobSearch]);

  // Quick toggle handlers
  const toggleTourActive = async (id: string, current: boolean) => {
    await updateTour(id, { is_active: !current });
    toast({ title: !current ? "Reise aktiviert" : "Reise deaktiviert" });
  };

  const toggleTourFeatured = async (id: string, current: boolean) => {
    await updateTour(id, { is_featured: !current });
    toast({ title: !current ? "Als Featured markiert" : "Featured entfernt" });
  };

  const toggleServiceActive = async (id: string, current: boolean) => {
    await updateService(id, { is_active: !current });
    toast({ title: !current ? "Service aktiviert" : "Service deaktiviert" });
  };

  const toggleCategoryActive = async (id: string, current: boolean) => {
    await (supabase as any).from('cms_categories').update({ is_active: !current }).eq('id', id);
    fetchCategories();
    toast({ title: !current ? "Kategorie aktiviert" : "Kategorie deaktiviert" });
  };

  const toggleJobActive = async (id: string, current: boolean) => {
    await (supabase as any).from('job_listings').update({ is_active: !current }).eq('id', id);
    fetchJobs();
    toast({ title: !current ? "Stelle aktiviert" : "Stelle deaktiviert" });
  };

  const toggleWeekendActive = async (id: string, current: boolean) => {
    await (supabase as any).from('weekend_trips').update({ is_active: !current }).eq('id', id);
    fetchWeekendTrips();
    toast({ title: !current ? "Trip aktiviert" : "Trip deaktiviert" });
  };

  const toggleWeekendFeatured = async (id: string, current: boolean) => {
    await (supabase as any).from('weekend_trips').update({ is_featured: !current }).eq('id', id);
    fetchWeekendTrips();
    toast({ title: !current ? "Als Featured markiert" : "Featured entfernt" });
  };

  const handleSaveWeekendTrip = async () => {
    if (!weekendDialog.trip?.destination) return;
    setIsSaving(true);
    try {
      if (weekendDialog.isNew) {
        await (supabase as any).from('weekend_trips').insert(weekendDialog.trip);
      } else {
        const { id, created_at: _ca, updated_at: _ua, ...updates } = weekendDialog.trip as any;
        await (supabase as any).from('weekend_trips').update(updates).eq('id', id);
      }
      toast({ title: weekendDialog.isNew ? "Wochenendtrip erstellt" : "Wochenendtrip aktualisiert" });
      setWeekendDialog({ open: false, trip: null, isNew: false });
      fetchWeekendTrips();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    setIsSaving(false);
  };

  const handleDeleteWeekendTrip = async (id: string) => {
    if (!confirm('Wochenendtrip wirklich löschen?')) return;
    await (supabase as any).from('weekend_trips').delete().eq('id', id);
    toast({ title: "Wochenendtrip gelöscht" });
    fetchWeekendTrips();
  };

  // CRUD handlers
  const handleSaveCategory = async () => {
    if (!catDialog.cat?.name) return;
    setIsSaving(true);
    try {
      if (catDialog.isNew) {
        await (supabase as any).from('cms_categories').insert(catDialog.cat);
      } else {
        const { id, ...updates } = catDialog.cat;
        await (supabase as any).from('cms_categories').update(updates).eq('id', id);
      }
      toast({ title: catDialog.isNew ? "Kategorie erstellt" : "Kategorie aktualisiert" });
      setCatDialog({ open: false, cat: null, isNew: false });
      fetchCategories();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    setIsSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Kategorie wirklich löschen?')) return;
    await (supabase as any).from('cms_categories').delete().eq('id', id);
    toast({ title: "Kategorie gelöscht" });
    fetchCategories();
  };

  const handleSaveJob = async () => {
    if (!jobDialog.job?.title) return;
    setIsSaving(true);
    try {
      if (jobDialog.isNew) {
        await (supabase as any).from('job_listings').insert(jobDialog.job);
      } else {
        const { id, ...updates } = jobDialog.job;
        await (supabase as any).from('job_listings').update(updates).eq('id', id);
      }
      toast({ title: jobDialog.isNew ? "Stelle erstellt" : "Stelle aktualisiert" });
      setJobDialog({ open: false, job: null, isNew: false });
      fetchJobs();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    setIsSaving(false);
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Stelle wirklich löschen?')) return;
    await (supabase as any).from('job_listings').delete().eq('id', id);
    toast({ title: "Stelle gelöscht" });
    fetchJobs();
  };

  const handleSaveTour = async () => {
    if (!tourDialog.tour) return;
    setIsSaving(true);
    try {
      if (tourDialog.isNew) {
        const { error } = await createTour(tourDialog.tour as Omit<PackageTour, 'id' | 'created_at' | 'updated_at'>);
        if (error) throw error;
        toast({ title: "Reise erstellt" });
      } else {
        const { id, ...updates } = tourDialog.tour;
        const { error } = await updateTour(id!, updates);
        if (error) throw error;
        toast({ title: "Reise aktualisiert" });
      }
      setTourDialog({ open: false, tour: null, isNew: false });
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleDeleteTour = async (id: string) => {
    if (!confirm('Reise wirklich löschen?')) return;
    const { error } = await deleteTour(id);
    if (error) toast({ title: "Fehler", variant: "destructive" });
    else toast({ title: "Reise gelöscht" });
  };

  const handleSaveService = async () => {
    if (!serviceDialog.service) return;
    setIsSaving(true);
    try {
      if (serviceDialog.isNew) {
        const { error } = await createService(serviceDialog.service as Omit<ServiceType, 'id' | 'created_at' | 'updated_at'>);
        if (error) throw error;
        toast({ title: "Service erstellt" });
      } else {
        const { id, ...updates } = serviceDialog.service;
        const { error } = await updateService(id!, updates);
        if (error) throw error;
        toast({ title: "Service aktualisiert" });
      }
      setServiceDialog({ open: false, service: null, isNew: false });
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Service wirklich löschen?')) return;
    const { error } = await deleteService(id);
    if (error) toast({ title: "Fehler", variant: "destructive" });
    else toast({ title: "Service gelöscht" });
  };

  const handleSaveContent = async () => {
    if (!contentDialog.item) return;
    setIsSaving(true);
    try {
      const { section_key, ...updates } = contentDialog.item;
      await upsertContent(section_key, updates);
      toast({ title: "Inhalt gespeichert" });
      setContentDialog({ open: false, item: null });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
    setIsSaving(false);
  };

  // Stats
  const activeWeekendTrips = weekendTrips.filter(w => w.is_active).length;

  const activeTours = tours.filter(t => t.is_active).length;
  const featuredTours = tours.filter(t => t.is_featured).length;
  const upcomingTours = tours.filter(t => new Date(t.departure_date) > new Date()).length;
  const activeServices = services.filter(s => s.is_active).length;
  const activeCategories = categories.filter(c => c.is_active).length;
  const activeJobs = jobListings.filter(j => j.is_active).length;

  const newServiceTemplate: Partial<ServiceType> = {
    name: '', slug: '', description: '', icon: 'Users',
    highlight: '', features: [], is_active: true, sort_order: services.length + 1
  };

  const statsCards = [
    { label: "Reisen gesamt", value: tours.length, sub: `${activeTours} aktiv`, icon: Palmtree, color: "text-emerald-400" },
    { label: "Featured", value: featuredTours, sub: "hervorgehoben", icon: Star, color: "text-amber-400" },
    { label: "Bevorstehend", value: upcomingTours, sub: "zukünftige Termine", icon: Clock, color: "text-blue-400" },
    { label: "Services", value: services.length, sub: `${activeServices} aktiv`, icon: Briefcase, color: "text-purple-400" },
    { label: "Kategorien", value: categories.length, sub: `${activeCategories} aktiv`, icon: Tag, color: "text-cyan-400" },
    { label: "Stellen", value: jobListings.length, sub: `${activeJobs} aktiv`, icon: UserPlus, color: "text-orange-400" },
    { label: "Trips", value: weekendTrips.length, sub: `${activeWeekendTrips} aktiv`, icon: MapPin, color: "text-sky-400" },
    { label: "CMS Blöcke", value: content.length, sub: "Textinhalte", icon: FileText, color: "text-rose-400" },
    { label: "Auslastung", value: `${tours.length > 0 ? Math.round((activeTours / tours.length) * 100) : 0}%`, sub: "aktive Reisen", icon: BarChart3, color: "text-teal-400" },
  ];

  return (
    <AdminLayout title="Content Management" subtitle="Inhalte, Reisen, Services und Stellenanzeigen verwalten" actions={
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { fetchTours(); fetchServices(); fetchContent(); fetchCategories(); fetchJobs(); fetchWeekendTrips(); }}
          className="border-[#2a3040] text-zinc-400 hover:text-white hover:bg-[#1e2430]">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Alles aktualisieren
        </Button>
      </div>
    }>
      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
        {statsCards.map((s) => (
          <Card key={s.label} className="bg-[#1a1f2a] border-[#2a3040]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
              </div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-zinc-600">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tours" className="space-y-4">
        <TabsList className="bg-[#1a1f2a] border border-[#2a3040] p-1 h-auto flex-wrap">
          <TabsTrigger value="tours" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 text-zinc-400 gap-1.5 text-xs">
            <Palmtree className="w-3.5 h-3.5" />Reisen
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 text-zinc-400 gap-1.5 text-xs">
            <Briefcase className="w-3.5 h-3.5" />Services
          </TabsTrigger>
          <TabsTrigger value="weekend" className="data-[state=active]:bg-sky-600/20 data-[state=active]:text-sky-400 text-zinc-400 gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5" />Wochenendtrips
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400 text-zinc-400 gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5" />Sortiment
          </TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400 text-zinc-400 gap-1.5 text-xs">
            <UserPlus className="w-3.5 h-3.5" />Karriere
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-rose-600/20 data-[state=active]:text-rose-400 text-zinc-400 gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" />CMS Blöcke
          </TabsTrigger>
        </TabsList>

        {/* ─── TOURS TAB ─── */}
        <TabsContent value="tours">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input value={tourSearch} onChange={e => setTourSearch(e.target.value)}
                placeholder="Reiseziel, Region, Land..." className="pl-9 bg-[#1a1f2a] border-[#2a3040] text-sm h-9" />
            </div>
            <Select value={tourStatusFilter} onValueChange={setTourStatusFilter}>
              <SelectTrigger className="w-36 bg-[#1a1f2a] border-[#2a3040] h-9 text-sm">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /><SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                <SelectItem value="all">Alle ({tours.length})</SelectItem>
                <SelectItem value="active">Aktiv ({activeTours})</SelectItem>
                <SelectItem value="inactive">Inaktiv ({tours.length - activeTours})</SelectItem>
                <SelectItem value="featured">Featured ({featuredTours})</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCombineDialog} variant="outline" className="border-[#2a3040] text-zinc-300 hover:text-white h-9 text-sm gap-1.5">
              <Link2 className="w-3.5 h-3.5" />Kombinieren
            </Button>
            <Button onClick={() => navigate('/admin/tour-builder')} className="bg-emerald-600 hover:bg-emerald-700 h-9 text-sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Neue Reise
            </Button>
          </div>

          <Card className="bg-[#1a1f2a] border-[#2a3040]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3040] hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Reiseziel</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Region / Land</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Dauer</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Preis</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Abfahrt</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center">Aktiv</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center">Featured</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toursLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-zinc-500">Laden...</TableCell></TableRow>
                ) : filteredTours.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                    {tourSearch || tourStatusFilter !== 'all' ? 'Keine Treffer' : 'Keine Reisen vorhanden'}
                  </TableCell></TableRow>
                ) : filteredTours.map(tour => (
                  <TableRow key={tour.id} className="border-[#2a3040] hover:bg-[#1e2430]">
                    <TableCell className="font-medium text-white text-sm">
                      <div className="flex items-center gap-1.5">
                        {tour.destination}
                        {getTourCombinations(tour.id).length > 0 && (
                          <Badge className="bg-blue-600/20 text-blue-400 text-[9px] px-1 py-0 gap-0.5">
                            <Link2 className="w-2.5 h-2.5" />
                            {getTourCombinations(tour.id).map(c => c.name).join(', ')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      <span>{tour.location}</span>
                      <span className="text-zinc-600 ml-1.5 text-xs">({tour.country})</span>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">{tour.duration_days}T</TableCell>
                    <TableCell className="text-emerald-400 font-medium text-sm">
                      {tour.price_from.toLocaleString('de-DE')} €
                      {tour.discount_percent > 0 && (
                        <Badge className="ml-1.5 bg-red-600/20 text-red-400 text-[10px] px-1 py-0">-{tour.discount_percent}%</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">
                      {format(new Date(tour.departure_date), 'dd.MM.yy', { locale: de })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={tour.is_active} onCheckedChange={() => toggleTourActive(tour.id, tour.is_active)}
                        className="data-[state=checked]:bg-emerald-600" />
                    </TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleTourFeatured(tour.id, tour.is_featured)} className="mx-auto block">
                        <Star className={`w-4 h-4 transition-colors ${tour.is_featured ? 'text-amber-400 fill-amber-400' : 'text-zinc-600 hover:text-amber-400/50'}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/tour-builder/${tour.id}`)}
                          className="text-emerald-400 hover:text-emerald-300 h-7 w-7 p-0" title="Im Builder öffnen">
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setTourDialog({ open: true, tour: { ...tour }, isNew: false })}
                          className="text-zinc-400 hover:text-white h-7 w-7 p-0" title="Schnellbearbeitung">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTour(tour.id)}
                          className="text-red-400/60 hover:text-red-400 h-7 w-7 p-0" title="Löschen">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="text-xs text-zinc-600 mt-2 px-1">
            {filteredTours.length} von {tours.length} Reisen angezeigt
          </div>

          {/* Existing Combinations */}
          {existingCombinations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-400" />
                Aktive Kombinationen ({existingCombinations.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {existingCombinations.map(combo => {
                  const memberTours = tours.filter(t =>
                    combo.tour_combination_members?.some((m: any) => m.tour_id === t.id)
                  );
                  return (
                    <Card key={combo.id} className="bg-[#1a1f2a] border-[#2a3040]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{combo.name}</p>
                            {combo.country && (
                              <Badge className="bg-blue-600/20 text-blue-400 text-[10px] mt-1">{combo.country}</Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCombination(combo.id)}
                            className="text-red-400/50 hover:text-red-400 h-6 w-6 p-0" title="Auflösen">
                            <Unlink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {combo.description && (
                          <p className="text-[10px] text-zinc-500 mb-2">{combo.description}</p>
                        )}
                        <div className="space-y-1">
                          {memberTours.map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-xs text-zinc-400 py-0.5">
                              <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span className="truncate">{t.destination}</span>
                            </div>
                          ))}
                          {combo.tour_combination_members?.length > memberTours.length && (
                            <p className="text-[10px] text-zinc-600">
                              +{combo.tour_combination_members.length - memberTours.length} weitere (inaktiv)
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Sitzplätze bleiben unabhängig pro Tour
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── SERVICES TAB ─── */}
        <TabsContent value="services">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                placeholder="Name oder Slug..." className="pl-9 bg-[#1a1f2a] border-[#2a3040] text-sm h-9" />
            </div>
            <Button onClick={() => setServiceDialog({ open: true, service: { ...newServiceTemplate }, isNew: true })}
              className="bg-purple-600 hover:bg-purple-700 h-9 text-sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Neuer Service
            </Button>
          </div>

          <Card className="bg-[#1a1f2a] border-[#2a3040]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3040] hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Name</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Slug</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Icon</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Highlight</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Features</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center">Aktiv</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicesLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-zinc-500">Laden...</TableCell></TableRow>
                ) : filteredServices.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-zinc-500">Keine Services</TableCell></TableRow>
                ) : filteredServices.map(s => (
                  <TableRow key={s.id} className="border-[#2a3040] hover:bg-[#1e2430]">
                    <TableCell className="font-medium text-white text-sm">{s.name}</TableCell>
                    <TableCell className="text-zinc-500 font-mono text-xs">{s.slug}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{s.icon}</TableCell>
                    <TableCell className="text-zinc-400 text-sm max-w-[200px] truncate">{s.highlight || '—'}</TableCell>
                    <TableCell className="text-zinc-500 text-xs">{s.features?.length || 0} Punkte</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={s.is_active} onCheckedChange={() => toggleServiceActive(s.id, s.is_active)}
                        className="data-[state=checked]:bg-purple-600" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="sm" onClick={() => setServiceDialog({ open: true, service: { ...s }, isNew: false })}
                          className="text-zinc-400 hover:text-white h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteService(s.id)}
                          className="text-red-400/60 hover:text-red-400 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── CATEGORIES TAB ─── */}
        <TabsContent value="categories">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input value={catSearch} onChange={e => setCatSearch(e.target.value)}
                placeholder="Kategorie suchen..." className="pl-9 bg-[#1a1f2a] border-[#2a3040] text-sm h-9" />
            </div>
            <Button onClick={() => setCatDialog({ open: true, cat: { name: '', slug: '', icon: 'MapPin', sort_order: categories.length, is_active: true }, isNew: true })}
              className="bg-cyan-600 hover:bg-cyan-700 h-9 text-sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Neue Kategorie
            </Button>
          </div>

          <Card className="bg-[#1a1f2a] border-[#2a3040]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3040] hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Reihenfolge</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Name</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Slug</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Icon</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Beschreibung</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center">Aktiv</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-zinc-500">Laden...</TableCell></TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-zinc-500">Keine Kategorien</TableCell></TableRow>
                ) : filteredCategories.map(cat => (
                  <TableRow key={cat.id} className="border-[#2a3040] hover:bg-[#1e2430]">
                    <TableCell className="text-zinc-500 text-sm font-mono w-16">{cat.sort_order}</TableCell>
                    <TableCell className="font-medium text-white text-sm">{cat.name}</TableCell>
                    <TableCell className="text-zinc-500 font-mono text-xs">{cat.slug}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{cat.icon || '—'}</TableCell>
                    <TableCell className="text-zinc-400 text-sm max-w-[200px] truncate">{cat.description || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={cat.is_active ?? true} onCheckedChange={() => toggleCategoryActive(cat.id, cat.is_active ?? true)}
                        className="data-[state=checked]:bg-cyan-600" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="sm" onClick={() => setCatDialog({ open: true, cat: { ...cat }, isNew: false })}
                          className="text-zinc-400 hover:text-white h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-400/60 hover:text-red-400 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── JOBS TAB ─── */}
        <TabsContent value="jobs">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                placeholder="Stelle suchen..." className="pl-9 bg-[#1a1f2a] border-[#2a3040] text-sm h-9" />
            </div>
            <Button onClick={() => setJobDialog({ open: true, job: { title: '', department: 'Allgemein', location: 'Düsseldorf', employment_type: 'Vollzeit', description: '', requirements: [], benefits: [], is_active: true, sort_order: jobListings.length }, isNew: true })}
              className="bg-orange-600 hover:bg-orange-700 h-9 text-sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Neue Stelle
            </Button>
          </div>

          <Card className="bg-[#1a1f2a] border-[#2a3040]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3040] hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Titel</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Abteilung</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Standort</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Art</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Gehalt</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center">Aktiv</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-zinc-500">Laden...</TableCell></TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-zinc-500">Keine Stellen</TableCell></TableRow>
                ) : filteredJobs.map(job => (
                  <TableRow key={job.id} className="border-[#2a3040] hover:bg-[#1e2430]">
                    <TableCell className="font-medium text-white text-sm">{job.title}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{job.department}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{job.location}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#252b38] text-zinc-300 text-[10px] border-0">{job.employment_type}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{job.salary_range || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={job.is_active} onCheckedChange={() => toggleJobActive(job.id, job.is_active)}
                        className="data-[state=checked]:bg-orange-600" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="sm" onClick={() => setJobDialog({ open: true, job: { ...job }, isNew: false })}
                          className="text-zinc-400 hover:text-white h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteJob(job.id)}
                          className="text-red-400/60 hover:text-red-400 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── WEEKEND TRIPS TAB ─── */}
        <TabsContent value="weekend">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input value={weekendSearch} onChange={e => setWeekendSearch(e.target.value)}
                placeholder="Ziel suchen..." className="pl-9 bg-[#1a1f2a] border-[#2a3040] text-sm h-9" />
            </div>
            <Button onClick={() => setWeekendDialog({ open: true, trip: { destination: '', slug: '', country: 'Europa', base_price: 0, departure_city: 'Hamburg', departure_point: 'ZOB', highlights: [], inclusions: ['Hin- und Rückfahrt im Komfortbus', 'Kostenloses WLAN an Bord', 'Steckdosen am Sitzplatz', 'Erfahrener Busfahrer', 'Stadtplan & Infomaterial'], not_included: ['Übernachtung', 'Verpflegung', 'Eintritte & Führungen'], tags: [], gallery_images: [], via_stops: [], is_active: true, is_featured: false, sort_order: weekendTrips.length }, isNew: true })}
              className="bg-sky-600 hover:bg-sky-700 h-9 text-sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Neuer Wochenendtrip
            </Button>
          </div>

          <Card className="bg-[#1a1f2a] border-[#2a3040]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3040] hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs w-12">#</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Ziel</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Slug</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Fahrzeit</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Distanz</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Preis</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center">Aktiv</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center">Featured</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekendLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-zinc-500">Laden...</TableCell></TableRow>
                ) : filteredWeekendTrips.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-zinc-500">Keine Wochenendtrips</TableCell></TableRow>
                ) : filteredWeekendTrips.map(trip => (
                  <TableRow key={trip.id} className="border-[#2a3040] hover:bg-[#1e2430]">
                    <TableCell className="text-zinc-500 font-mono text-xs">{trip.sort_order}</TableCell>
                    <TableCell className="font-medium text-white text-sm">
                      <div className="flex items-center gap-2">
                        {trip.image_url && <img src={trip.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                        {trip.destination}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 font-mono text-xs">{trip.slug}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{trip.duration || '—'}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{trip.distance || '—'}</TableCell>
                    <TableCell className="text-sky-400 font-medium text-sm">ab {trip.base_price.toLocaleString('de-DE')} €</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={trip.is_active} onCheckedChange={() => toggleWeekendActive(trip.id, trip.is_active)}
                        className="data-[state=checked]:bg-sky-600" />
                    </TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleWeekendFeatured(trip.id, trip.is_featured)} className="mx-auto block">
                        <Star className={`w-4 h-4 transition-colors ${trip.is_featured ? 'text-amber-400 fill-amber-400' : 'text-zinc-600 hover:text-amber-400/50'}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="sm" onClick={() => setWeekendDialog({ open: true, trip: { ...trip }, isNew: false })}
                          className="text-zinc-400 hover:text-white h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteWeekendTrip(trip.id)}
                          className="text-red-400/60 hover:text-red-400 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── CMS CONTENT TAB ─── */}
        <TabsContent value="content">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input value={contentSearch} onChange={e => setContentSearch(e.target.value)}
                placeholder="Section Key oder Titel..." className="pl-9 bg-[#1a1f2a] border-[#2a3040] text-sm h-9" />
            </div>
          </div>

          <div className="grid gap-3">
            {contentLoading ? (
              <Card className="bg-[#1a1f2a] border-[#2a3040] p-12 text-center text-zinc-500">Laden...</Card>
            ) : filteredContent.length === 0 ? (
              <Card className="bg-[#1a1f2a] border-[#2a3040] p-12 text-center text-zinc-500">Keine Inhalte</Card>
            ) : filteredContent.map(item => (
              <Card key={item.id} className="bg-[#1a1f2a] border-[#2a3040] hover:border-[#3a4050] transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{item.section_key}</code>
                        <Badge className={item.is_active ? 'bg-emerald-600/20 text-emerald-400 border-0 text-[10px]' : 'bg-zinc-700/50 text-zinc-400 border-0 text-[10px]'}>
                          {item.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-600 text-[10px] uppercase">Titel</span>
                          <p className="text-white truncate">{item.title || '—'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-600 text-[10px] uppercase">Untertitel</span>
                          <p className="text-zinc-300 truncate">{item.subtitle || '—'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-600 text-[10px] uppercase">Inhalt</span>
                          <p className="text-zinc-400 truncate">{item.content || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setContentDialog({ open: true, item: { ...item } })}
                      className="text-zinc-400 hover:text-white h-8 w-8 p-0 shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── DIALOGS ─── */}

      {/* Tour Edit */}
      <Dialog open={tourDialog.open} onOpenChange={open => !open && setTourDialog({ open: false, tour: null, isNew: false })}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tourDialog.isNew ? 'Neue Reise' : 'Reise bearbeiten'}</DialogTitle>
            <DialogDescription className="text-zinc-500">Schnellbearbeitung der Reisedaten</DialogDescription>
          </DialogHeader>
          {tourDialog.tour && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Reiseziel *</Label>
                  <Input value={tourDialog.tour.destination || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, destination: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Region</Label>
                  <Input value={tourDialog.tour.location || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, location: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Dauer (Tage)</Label>
                  <Input type="number" value={tourDialog.tour.duration_days || 7} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, duration_days: parseInt(e.target.value) } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Preis ab (€)</Label>
                  <Input type="number" value={tourDialog.tour.price_from || 0} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, price_from: parseFloat(e.target.value) } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Rabatt (%)</Label>
                  <Input type="number" value={tourDialog.tour.discount_percent || 0} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, discount_percent: parseInt(e.target.value) } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Hinreise</Label>
                  <Input type="date" value={tourDialog.tour.departure_date || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, departure_date: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Rückreise</Label>
                  <Input type="date" value={tourDialog.tour.return_date || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, return_date: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Beschreibung</Label>
                <Textarea value={tourDialog.tour.description || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, description: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={3} />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Highlights (kommagetrennt)</Label>
                <Input value={tourDialog.tour.highlights?.join(', ') || ''} onChange={e => setTourDialog(p => ({ ...p, tour: { ...p.tour!, highlights: e.target.value.split(',').map(h => h.trim()).filter(Boolean) } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" placeholder="Strand, Altstadt, Kulinarik" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={tourDialog.tour.is_active} onCheckedChange={c => setTourDialog(p => ({ ...p, tour: { ...p.tour!, is_active: c } }))} />
                  <Label className="text-sm">Aktiv</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={tourDialog.tour.is_featured} onCheckedChange={c => setTourDialog(p => ({ ...p, tour: { ...p.tour!, is_featured: c } }))} />
                  <Label className="text-sm">Hervorgehoben</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTourDialog({ open: false, tour: null, isNew: false })} className="border-[#2a3040]">Abbrechen</Button>
            <Button onClick={handleSaveTour} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">{isSaving ? 'Speichern...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Edit */}
      <Dialog open={serviceDialog.open} onOpenChange={open => !open && setServiceDialog({ open: false, service: null, isNew: false })}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{serviceDialog.isNew ? 'Neuer Service' : 'Service bearbeiten'}</DialogTitle>
          </DialogHeader>
          {serviceDialog.service && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-zinc-400 text-xs">Name *</Label>
                <Input value={serviceDialog.service.name || ''} onChange={e => setServiceDialog(p => ({
                  ...p, service: { ...p.service!, name: e.target.value, slug: p.service?.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[äöü]/g, c => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[c] || c)) }
                }))} className="bg-[#151920] border-[#2a3040] mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Slug</Label>
                <Input value={serviceDialog.service.slug || ''} onChange={e => setServiceDialog(p => ({ ...p, service: { ...p.service!, slug: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1 font-mono" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Icon</Label>
                <Select value={serviceDialog.service.icon || 'Users'} onValueChange={v => setServiceDialog(p => ({ ...p, service: { ...p.service!, icon: v } }))}>
                  <SelectTrigger className="bg-[#151920] border-[#2a3040] mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                    <SelectItem value="School">School</SelectItem>
                    <SelectItem value="Users">Users</SelectItem>
                    <SelectItem value="MapPin">MapPin</SelectItem>
                    <SelectItem value="Trophy">Trophy</SelectItem>
                    <SelectItem value="Plane">Plane</SelectItem>
                    <SelectItem value="PartyPopper">PartyPopper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Beschreibung</Label>
                <Textarea value={serviceDialog.service.description || ''} onChange={e => setServiceDialog(p => ({ ...p, service: { ...p.service!, description: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={3} />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Highlight</Label>
                <Input value={serviceDialog.service.highlight || ''} onChange={e => setServiceDialog(p => ({ ...p, service: { ...p.service!, highlight: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={serviceDialog.service.is_active} onCheckedChange={c => setServiceDialog(p => ({ ...p, service: { ...p.service!, is_active: c } }))} />
                <Label className="text-sm">Aktiv</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialog({ open: false, service: null, isNew: false })} className="border-[#2a3040]">Abbrechen</Button>
            <Button onClick={handleSaveService} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">{isSaving ? 'Speichern...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog.open} onOpenChange={open => !open && setCatDialog({ open: false, cat: null, isNew: false })}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] text-white">
          <DialogHeader>
            <DialogTitle>{catDialog.isNew ? 'Neue Kategorie' : 'Kategorie bearbeiten'}</DialogTitle>
          </DialogHeader>
          {catDialog.cat && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-zinc-400 text-xs">Name *</Label>
                <Input value={catDialog.cat.name || ''} onChange={e => setCatDialog(p => ({ ...p, cat: { ...p.cat!, name: e.target.value, slug: p.cat?.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[äöü]/g, c => ({'ä':'ae','ö':'oe','ü':'ue'}[c] || c)) } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Slug</Label>
                <Input value={catDialog.cat.slug || ''} onChange={e => setCatDialog(p => ({ ...p, cat: { ...p.cat!, slug: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1 font-mono" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Beschreibung</Label>
                <Textarea value={catDialog.cat.description || ''} onChange={e => setCatDialog(p => ({ ...p, cat: { ...p.cat!, description: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Icon</Label>
                  <Input value={catDialog.cat.icon || ''} onChange={e => setCatDialog(p => ({ ...p, cat: { ...p.cat!, icon: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" placeholder="MapPin" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Reihenfolge</Label>
                  <Input type="number" value={catDialog.cat.sort_order ?? 0} onChange={e => setCatDialog(p => ({ ...p, cat: { ...p.cat!, sort_order: parseInt(e.target.value) } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={catDialog.cat.is_active ?? true} onCheckedChange={c => setCatDialog(p => ({ ...p, cat: { ...p.cat!, is_active: c } }))} />
                <Label className="text-sm">Aktiv</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog({ open: false, cat: null, isNew: false })} className="border-[#2a3040]">Abbrechen</Button>
            <Button onClick={handleSaveCategory} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">{isSaving ? 'Speichern...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Dialog */}
      <Dialog open={jobDialog.open} onOpenChange={open => !open && setJobDialog({ open: false, job: null, isNew: false })}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{jobDialog.isNew ? 'Neue Stelle' : 'Stelle bearbeiten'}</DialogTitle>
          </DialogHeader>
          {jobDialog.job && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-zinc-400 text-xs">Titel *</Label>
                <Input value={jobDialog.job.title || ''} onChange={e => setJobDialog(p => ({ ...p, job: { ...p.job!, title: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. Busfahrer/in (m/w/d)" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Abteilung</Label>
                  <Input value={jobDialog.job.department || 'Allgemein'} onChange={e => setJobDialog(p => ({ ...p, job: { ...p.job!, department: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Standort</Label>
                  <Input value={jobDialog.job.location || 'Düsseldorf'} onChange={e => setJobDialog(p => ({ ...p, job: { ...p.job!, location: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Anstellungsart</Label>
                  <Select value={jobDialog.job.employment_type || 'Vollzeit'} onValueChange={v => setJobDialog(p => ({ ...p, job: { ...p.job!, employment_type: v } }))}>
                    <SelectTrigger className="bg-[#151920] border-[#2a3040] mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                      <SelectItem value="Vollzeit">Vollzeit</SelectItem>
                      <SelectItem value="Teilzeit">Teilzeit</SelectItem>
                      <SelectItem value="Minijob">Minijob</SelectItem>
                      <SelectItem value="Aushilfe">Aushilfe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Beschreibung</Label>
                <Textarea value={jobDialog.job.description || ''} onChange={e => setJobDialog(p => ({ ...p, job: { ...p.job!, description: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={3} />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Gehaltsspanne</Label>
                <Input value={jobDialog.job.salary_range || ''} onChange={e => setJobDialog(p => ({ ...p, job: { ...p.job!, salary_range: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. 2.500 – 3.200€/Monat" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Anforderungen (kommagetrennt)</Label>
                <Textarea value={(jobDialog.job.requirements || []).join(', ')} onChange={e => setJobDialog(p => ({ ...p, job: { ...p.job!, requirements: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={2} placeholder="Führerschein Klasse D, Berufserfahrung" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={jobDialog.job.is_active ?? true} onCheckedChange={c => setJobDialog(p => ({ ...p, job: { ...p.job!, is_active: c } }))} />
                <Label className="text-sm">Aktiv</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialog({ open: false, job: null, isNew: false })} className="border-[#2a3040]">Abbrechen</Button>
            <Button onClick={handleSaveJob} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700">{isSaving ? 'Speichern...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weekend Trip Dialog */}
      <Dialog open={weekendDialog.open} onOpenChange={open => !open && setWeekendDialog({ open: false, trip: null, isNew: false })}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{weekendDialog.isNew ? 'Neuer Wochenendtrip' : 'Wochenendtrip bearbeiten'}</DialogTitle>
            <DialogDescription className="text-zinc-500">Ziel, Beschreibung, Preis und Leistungen verwalten</DialogDescription>
          </DialogHeader>
          {weekendDialog.trip && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Ziel *</Label>
                  <Input value={weekendDialog.trip.destination || ''} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, destination: e.target.value, slug: p.trip?.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[äöü]/g, c => ({'ä':'ae','ö':'oe','ü':'ue'}[c] || c)) } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. Kopenhagen" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Slug</Label>
                  <Input value={weekendDialog.trip.slug || ''} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, slug: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Land</Label>
                  <Input value={weekendDialog.trip.country || 'Europa'} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, country: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Fahrzeit</Label>
                  <Input value={weekendDialog.trip.duration || ''} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, duration: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. 7,5 Std." />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Distanz</Label>
                  <Input value={weekendDialog.trip.distance || ''} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, distance: e.target.value } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. 586 km" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Basispreis (€) *</Label>
                  <Input type="number" value={weekendDialog.trip.base_price || 0} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, base_price: parseFloat(e.target.value) } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Reihenfolge</Label>
                  <Input type="number" value={weekendDialog.trip.sort_order || 0} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, sort_order: parseInt(e.target.value) } }))}
                    className="bg-[#151920] border-[#2a3040] mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Bild-URL</Label>
                <Input value={weekendDialog.trip.image_url || ''} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, image_url: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" placeholder="https://images.unsplash.com/..." />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Kurzbeschreibung</Label>
                <Textarea value={weekendDialog.trip.short_description || ''} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, short_description: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Ausführliche Beschreibung</Label>
                <Textarea value={weekendDialog.trip.full_description || ''} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, full_description: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={4} />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Highlights (kommagetrennt)</Label>
                <Input value={(weekendDialog.trip.highlights || []).join(', ')} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" placeholder="Nyhavn, Tivoli, Meerjungfrau" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Inklusive Leistungen (kommagetrennt)</Label>
                <Textarea value={(weekendDialog.trip.inclusions || []).join(', ')} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, inclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Nicht enthalten (kommagetrennt)</Label>
                <Input value={(weekendDialog.trip.not_included || []).join(', ')} onChange={e => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, not_included: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" placeholder="Übernachtung, Verpflegung" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={weekendDialog.trip.is_active ?? true} onCheckedChange={c => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, is_active: c } }))} />
                  <Label className="text-sm">Aktiv</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={weekendDialog.trip.is_featured ?? false} onCheckedChange={c => setWeekendDialog(p => ({ ...p, trip: { ...p.trip!, is_featured: c } }))} />
                  <Label className="text-sm">Featured</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeekendDialog({ open: false, trip: null, isNew: false })} className="border-[#2a3040]">Abbrechen</Button>
            <Button onClick={handleSaveWeekendTrip} disabled={isSaving} className="bg-sky-600 hover:bg-sky-700">{isSaving ? 'Speichern...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Edit Dialog */}
      <Dialog open={contentDialog.open} onOpenChange={open => !open && setContentDialog({ open: false, item: null })}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Inhalt bearbeiten</DialogTitle>
            {contentDialog.item && (
              <code className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded inline-block mt-1">
                {contentDialog.item.section_key}
              </code>
            )}
          </DialogHeader>
          {contentDialog.item && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-zinc-400 text-xs">Titel</Label>
                <Input value={contentDialog.item.title || ''} onChange={e => setContentDialog(p => ({ ...p, item: { ...p.item, title: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Untertitel</Label>
                <Input value={contentDialog.item.subtitle || ''} onChange={e => setContentDialog(p => ({ ...p, item: { ...p.item, subtitle: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Inhalt</Label>
                <Textarea value={contentDialog.item.content || ''} onChange={e => setContentDialog(p => ({ ...p, item: { ...p.item, content: e.target.value } }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" rows={5} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={contentDialog.item.is_active} onCheckedChange={c => setContentDialog(p => ({ ...p, item: { ...p.item, is_active: c } }))} />
                <Label className="text-sm">Aktiv</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentDialog({ open: false, item: null })} className="border-[#2a3040]">Abbrechen</Button>
            <Button onClick={handleSaveContent} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">{isSaving ? 'Speichern...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCMS;
