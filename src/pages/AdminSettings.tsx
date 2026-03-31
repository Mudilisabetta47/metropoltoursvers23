import { useState, useEffect } from "react";
import {
  Save, CreditCard, Mail, Building2, Route, Users,
  Bell, FileText, Activity, Truck, Shield, UserCheck,
  MapPin, Link2, Globe, Navigation, Warehouse, Plus, Trash2, Edit2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";

type SettingsSection =
  | "general"
  | "booking"
  | "routes"
  | "tours"
  | "finance"
  | "crm"
  | "staff"
  | "notifications"
  | "templates"
  | "operations"
  | "vehicles"
  | "depots"
  | "legal";

const sections: { key: SettingsSection; label: string; icon: any; description: string }[] = [
  { key: "general", label: "Allgemein", icon: Building2, description: "Firmendaten & Grundeinstellungen" },
  { key: "depots", label: "Betriebshöfe", icon: Warehouse, description: "Standorte, Abfertigungen & Depots" },
  { key: "booking", label: "Buchung", icon: FileText, description: "Buchungssystem & Regeln" },
  { key: "routes", label: "Routen & Fahrten", icon: Route, description: "Strecken, Haltestellen, Preise" },
  { key: "tours", label: "Touren & Vorlagen", icon: MapPin, description: "Standard-Haltestellen, Kombination & Entfernungen" },
  { key: "finance", label: "Finanzen", icon: CreditCard, description: "Preise, Rabatte, Rechnungen" },
  { key: "crm", label: "Kunden / CRM", icon: UserCheck, description: "Kundenverwaltung & Datenschutz" },
  { key: "staff", label: "Mitarbeiter & Rollen", icon: Users, description: "Rollen, Rechte, Sicherheit" },
  { key: "notifications", label: "Benachrichtigungen", icon: Bell, description: "E-Mail, SMS, Eskalation" },
  { key: "templates", label: "Vorlagen", icon: Mail, description: "E-Mail- & Dokumentvorlagen" },
  { key: "operations", label: "Leitstand / Ops", icon: Activity, description: "Tracking, Scanner, Alarme" },
  { key: "vehicles", label: "Fahrzeuge", icon: Truck, description: "Flotte, Wartung, Disposition" },
  { key: "legal", label: "Rechtstexte", icon: Shield, description: "AGB, Datenschutz, Impressum bearbeiten" },
];

/* ─── Field row helper ─── */
const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-zinc-400">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
  </div>
);

const SectionCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Card className="bg-[#151920] border-[#252b38]">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm text-zinc-200">{title}</CardTitle>
      {description && <CardDescription className="text-xs text-zinc-500">{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const SaveButton = ({ onClick }: { onClick: () => void }) => (
  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={onClick}>
    <Save className="w-3 h-3 mr-1" /> Speichern
  </Button>
);

const AdminSettings = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  /* ─── State for all sections ─── */
  const [general, setGeneral] = useState({
    name: "METROPOL TOURS GmbH", address: "Musterstraße 1, 12345 Berlin",
    phone: "+49 30 123456", email: "info@metours.de", website: "www.metours.de",
    tax_id: "DE123456789", register: "HRB 12345, Amtsgericht Berlin", ceo: "Max Mustermann",
    timezone: "Europe/Berlin", language: "de", currency: "EUR", date_format: "DD.MM.YYYY",
  });

  const [booking, setBooking] = useState({
    prefix: "TRB", auto_confirm: false, manual_approval: true, min_participants: "1",
    max_participants: "50", booking_deadline_hours: "24", free_cancel_hours: "48",
    waitlist: false, instant_confirm: false, reservation_timeout_min: "15",
    auto_status_change: true,
  });

  const [routeSettings, setRouteSettings] = useState({
    default_vehicle_type: "Reisebus", default_capacity: "50", buffer_minutes: "15",
    default_pause_minutes: "30", seasonal_pricing: false, surcharge_enabled: true,
  });

  const [finance, setFinance] = useState({
    default_price: "49.00", child_discount: "50", senior_discount: "10", group_discount: "15",
    coupons_enabled: true, cancel_fee_percent: "20", deposit_required: false, deposit_percent: "30",
    invoice_prefix: "RE", dunning_enabled: true, dunning_days_1: "7", dunning_days_2: "14",
    dunning_days_3: "21", tax_rate: "19", auto_invoice: true,
    pricing_by_distance: true, pricing_by_season: false, pricing_by_occupancy: true,
  });

  const [crm, setCrm] = useState({
    required_fields: "name,email,phone", business_customers: true, customer_groups: true,
    blacklist: true, auto_customer_number: true, notes_enabled: true, documents_enabled: true,
    gdpr_consent: true, newsletter_optin: false,
  });

  const [staff, setStaff] = useState({
    two_factor: false, session_timeout_min: "480", password_min_length: "8",
    password_require_special: true,
  });

  const [notifications, setNotifications] = useState({
    email_new_booking: true, email_cancel: true, email_payment_overdue: true,
    email_delay: false, email_incident: true, daily_summary: true,
    sms_enabled: false, whatsapp_enabled: false,
    escalation_enabled: true, escalation_delay_min: "30",
  });

  const [templates, setTemplates] = useState({
    footer_text: "METROPOL TOURS GmbH · www.metours.de",
    signature: "Ihr METROPOL TOURS Team",
  });

  const [ops, setOps] = useState({
    refresh_interval: "30", live_tracking: true, scanner_monitoring: true,
    delay_warn_min: "10", delay_critical_min: "30", gps_timeout_min: "5",
    vehicle_offline_min: "15",
  });

  const [vehicles, setVehicles] = useState({
    number_prefix: "MT-", default_seats: "50", maintenance_interval_km: "15000",
    tuev_reminder_days: "30",
  });

  // Tour templates & combination state
  const [tourTemplates, setTourTemplates] = useState({
    auto_combine: true,
    combine_exclude_countries: "Deutschland",
    default_stops: [
      { city: "Hamburg", location: "Hamburg ZOB", surcharge: 29, distance_km: 0, sort_order: 1 },
      { city: "Bremen", location: "Bremen ZOB", surcharge: 19, distance_km: 120, sort_order: 2 },
      { city: "Hannover", location: "Hannover ZOB", surcharge: 0, distance_km: 290, sort_order: 3 },
    ],
    distance_templates: [
      { from: "Hamburg", to: "Bremen", km: 120, hours: 1.5 },
      { from: "Bremen", to: "Hannover", km: 170, hours: 2.0 },
      { from: "Hamburg", to: "Hannover", km: 290, hours: 3.0 },
      { from: "Hannover", to: "Lloret de Mar", km: 1650, hours: 18 },
      { from: "Hannover", to: "Novalja", km: 1200, hours: 14 },
      { from: "Hannover", to: "Istanbul", km: 2200, hours: 26 },
      { from: "Hannover", to: "Sanremo", km: 1100, hours: 12 },
      { from: "Hannover", to: "Österreich", km: 750, hours: 8 },
    ],
  });

  const [toursList, setToursList] = useState<{ id: string; destination: string; country: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Depots state
  const [depots, setDepots] = useState<any[]>([]);
  const [depotForm, setDepotForm] = useState({ name: "", code: "", city: "", address: "", postal_code: "", phone: "", email: "", contact_person: "", capacity_buses: 0, notes: "", is_active: true });
  const [editingDepot, setEditingDepot] = useState<string | null>(null);
  const [showDepotForm, setShowDepotForm] = useState(false);

  useEffect(() => {
    loadTours();
    loadSettings();
    loadDepots();
  }, []);

  const loadDepots = async () => {
    const { data } = await supabase.from("depots").select("*").order("name");
    if (data) setDepots(data);
  };

  const saveDepot = async () => {
    if (!depotForm.name || !depotForm.code || !depotForm.city) {
      toast({ title: "Name, Kürzel und Stadt sind Pflicht", variant: "destructive" });
      return;
    }
    let error;
    if (editingDepot) {
      ({ error } = await supabase.from("depots").update(depotForm).eq("id", editingDepot));
    } else {
      ({ error } = await supabase.from("depots").insert(depotForm));
    }
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingDepot ? "Standort aktualisiert" : "Standort angelegt" });
      setShowDepotForm(false);
      setEditingDepot(null);
      setDepotForm({ name: "", code: "", city: "", address: "", postal_code: "", phone: "", email: "", contact_person: "", capacity_buses: 0, notes: "", is_active: true });
      loadDepots();
    }
  };

  const deleteDepot = async (id: string) => {
    const { error } = await supabase.from("depots").delete().eq("id", id);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { toast({ title: "Standort gelöscht" }); loadDepots(); }
  };

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('section_key, settings');
      if (data) {
        const map: Record<string, any> = {};
        data.forEach(row => { map[row.section_key] = row.settings; });
        if (map.general) setGeneral(p => ({ ...p, ...map.general }));
        if (map.booking) setBooking(p => ({ ...p, ...map.booking }));
        if (map.routes) setRouteSettings(p => ({ ...p, ...map.routes }));
        if (map.finance) setFinance(p => ({ ...p, ...map.finance }));
        if (map.crm) setCrm(p => ({ ...p, ...map.crm }));
        if (map.staff) setStaff(p => ({ ...p, ...map.staff }));
        if (map.notifications) setNotifications(p => ({ ...p, ...map.notifications }));
        if (map.templates) setTemplates(p => ({ ...p, ...map.templates }));
        if (map.operations) setOps(p => ({ ...p, ...map.operations }));
        if (map.vehicles) setVehicles(p => ({ ...p, ...map.vehicles }));
        if (map.tours) setTourTemplates(p => ({ ...p, ...map.tours }));
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadTours = async () => {
    const { data } = await supabase
      .from('package_tours')
      .select('id, destination, country')
      .eq('is_active', true)
      .order('country');
    if (data) {
      setToursList(data);
    }
  };

  const sectionStateMap: Record<string, any> = {
    general, booking, routes: routeSettings, finance, crm, staff,
    notifications, templates, operations: ops, vehicles, tours: tourTemplates,
  };

  const handleSave = async (label: string) => {
    // Find which section_key maps to this label
    const sectionKeyMap: Record<string, string> = {
      'Firmendaten': 'general', 'Regionale Einstellungen': 'general',
      'Buchungseinstellungen': 'booking', 'Routen-Einstellungen': 'routes',
      'Finanz-Einstellungen': 'finance', 'CRM-Einstellungen': 'crm',
      'Mitarbeiter-Einstellungen': 'staff', 'Benachrichtigungen': 'notifications',
      'Vorlagen': 'templates', 'Leitstand-Einstellungen': 'operations',
      'Fahrzeug-Einstellungen': 'vehicles', 'Standard-Zustiegsorte': 'tours',
      'Entfernungsvorlagen': 'tours', 'Tour-Kombination': 'tours',
    };
    const sectionKey = sectionKeyMap[label] || activeSection;
    const settings = sectionStateMap[sectionKey];

    setIsSaving(true);
    const { error } = await supabase.from('app_settings').upsert(
      { section_key: sectionKey, settings, updated_at: new Date().toISOString() },
      { onConflict: 'section_key' }
    );
    setIsSaving(false);

    if (error) {
      toast({ title: `❌ Fehler beim Speichern`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `✅ ${label} gespeichert` });
    }
  };


  const inputCls = "bg-[#1a1f2a] border-[#2a3040] text-zinc-100 h-9 text-sm";

  /* ─── Section renderers ─── */
  const renderGeneral = () => (
    <div className="space-y-4">
      <SectionCard title="Firmendaten" description="Stammdaten des Unternehmens für Rechnungen und Impressum">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Firmenname"><Input value={general.name} onChange={e => setGeneral(p => ({ ...p, name: e.target.value }))} className={inputCls} /></Field>
          <Field label="Geschäftsführer"><Input value={general.ceo} onChange={e => setGeneral(p => ({ ...p, ceo: e.target.value }))} className={inputCls} /></Field>
          <Field label="Adresse"><Input value={general.address} onChange={e => setGeneral(p => ({ ...p, address: e.target.value }))} className={inputCls} /></Field>
          <Field label="Telefon"><Input value={general.phone} onChange={e => setGeneral(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></Field>
          <Field label="E-Mail"><Input value={general.email} onChange={e => setGeneral(p => ({ ...p, email: e.target.value }))} className={inputCls} /></Field>
          <Field label="Website"><Input value={general.website} onChange={e => setGeneral(p => ({ ...p, website: e.target.value }))} className={inputCls} /></Field>
          <Field label="USt-ID / Steuernummer"><Input value={general.tax_id} onChange={e => setGeneral(p => ({ ...p, tax_id: e.target.value }))} className={inputCls} /></Field>
          <Field label="Handelsregister"><Input value={general.register} onChange={e => setGeneral(p => ({ ...p, register: e.target.value }))} className={inputCls} /></Field>
        </div>
        <SaveButton onClick={() => handleSave("Firmendaten")} />
      </SectionCard>

      <SectionCard title="Regionale Einstellungen" description="Zeitzone, Sprache, Währung und Datumsformat">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Zeitzone">
            <Select value={general.timezone} onValueChange={v => setGeneral(p => ({ ...p, timezone: v }))}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Europe/Berlin">Europe/Berlin (MEZ)</SelectItem><SelectItem value="Europe/Vienna">Europe/Vienna</SelectItem><SelectItem value="Europe/Zurich">Europe/Zurich</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Sprache">
            <Select value={general.language} onValueChange={v => setGeneral(p => ({ ...p, language: v }))}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="de">Deutsch</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Währung">
            <Select value={general.currency} onValueChange={v => setGeneral(p => ({ ...p, currency: v }))}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="CHF">CHF</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Datumsformat">
            <Select value={general.date_format} onValueChange={v => setGeneral(p => ({ ...p, date_format: v }))}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem><SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem></SelectContent>
            </Select>
          </Field>
        </div>
        <SaveButton onClick={() => handleSave("Regionale Einstellungen")} />
      </SectionCard>
    </div>
  );

  const renderBooking = () => (
    <div className="space-y-4">
      <SectionCard title="Buchungsnummern & Ablauf" description="Automatische Nummernvergabe und Buchungsprozess">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Buchungsnr.-Prefix" hint="z. B. TRB-2026-000001"><Input value={booking.prefix} onChange={e => setBooking(p => ({ ...p, prefix: e.target.value }))} className={inputCls} /></Field>
          <Field label="Reservierungs-Timeout (Min.)" hint="Wie lange bleibt eine Reservierung offen"><Input type="number" value={booking.reservation_timeout_min} onChange={e => setBooking(p => ({ ...p, reservation_timeout_min: e.target.value }))} className={inputCls} /></Field>
          <Field label="Buchungsfrist vor Abfahrt (Std.)"><Input type="number" value={booking.booking_deadline_hours} onChange={e => setBooking(p => ({ ...p, booking_deadline_hours: e.target.value }))} className={inputCls} /></Field>
          <Field label="Kostenlose Stornierung bis (Std.)"><Input type="number" value={booking.free_cancel_hours} onChange={e => setBooking(p => ({ ...p, free_cancel_hours: e.target.value }))} className={inputCls} /></Field>
          <Field label="Min. Teilnehmer"><Input type="number" value={booking.min_participants} onChange={e => setBooking(p => ({ ...p, min_participants: e.target.value }))} className={inputCls} /></Field>
          <Field label="Max. Teilnehmer"><Input type="number" value={booking.max_participants} onChange={e => setBooking(p => ({ ...p, max_participants: e.target.value }))} className={inputCls} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Automatisierung" description="Bestätigungs- und Statusregeln">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Sofortbestätigung (ohne manuelle Prüfung)</Label><Switch checked={booking.instant_confirm} onCheckedChange={v => setBooking(p => ({ ...p, instant_confirm: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Manuelle Freigabe erforderlich</Label><Switch checked={booking.manual_approval} onCheckedChange={v => setBooking(p => ({ ...p, manual_approval: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Warteliste aktivieren</Label><Switch checked={booking.waitlist} onCheckedChange={v => setBooking(p => ({ ...p, waitlist: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Automatische Statuswechsel</Label><Switch checked={booking.auto_status_change} onCheckedChange={v => setBooking(p => ({ ...p, auto_status_change: v }))} /></div>
        </div>
        <SaveButton onClick={() => handleSave("Buchungseinstellungen")} />
      </SectionCard>
    </div>
  );

  const renderRoutes = () => (
    <div className="space-y-4">
      <SectionCard title="Standard-Einstellungen" description="Voreinstellungen für neue Routen und Fahrten">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Standard-Fahrzeugtyp"><Input value={routeSettings.default_vehicle_type} onChange={e => setRouteSettings(p => ({ ...p, default_vehicle_type: e.target.value }))} className={inputCls} /></Field>
          <Field label="Standard-Kapazität (Plätze)"><Input type="number" value={routeSettings.default_capacity} onChange={e => setRouteSettings(p => ({ ...p, default_capacity: e.target.value }))} className={inputCls} /></Field>
          <Field label="Fahrplan-Pufferzeit (Min.)"><Input type="number" value={routeSettings.buffer_minutes} onChange={e => setRouteSettings(p => ({ ...p, buffer_minutes: e.target.value }))} className={inputCls} /></Field>
          <Field label="Standard-Pausenzeit (Min.)"><Input type="number" value={routeSettings.default_pause_minutes} onChange={e => setRouteSettings(p => ({ ...p, default_pause_minutes: e.target.value }))} className={inputCls} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Preisregeln" description="Saisonpreise und Sonderzuschläge">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Saisonpreise aktivieren</Label><Switch checked={routeSettings.seasonal_pricing} onCheckedChange={v => setRouteSettings(p => ({ ...p, seasonal_pricing: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Sonderzuschläge aktivieren</Label><Switch checked={routeSettings.surcharge_enabled} onCheckedChange={v => setRouteSettings(p => ({ ...p, surcharge_enabled: v }))} /></div>
        </div>
        <SaveButton onClick={() => handleSave("Routen-Einstellungen")} />
      </SectionCard>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-4">
      <SectionCard title="Preise & Rabatte" description="Standardpreise, Ermäßigungen und Gutscheine">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Standardpreis (€)"><Input type="number" value={finance.default_price} onChange={e => setFinance(p => ({ ...p, default_price: e.target.value }))} className={inputCls} /></Field>
          <Field label="Kinderrabatt (%)"><Input type="number" value={finance.child_discount} onChange={e => setFinance(p => ({ ...p, child_discount: e.target.value }))} className={inputCls} /></Field>
          <Field label="Seniorenrabatt (%)"><Input type="number" value={finance.senior_discount} onChange={e => setFinance(p => ({ ...p, senior_discount: e.target.value }))} className={inputCls} /></Field>
          <Field label="Gruppenrabatt (%)"><Input type="number" value={finance.group_discount} onChange={e => setFinance(p => ({ ...p, group_discount: e.target.value }))} className={inputCls} /></Field>
          <Field label="Stornogebühr (%)"><Input type="number" value={finance.cancel_fee_percent} onChange={e => setFinance(p => ({ ...p, cancel_fee_percent: e.target.value }))} className={inputCls} /></Field>
          <Field label="MwSt-Satz (%)"><Input type="number" value={finance.tax_rate} onChange={e => setFinance(p => ({ ...p, tax_rate: e.target.value }))} className={inputCls} /></Field>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Gutscheincodes erlauben</Label><Switch checked={finance.coupons_enabled} onCheckedChange={v => setFinance(p => ({ ...p, coupons_enabled: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Anzahlung erforderlich</Label><Switch checked={finance.deposit_required} onCheckedChange={v => setFinance(p => ({ ...p, deposit_required: v }))} /></div>
          {finance.deposit_required && (
            <Field label="Anzahlung (%)"><Input type="number" value={finance.deposit_percent} onChange={e => setFinance(p => ({ ...p, deposit_percent: e.target.value }))} className={inputCls} /></Field>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Rechnungen & Mahnwesen" description="Rechnungsnummern, automatische Rechnungen und Mahnstufen">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Rechnungsnr.-Prefix" hint="z. B. RE-2026-000001"><Input value={finance.invoice_prefix} onChange={e => setFinance(p => ({ ...p, invoice_prefix: e.target.value }))} className={inputCls} /></Field>
          <Field label="Mahnstufe 1 nach (Tagen)"><Input type="number" value={finance.dunning_days_1} onChange={e => setFinance(p => ({ ...p, dunning_days_1: e.target.value }))} className={inputCls} /></Field>
          <Field label="Mahnstufe 2 nach (Tagen)"><Input type="number" value={finance.dunning_days_2} onChange={e => setFinance(p => ({ ...p, dunning_days_2: e.target.value }))} className={inputCls} /></Field>
          <Field label="Mahnstufe 3 nach (Tagen)"><Input type="number" value={finance.dunning_days_3} onChange={e => setFinance(p => ({ ...p, dunning_days_3: e.target.value }))} className={inputCls} /></Field>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Mahnwesen aktivieren</Label><Switch checked={finance.dunning_enabled} onCheckedChange={v => setFinance(p => ({ ...p, dunning_enabled: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Automatische Rechnungserstellung</Label><Switch checked={finance.auto_invoice} onCheckedChange={v => setFinance(p => ({ ...p, auto_invoice: v }))} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Preislogik" description="Dynamische Preisanpassung nach verschiedenen Kriterien">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Preis nach Strecke (Distanz)</Label><Switch checked={finance.pricing_by_distance} onCheckedChange={v => setFinance(p => ({ ...p, pricing_by_distance: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Preis nach Saison</Label><Switch checked={finance.pricing_by_season} onCheckedChange={v => setFinance(p => ({ ...p, pricing_by_season: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Preis nach Auslastung</Label><Switch checked={finance.pricing_by_occupancy} onCheckedChange={v => setFinance(p => ({ ...p, pricing_by_occupancy: v }))} /></div>
        </div>
        <SaveButton onClick={() => handleSave("Finanz-Einstellungen")} />
      </SectionCard>
    </div>
  );

  const renderCRM = () => (
    <div className="space-y-4">
      <SectionCard title="Kundenverwaltung" description="Pflichtfelder, Kundengruppen und Kundennummern">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Pflichtfelder" hint="Kommagetrennt: name, email, phone"><Input value={crm.required_fields} onChange={e => setCrm(p => ({ ...p, required_fields: e.target.value }))} className={inputCls} /></Field>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Firmenkunden erlauben</Label><Switch checked={crm.business_customers} onCheckedChange={v => setCrm(p => ({ ...p, business_customers: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Kundengruppen aktivieren</Label><Switch checked={crm.customer_groups} onCheckedChange={v => setCrm(p => ({ ...p, customer_groups: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Automatische Kundennummer</Label><Switch checked={crm.auto_customer_number} onCheckedChange={v => setCrm(p => ({ ...p, auto_customer_number: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Blacklist / Sperrliste</Label><Switch checked={crm.blacklist} onCheckedChange={v => setCrm(p => ({ ...p, blacklist: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Notizfelder am Kunden</Label><Switch checked={crm.notes_enabled} onCheckedChange={v => setCrm(p => ({ ...p, notes_enabled: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Dokumente am Kunden speichern</Label><Switch checked={crm.documents_enabled} onCheckedChange={v => setCrm(p => ({ ...p, documents_enabled: v }))} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Datenschutz" description="DSGVO-Einwilligung und Newsletter">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Datenschutz-Einwilligung erforderlich</Label><Switch checked={crm.gdpr_consent} onCheckedChange={v => setCrm(p => ({ ...p, gdpr_consent: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Newsletter-Opt-in anbieten</Label><Switch checked={crm.newsletter_optin} onCheckedChange={v => setCrm(p => ({ ...p, newsletter_optin: v }))} /></div>
        </div>
        <SaveButton onClick={() => handleSave("CRM-Einstellungen")} />
      </SectionCard>
    </div>
  );

  const renderStaff = () => {
    const roles = [
      { name: "Admin", desc: "Vollzugriff auf alle Bereiche" },
      { name: "Office / Disposition", desc: "Buchungen, Routen, Finanzen" },
      { name: "Buchhaltung", desc: "Rechnungen, Zahlungen, Berichte" },
      { name: "Kundenservice / Agent", desc: "Buchungen, Kunden, Anfragen" },
      { name: "Fahrer / Scanner", desc: "Ops-Dashboard, Ticket-Scan" },
    ];

    return (
      <div className="space-y-4">
        <SectionCard title="Rollen & Berechtigungen" description="Vordefinierte Rollen und deren Zugriffsrechte">
          <div className="space-y-2">
            {roles.map(r => (
              <div key={r.name} className="flex items-center justify-between py-2 px-3 rounded bg-[#1a1f2a] border border-[#2a3040]">
                <div>
                  <p className="text-xs font-medium text-zinc-200">{r.name}</p>
                  <p className="text-[10px] text-zinc-500">{r.desc}</p>
                </div>
                <Shield className="w-3.5 h-3.5 text-zinc-600" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600">Rollenzuweisung erfolgt unter Mitarbeiter → Mitarbeiter verwalten</p>
        </SectionCard>

        <SectionCard title="Sicherheit" description="Passwortregeln, 2FA und Sitzungsdauer">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Min. Passwortlänge"><Input type="number" value={staff.password_min_length} onChange={e => setStaff(p => ({ ...p, password_min_length: e.target.value }))} className={inputCls} /></Field>
            <Field label="Sitzungs-Timeout (Min.)" hint="Automatische Abmeldung nach Inaktivität"><Input type="number" value={staff.session_timeout_min} onChange={e => setStaff(p => ({ ...p, session_timeout_min: e.target.value }))} className={inputCls} /></Field>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">2-Faktor-Authentifizierung</Label><Switch checked={staff.two_factor} onCheckedChange={v => setStaff(p => ({ ...p, two_factor: v }))} /></div>
            <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Sonderzeichen im Passwort erforderlich</Label><Switch checked={staff.password_require_special} onCheckedChange={v => setStaff(p => ({ ...p, password_require_special: v }))} /></div>
          </div>
          <SaveButton onClick={() => handleSave("Mitarbeiter-Einstellungen")} />
        </SectionCard>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="space-y-4">
      <SectionCard title="E-Mail-Benachrichtigungen" description="Automatische E-Mails bei Buchungsereignissen">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Neue Buchung</Label><Switch checked={notifications.email_new_booking} onCheckedChange={v => setNotifications(p => ({ ...p, email_new_booking: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Stornierung</Label><Switch checked={notifications.email_cancel} onCheckedChange={v => setNotifications(p => ({ ...p, email_cancel: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Zahlungsverzug</Label><Switch checked={notifications.email_payment_overdue} onCheckedChange={v => setNotifications(p => ({ ...p, email_payment_overdue: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Verspätung</Label><Switch checked={notifications.email_delay} onCheckedChange={v => setNotifications(p => ({ ...p, email_delay: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Vorfall / Störung</Label><Switch checked={notifications.email_incident} onCheckedChange={v => setNotifications(p => ({ ...p, email_incident: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Tägliche Zusammenfassung</Label><Switch checked={notifications.daily_summary} onCheckedChange={v => setNotifications(p => ({ ...p, daily_summary: v }))} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Zusätzliche Kanäle" description="SMS und WhatsApp (optional)">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">SMS-Benachrichtigungen</Label><Switch checked={notifications.sms_enabled} onCheckedChange={v => setNotifications(p => ({ ...p, sms_enabled: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">WhatsApp-Benachrichtigungen</Label><Switch checked={notifications.whatsapp_enabled} onCheckedChange={v => setNotifications(p => ({ ...p, whatsapp_enabled: v }))} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Eskalation" description="Automatische Weiterleitung bei kritischen Ereignissen">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Eskalation aktivieren</Label><Switch checked={notifications.escalation_enabled} onCheckedChange={v => setNotifications(p => ({ ...p, escalation_enabled: v }))} /></div>
          {notifications.escalation_enabled && (
            <Field label="Eskalation nach (Min.)" hint="Wenn keine Reaktion innerhalb dieser Zeit"><Input type="number" value={notifications.escalation_delay_min} onChange={e => setNotifications(p => ({ ...p, escalation_delay_min: e.target.value }))} className={inputCls} /></Field>
          )}
        </div>
        <SaveButton onClick={() => handleSave("Benachrichtigungen")} />
      </SectionCard>
    </div>
  );

  const renderTemplates = () => {
    const templateList = [
      { name: "Buchungsbestätigung", slug: "booking_confirmation", active: true },
      { name: "Rechnung", slug: "invoice", active: true },
      { name: "Stornobestätigung", slug: "cancellation", active: true },
      { name: "Angebotsvorlage", slug: "offer", active: false },
      { name: "Erinnerung vor Abfahrt", slug: "departure_reminder", active: true },
      { name: "Zahlungsaufforderung", slug: "payment_request", active: true },
      { name: "Interne Benachrichtigung", slug: "internal_notification", active: false },
    ];

    return (
      <div className="space-y-4">
        <SectionCard title="E-Mail-Vorlagen" description="Vorlagen für automatische E-Mails – bearbeiten unter E-Mail-Vorlagen">
          <div className="space-y-1.5">
            {templateList.map(t => (
              <div key={t.slug} className="flex items-center justify-between py-2 px-3 rounded bg-[#1a1f2a] border border-[#2a3040]">
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", t.active ? "bg-emerald-500" : "bg-zinc-600")} />
                  <p className="text-xs text-zinc-200">{t.name}</p>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono">{`{${t.slug}}`}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600">Platzhalter: {"{Kundenname}"}, {"{Buchungsnummer}"}, {"{Route}"}, {"{Abfahrt}"}, {"{Betrag}"}</p>
        </SectionCard>

        <SectionCard title="PDF-Layout & Signatur" description="Footer und Signatur für Dokumente">
          <div className="space-y-3">
            <Field label="Footer-Text"><Input value={templates.footer_text} onChange={e => setTemplates(p => ({ ...p, footer_text: e.target.value }))} className={inputCls} /></Field>
            <Field label="E-Mail-Signatur"><Input value={templates.signature} onChange={e => setTemplates(p => ({ ...p, signature: e.target.value }))} className={inputCls} /></Field>
          </div>
          <SaveButton onClick={() => handleSave("Vorlagen")} />
        </SectionCard>
      </div>
    );
  };

  const renderOperations = () => (
    <div className="space-y-4">
      <SectionCard title="Live-Tracking & Monitoring" description="Echtzeit-Überwachung und Aktualisierung">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Aktualisierungsintervall (Sek.)"><Input type="number" value={ops.refresh_interval} onChange={e => setOps(p => ({ ...p, refresh_interval: e.target.value }))} className={inputCls} /></Field>
          <Field label="GPS-Timeout (Min.)" hint="Fahrzeug gilt als offline"><Input type="number" value={ops.gps_timeout_min} onChange={e => setOps(p => ({ ...p, gps_timeout_min: e.target.value }))} className={inputCls} /></Field>
          <Field label="Fahrzeug offline nach (Min.)"><Input type="number" value={ops.vehicle_offline_min} onChange={e => setOps(p => ({ ...p, vehicle_offline_min: e.target.value }))} className={inputCls} /></Field>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Live-Tracking aktivieren</Label><Switch checked={ops.live_tracking} onCheckedChange={v => setOps(p => ({ ...p, live_tracking: v }))} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs text-zinc-300">Scanner-Überwachung</Label><Switch checked={ops.scanner_monitoring} onCheckedChange={v => setOps(p => ({ ...p, scanner_monitoring: v }))} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Verspätung & Alarme" description="Schwellwerte für Warnungen und Eskalation">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Warnung ab (Min. Verspätung)">
            <Input type="number" value={ops.delay_warn_min} onChange={e => setOps(p => ({ ...p, delay_warn_min: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Kritisch ab (Min. Verspätung)">
            <Input type="number" value={ops.delay_critical_min} onChange={e => setOps(p => ({ ...p, delay_critical_min: e.target.value }))} className={inputCls} />
          </Field>
        </div>
        <div className="pt-2 flex gap-3">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] text-zinc-400">Normal</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] text-zinc-400">Warnung</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-[10px] text-zinc-400">Kritisch</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[10px] text-zinc-400">Akut</span></div>
        </div>
        <SaveButton onClick={() => handleSave("Leitstand-Einstellungen")} />
      </SectionCard>
    </div>
  );

  const renderVehicles = () => (
    <div className="space-y-4">
      <SectionCard title="Fahrzeugnummern & Standards" description="Kennzeichen-Logik, Standard-Sitzplätze und Typen">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Fahrzeugnr.-Prefix" hint="z. B. MT-001"><Input value={vehicles.number_prefix} onChange={e => setVehicles(p => ({ ...p, number_prefix: e.target.value }))} className={inputCls} /></Field>
          <Field label="Standard-Sitzplätze"><Input type="number" value={vehicles.default_seats} onChange={e => setVehicles(p => ({ ...p, default_seats: e.target.value }))} className={inputCls} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Wartung & Prüftermine" description="Automatische Erinnerungen für TÜV und Wartung">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Wartungsintervall (km)"><Input type="number" value={vehicles.maintenance_interval_km} onChange={e => setVehicles(p => ({ ...p, maintenance_interval_km: e.target.value }))} className={inputCls} /></Field>
          <Field label="TÜV-Erinnerung vor (Tagen)"><Input type="number" value={vehicles.tuev_reminder_days} onChange={e => setVehicles(p => ({ ...p, tuev_reminder_days: e.target.value }))} className={inputCls} /></Field>
        </div>
        <SaveButton onClick={() => handleSave("Fahrzeug-Einstellungen")} />
      </SectionCard>
    </div>
  );

  const renderTours = () => {
    const countryGroups: Record<string, typeof toursList> = {};
    toursList.forEach(t => {
      if (t.country && t.country !== 'Deutschland') {
        if (!countryGroups[t.country]) countryGroups[t.country] = [];
        countryGroups[t.country].push(t);
      }
    });

    return (
      <div className="space-y-4">
        {/* Default Pickup Stops */}
        <SectionCard title="Standard-Zustiegsorte (DE)" description="Diese Haltestellen werden automatisch bei jeder neuen Tour vorgeschlagen. Hamburg → Bremen → Hannover ist die Standard-Route.">
          <div className="space-y-2">
            {tourTemplates.default_stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded bg-[#1a1f2a] border border-[#2a3040]">
                <div className="w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  {stop.sort_order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200">{stop.city}</p>
                  <p className="text-[10px] text-zinc-500">{stop.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-zinc-300">{stop.surcharge > 0 ? `+${stop.surcharge} €` : 'Inkl.'}</p>
                  <p className="text-[10px] text-zinc-500">{stop.distance_km} km ab HH</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-2">Hannover = Basishaltestelle (0 € Zuschlag). Zuschläge gelten pro Person für Hin- und Rückfahrt.</p>
          <SaveButton onClick={() => handleSave("Standard-Zustiegsorte")} />
        </SectionCard>

        {/* Distance Templates */}
        <SectionCard title="Entfernungsvorlagen" description="Gespeicherte Distanzen zwischen Standard-Haltestellen und Zielorten für schnelle Routenplanung">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-[#2a3040]">
                  <th className="text-left py-2 px-2">Von</th>
                  <th className="text-left py-2 px-2">Nach</th>
                  <th className="text-right py-2 px-2">Entfernung</th>
                  <th className="text-right py-2 px-2">Fahrzeit</th>
                </tr>
              </thead>
              <tbody>
                {tourTemplates.distance_templates.map((d, i) => (
                  <tr key={i} className="border-b border-[#1a1f2a] hover:bg-[#1a1f2a]/50">
                    <td className="py-2 px-2 text-zinc-300">{d.from}</td>
                    <td className="py-2 px-2 text-zinc-300">{d.to}</td>
                    <td className="py-2 px-2 text-right text-zinc-200 font-medium">{d.km.toLocaleString()} km</td>
                    <td className="py-2 px-2 text-right text-zinc-400">ca. {d.hours} Std.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SaveButton onClick={() => handleSave("Entfernungsvorlagen")} />
        </SectionCard>

        {/* Tour Combination by Country */}
        <SectionCard title="Tour-Kombination nach Land" description="Touren im selben Land oder in der Nähe können automatisch verknüpft und als Empfehlungen angezeigt werden. Deutschland ist ausgenommen.">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-300">Auto-Kombination aktivieren</Label>
              <Switch
                checked={tourTemplates.auto_combine}
                onCheckedChange={v => setTourTemplates(p => ({ ...p, auto_combine: v }))}
              />
            </div>
            <Field label="Ausgeschlossene Länder" hint="Kommagetrennt, z. B. Deutschland">
              <Input
                value={tourTemplates.combine_exclude_countries}
                onChange={e => setTourTemplates(p => ({ ...p, combine_exclude_countries: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Detected country groups */}
          {Object.keys(countryGroups).length > 0 ? (
            <div className="space-y-3 mt-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Erkannte Ländergruppen</p>
              {Object.entries(countryGroups).map(([country, countryTours]) => (
                <div key={country} className="p-3 rounded bg-[#1a1f2a] border border-[#2a3040]">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-zinc-200">{country}</span>
                    <span className="text-[10px] text-zinc-500 ml-auto">
                      {countryTours.length} {countryTours.length === 1 ? 'Tour' : 'Touren'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {countryTours.map(t => (
                      <div key={t.id} className="flex items-center gap-2 py-1 px-2 rounded bg-[#151920]">
                        <Navigation className="w-3 h-3 text-zinc-500" />
                        <span className="text-[11px] text-zinc-300 truncate">{t.destination}</span>
                        {countryTours.length >= 2 && (
                          <Link2 className="w-3 h-3 text-emerald-500 ml-auto shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                  {countryTours.length >= 2 && (
                    <p className="text-[10px] text-emerald-500/70 mt-2 flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      Diese Touren werden automatisch als Empfehlungen verknüpft
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-zinc-600 text-xs mt-4">
              Keine kombinierbaren Touren gefunden. Touren im selben Land (außer DE) werden hier gruppiert.
            </div>
          )}

          {/* Single tours that could be combined */}
          {toursList.filter(t => t.country === 'Deutschland' || !t.country).length > 0 && (
            <div className="mt-4 p-3 rounded bg-[#1a1f2a]/50 border border-[#2a3040]">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Nicht kombiniert (Deutschland / ohne Land)</p>
              <div className="space-y-1">
                {toursList.filter(t => t.country === 'Deutschland' || !t.country).map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1 px-2 text-[11px] text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    {t.destination} {t.country && <span className="text-zinc-600">({t.country})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <SaveButton onClick={() => handleSave("Tour-Kombination")} />
        </SectionCard>
      </div>
    );
  };

  /* ─── Betriebshöfe / Depots ─── */
  const renderDepots = () => (
    <div className="space-y-4">
      <SectionCard title="Standorte & Betriebshöfe" description="Alle Betriebshöfe, Depots und Abfertigungsstandorte">
        <div className="flex justify-end mb-2">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => {
            setDepotForm({ name: "", code: "", city: "", address: "", postal_code: "", phone: "", email: "", contact_person: "", capacity_buses: 0, notes: "", is_active: true });
            setEditingDepot(null);
            setShowDepotForm(true);
          }}>
            <Plus className="w-3 h-3 mr-1" /> Neuer Standort
          </Button>
        </div>

        {/* Depot List */}
        {depots.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            <Warehouse className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
            Noch keine Standorte angelegt
          </div>
        ) : (
          <div className="space-y-2">
            {depots.map(d => (
              <div key={d.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${d.is_active ? "bg-[#1a1f2a] border-[#2a3040]" : "bg-[#151920] border-[#1a1f2a] opacity-60"}`}>
                <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center shrink-0">
                  <Warehouse className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">{d.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{d.code}</span>
                    {!d.is_active && <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Inaktiv</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-zinc-400">{d.city}{d.postal_code ? ` (${d.postal_code})` : ""}</span>
                    {d.address && <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{d.address}</span>}
                    {d.capacity_buses > 0 && <span className="text-[10px] text-blue-400"><Truck className="w-3 h-3 inline mr-0.5" />{d.capacity_buses} Stellplätze</span>}
                  </div>
                  {d.contact_person && <span className="text-[10px] text-zinc-500 block mt-0.5">Ansprechpartner: {d.contact_person}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200" onClick={() => {
                    setDepotForm({ name: d.name, code: d.code, city: d.city, address: d.address || "", postal_code: d.postal_code || "", phone: d.phone || "", email: d.email || "", contact_person: d.contact_person || "", capacity_buses: d.capacity_buses || 0, notes: d.notes || "", is_active: d.is_active });
                    setEditingDepot(d.id);
                    setShowDepotForm(true);
                  }}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => { if (confirm("Standort wirklich löschen?")) deleteDepot(d.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Depot Form */}
      {showDepotForm && (
        <SectionCard title={editingDepot ? "Standort bearbeiten" : "Neuen Standort anlegen"}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name *">
              <Input value={depotForm.name} onChange={e => setDepotForm(f => ({ ...f, name: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="z.B. Hauptdepot Hamburg" />
            </Field>
            <Field label="Kürzel *" hint="Kurzer Code, z.B. HH-ZEN">
              <Input value={depotForm.code} onChange={e => setDepotForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="bg-[#1a1f2a] border-[#2a3040] text-white font-mono" placeholder="HH-ZEN" />
            </Field>
            <Field label="Stadt *">
              <Input value={depotForm.city} onChange={e => setDepotForm(f => ({ ...f, city: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="Hamburg" />
            </Field>
            <Field label="Adresse">
              <Input value={depotForm.address} onChange={e => setDepotForm(f => ({ ...f, address: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="Musterstraße 1" />
            </Field>
            <Field label="PLZ">
              <Input value={depotForm.postal_code} onChange={e => setDepotForm(f => ({ ...f, postal_code: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="20095" />
            </Field>
            <Field label="Stellplätze (Busse)">
              <Input type="number" value={depotForm.capacity_buses} onChange={e => setDepotForm(f => ({ ...f, capacity_buses: Number(e.target.value) }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" />
            </Field>
            <Field label="Telefon">
              <Input value={depotForm.phone} onChange={e => setDepotForm(f => ({ ...f, phone: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="+49 40 ..." />
            </Field>
            <Field label="E-Mail">
              <Input value={depotForm.email} onChange={e => setDepotForm(f => ({ ...f, email: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="depot@metours.de" />
            </Field>
            <Field label="Ansprechpartner">
              <Input value={depotForm.contact_person} onChange={e => setDepotForm(f => ({ ...f, contact_person: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="Max Mustermann" />
            </Field>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Switch checked={depotForm.is_active} onCheckedChange={v => setDepotForm(f => ({ ...f, is_active: v }))} />
            <Label className="text-xs text-zinc-400">Standort aktiv</Label>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={saveDepot}>
              <Save className="w-3 h-3 mr-1" /> {editingDepot ? "Aktualisieren" : "Anlegen"}
            </Button>
            <Button size="sm" variant="ghost" className="text-zinc-400 h-8 text-xs" onClick={() => setShowDepotForm(false)}>Abbrechen</Button>
          </div>
        </SectionCard>
      )}
    </div>
  );

  const [legalDocs, setLegalDocs] = useState<any[]>([]);
  const [legalForm, setLegalForm] = useState({ document_type: "agb", version: "v1", title: "", content: "" });
  const [showLegalForm, setShowLegalForm] = useState(false);
  const [isLoadingLegal, setIsLoadingLegal] = useState(false);

  const loadLegalDocs = async () => {
    setIsLoadingLegal(true);
    const { data } = await supabase.from("tour_legal_documents").select("*").order("document_type, created_at desc");
    setLegalDocs(data || []);
    setIsLoadingLegal(false);
  };

  useEffect(() => { if (activeSection === "legal") loadLegalDocs(); }, [activeSection]);

  const saveLegalDoc = async () => {
    if (!legalForm.title || !legalForm.content) { toast({ title: "Bitte Titel und Inhalt ausfüllen" }); return; }
    await supabase.from("tour_legal_documents").update({ is_current: false }).eq("document_type", legalForm.document_type);
    await supabase.from("tour_legal_documents").insert({ ...legalForm, is_current: true });
    toast({ title: "✅ Rechtstext gespeichert" });
    setShowLegalForm(false);
    setLegalForm({ document_type: "agb", version: "v1", title: "", content: "" });
    loadLegalDocs();
  };

  const getLegalTypeLabel = (t: string) => {
    switch (t) { case "agb": return "AGB"; case "datenschutz": return "Datenschutz"; case "impressum": return "Impressum"; case "sicherungsschein": return "Sicherungsschein"; case "widerruf": return "Widerrufsbelehrung"; default: return t; }
  };

  const legalGrouped = legalDocs.reduce((acc: Record<string, any[]>, d: any) => { if (!acc[d.document_type]) acc[d.document_type] = []; acc[d.document_type].push(d); return acc; }, {});

  const renderLegal = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Rechtstexte werden auf den öffentlichen Seiten (Impressum, Datenschutz, AGB) angezeigt.</p>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={() => setShowLegalForm(true)}>
          <Plus className="w-3 h-3 mr-1" /> Neue Version
        </Button>
      </div>

      {showLegalForm && (
        <SectionCard title="Neuen Rechtstext anlegen">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dokumenttyp">
              <Select value={legalForm.document_type} onValueChange={v => setLegalForm(f => ({ ...f, document_type: v }))}>
                <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agb">AGB</SelectItem>
                  <SelectItem value="datenschutz">Datenschutz</SelectItem>
                  <SelectItem value="impressum">Impressum</SelectItem>
                  <SelectItem value="sicherungsschein">Sicherungsschein</SelectItem>
                  <SelectItem value="widerruf">Widerrufsbelehrung</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Version">
              <Input value={legalForm.version} onChange={e => setLegalForm(f => ({ ...f, version: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="v1.0" />
            </Field>
          </div>
          <Field label="Titel">
            <Input value={legalForm.title} onChange={e => setLegalForm(f => ({ ...f, title: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="z.B. AGB – Stand März 2026" />
          </Field>
          <Field label="Inhalt" hint="Zeilenumbrüche werden auf der Website als <br> dargestellt.">
            <textarea value={legalForm.content} onChange={e => setLegalForm(f => ({ ...f, content: e.target.value }))} className="w-full bg-[#1a1f2a] border border-[#2a3040] text-white rounded-md p-3 text-sm min-h-[200px] resize-y" placeholder="Inhalt des Rechtstextes..." />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={saveLegalDoc}>
              <Save className="w-3 h-3 mr-1" /> Speichern & Aktivieren
            </Button>
            <Button size="sm" variant="ghost" className="text-zinc-400 h-8 text-xs" onClick={() => setShowLegalForm(false)}>Abbrechen</Button>
          </div>
        </SectionCard>
      )}

      {Object.entries(legalGrouped).map(([type, versions]) => (
        <SectionCard key={type} title={getLegalTypeLabel(type)}>
          <div className="space-y-2">
            {(versions as any[]).map((v: any) => (
              <div key={v.id} className="bg-[#1a1f2a] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-white font-medium">{v.title}</div>
                  <div className="text-xs text-zinc-500">{v.version} • {new Date(v.created_at).toLocaleDateString("de-DE")}</div>
                </div>
                {v.is_current ? (
                  <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">✓ Aktiv</span>
                ) : (
                  <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">Archiv</span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
      {Object.keys(legalGrouped).length === 0 && !showLegalForm && (
        <p className="text-zinc-500 text-center py-8 text-sm">Noch keine Rechtstexte angelegt. Klicke auf "Neue Version" um einen Text hinzuzufügen.</p>
      )}
    </div>
  );

  const renderMap: Record<SettingsSection, () => JSX.Element> = {
    general: renderGeneral, booking: renderBooking, routes: renderRoutes,
    tours: renderTours,
    finance: renderFinance, crm: renderCRM, staff: renderStaff,
    notifications: renderNotifications, templates: renderTemplates,
    operations: renderOperations, vehicles: renderVehicles,
    depots: renderDepots, legal: renderLegal,
  };

  const activeInfo = sections.find(s => s.key === activeSection)!;

  return (
    <AdminLayout title="Einstellungen" subtitle="System-, Buchungs- und Betriebskonfiguration">
      <div className="flex gap-4 min-h-[calc(100vh-140px)]">
        {/* Settings sidebar */}
        <nav className="w-56 shrink-0 space-y-0.5">
          {sections.map(s => {
            const isActive = s.key === activeSection;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors",
                  isActive
                    ? "bg-emerald-600/15 text-emerald-400 border-l-2 border-emerald-500"
                    : "text-zinc-400 hover:bg-[#1a1f2a] hover:text-zinc-200"
                )}
              >
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.label}</p>
                  {isActive && <p className="text-[10px] text-zinc-500 truncate">{s.description}</p>}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
              <activeInfo.icon className="w-4 h-4 text-emerald-400" />
              {activeInfo.label}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{activeInfo.description}</p>
          </div>
          {renderMap[activeSection]()}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
