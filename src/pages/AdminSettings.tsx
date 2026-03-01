import { useState } from "react";
import { Settings, Save, CreditCard, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminSettings = () => {
  const { toast } = useToast();

  const [companyInfo, setCompanyInfo] = useState({
    name: "METROPOL TOURS GmbH",
    address: "Musterstraße 1, 12345 Berlin",
    phone: "+49 30 123456",
    email: "info@metours.de",
    website: "www.metours.de",
    tax_id: "DE123456789",
    register: "HRB 12345, Amtsgericht Berlin",
    ceo: "Max Mustermann",
  });

  const [bankInfo, setBankInfo] = useState({
    bank_name: "Deutsche Bank",
    iban: "DE89 3704 0044 0532 0130 00",
    bic: "COBADEFFXXX",
    account_holder: "METROPOL TOURS GmbH",
  });

  const [emailSettings, setEmailSettings] = useState({
    sender_email: "booking@app.metours.de",
    sender_name: "METROPOL TOURS",
    reply_to: "info@metours.de",
    bcc_admin: "",
  });

  const [bookingSettings, setBookingSettings] = useState({
    booking_prefix: "TRB",
    invoice_prefix: "RE",
    payment_deadline_days: "7",
    auto_confirm_stripe: true,
    auto_send_confirmation: true,
    tax_rate: "19",
  });

  const handleSave = (section: string) => {
    toast({ title: `✅ ${section} gespeichert` });
  };

  return (
    <AdminLayout title="Einstellungen" subtitle="System, E-Mail, Bankdaten, Buchungsregeln">
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="company" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Building2 className="w-3 h-3 mr-1" /> Firma
          </TabsTrigger>
          <TabsTrigger value="bank" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <CreditCard className="w-3 h-3 mr-1" /> Bankdaten
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Mail className="w-3 h-3 mr-1" /> E-Mail
          </TabsTrigger>
          <TabsTrigger value="booking" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Settings className="w-3 h-3 mr-1" /> Buchung
          </TabsTrigger>
        </TabsList>

        {/* Company */}
        <TabsContent value="company">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Firmendaten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(companyInfo).map(([key, val]) => (
                  <div key={key}>
                    <Label className="text-zinc-400 text-xs capitalize">{key.replace(/_/g, " ")}</Label>
                    <Input
                      value={val}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, [key]: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                ))}
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave("Firmendaten")}>
                <Save className="w-3 h-3 mr-1" /> Speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank */}
        <TabsContent value="bank">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Bankverbindung</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-zinc-500">Diese Daten erscheinen auf Rechnungen und Zahlungsinfos.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(bankInfo).map(([key, val]) => (
                  <div key={key}>
                    <Label className="text-zinc-400 text-xs capitalize">{key.replace(/_/g, " ")}</Label>
                    <Input
                      value={val}
                      onChange={(e) => setBankInfo(prev => ({ ...prev, [key]: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                ))}
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave("Bankdaten")}>
                <Save className="w-3 h-3 mr-1" /> Speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">E-Mail Einstellungen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(emailSettings).map(([key, val]) => (
                  <div key={key}>
                    <Label className="text-zinc-400 text-xs capitalize">{key.replace(/_/g, " ")}</Label>
                    <Input
                      value={val}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, [key]: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                ))}
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave("E-Mail")}>
                <Save className="w-3 h-3 mr-1" /> Speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Rules */}
        <TabsContent value="booking">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Buchungsregeln</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Buchungsnr. Prefix</Label>
                  <Input value={bookingSettings.booking_prefix} onChange={(e) => setBookingSettings(prev => ({ ...prev, booking_prefix: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Rechnungsnr. Prefix</Label>
                  <Input value={bookingSettings.invoice_prefix} onChange={(e) => setBookingSettings(prev => ({ ...prev, invoice_prefix: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Zahlungsfrist (Tage)</Label>
                  <Input type="number" value={bookingSettings.payment_deadline_days} onChange={(e) => setBookingSettings(prev => ({ ...prev, payment_deadline_days: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">MwSt-Satz (%)</Label>
                  <Input type="number" value={bookingSettings.tax_rate} onChange={(e) => setBookingSettings(prev => ({ ...prev, tax_rate: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave("Buchungsregeln")}>
                <Save className="w-3 h-3 mr-1" /> Speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;
