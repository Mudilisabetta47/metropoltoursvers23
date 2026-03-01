import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Scan, AlertTriangle, Navigation, MapPin, Clock, 
  Shield, LogOut, Fuel, Construction, CloudRain,
  Phone, CheckCircle2, XCircle, Loader2, Send,
  ChevronRight, Bus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type DriverTab = "scanner" | "melden" | "status";

const INCIDENT_TYPES = [
  { type: "traffic_jam", label: "Stau", icon: Navigation, color: "text-orange-400 bg-orange-400/10" },
  { type: "accident", label: "Unfall", icon: AlertTriangle, color: "text-red-400 bg-red-400/10" },
  { type: "construction", label: "Baustelle", icon: Construction, color: "text-yellow-400 bg-yellow-400/10" },
  { type: "weather", label: "Wetter", icon: CloudRain, color: "text-blue-400 bg-blue-400/10" },
  { type: "breakdown", label: "Panne", icon: Bus, color: "text-red-500 bg-red-500/10" },
  { type: "fuel", label: "Tanken", icon: Fuel, color: "text-emerald-400 bg-emerald-400/10" },
];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user, isDriver, hasAnyStaffRole, isLoading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DriverTab>("scanner");
  
  // Scanner state
  const [ticketNumber, setTicketNumber] = useState("");
  const [scanResult, setScanResult] = useState<{ valid: boolean; message: string; passenger?: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  // Incident state
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Quick status
  const [delayMinutes, setDelayMinutes] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user || !hasAnyStaffRole) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <h1 className="text-xl font-bold mb-2 text-white">Fahrer-Login erforderlich</h1>
            <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700 mt-2">
              Anmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleScan = async () => {
    if (!ticketNumber.trim()) return;
    setScanning(true);
    setScanResult(null);

    try {
      // Look up booking by ticket number
      const { data: booking, error } = await supabase
        .from("bookings")
        .select("id, ticket_number, passenger_first_name, passenger_last_name, status, trip_id")
        .eq("ticket_number", ticketNumber.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!booking) {
        setScanResult({ valid: false, message: "Ticket nicht gefunden" });
      } else if (booking.status === "cancelled") {
        setScanResult({ valid: false, message: "Ticket storniert" });
      } else {
        setScanResult({ 
          valid: true, 
          message: "Gültiges Ticket ✓", 
          passenger: `${booking.passenger_first_name} ${booking.passenger_last_name}` 
        });
      }

      // Log scanner event
      await supabase.from("scanner_events").insert({
        scanner_user_id: user.id,
        ticket_number: ticketNumber.trim().toUpperCase(),
        booking_id: booking?.id || null,
        result: booking && booking.status !== "cancelled" ? "valid" : "invalid",
        scan_type: "check_in",
      });

    } catch (err: any) {
      setScanResult({ valid: false, message: "Fehler: " + err.message });
    } finally {
      setScanning(false);
    }
  };

  const handleIncidentSubmit = async () => {
    if (!selectedIncident) return;
    setSubmittingIncident(true);

    try {
      const incidentLabel = INCIDENT_TYPES.find(i => i.type === selectedIncident)?.label || selectedIncident;
      
      await supabase.from("incidents").insert({
        type: selectedIncident,
        title: `Fahrer-Meldung: ${incidentLabel}`,
        description: incidentDescription || `${incidentLabel} gemeldet von Fahrer`,
        severity: ["accident", "breakdown"].includes(selectedIncident) ? "critical" : "warning",
        source_type: "driver",
        status: "open",
      });

      toast({ title: "Meldung gesendet", description: `${incidentLabel} wurde erfolgreich gemeldet.` });
      setSelectedIncident(null);
      setIncidentDescription("");
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingIncident(false);
    }
  };

  const handleDelayReport = async () => {
    if (!delayMinutes) return;
    try {
      await supabase.from("incidents").insert({
        type: "delay",
        title: `Verspätung: ${delayMinutes} Min.`,
        description: `Fahrer meldet ${delayMinutes} Minuten Verspätung`,
        severity: parseInt(delayMinutes) > 30 ? "critical" : "warning",
        source_type: "driver",
        status: "open",
      });
      toast({ title: "Verspätung gemeldet", description: `${delayMinutes} Minuten Verspätung gemeldet.` });
      setDelayMinutes("");
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  const tabs = [
    { id: "scanner" as DriverTab, label: "Scanner", icon: Scan },
    { id: "melden" as DriverTab, label: "Melden", icon: AlertTriangle },
    { id: "status" as DriverTab, label: "Status", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Bus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">METROPOL TOURS</h1>
            <p className="text-[10px] text-zinc-500">Fahrer-App</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-zinc-400 hover:text-white">
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 pb-24">
        {activeTab === "scanner" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Ticket scannen</h2>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ticket-Nr. eingeben (z.B. TKT-2026-...)"
                value={ticketNumber}
                onChange={(e) => { setTicketNumber(e.target.value); setScanResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
              />
              <Button onClick={handleScan} disabled={scanning || !ticketNumber.trim()} className="bg-emerald-600 hover:bg-emerald-700 px-6">
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              </Button>
            </div>

            {scanResult && (
              <Card className={`border ${scanResult.valid ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  {scanResult.valid ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className={`font-bold text-lg ${scanResult.valid ? "text-emerald-300" : "text-red-300"}`}>
                      {scanResult.message}
                    </p>
                    {scanResult.passenger && (
                      <p className="text-zinc-300 text-sm">{scanResult.passenger}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <p className="text-zinc-400 text-sm">
                  💡 Geben Sie die Ticket-Nummer ein oder scannen Sie den QR-Code mit der Kamera-App und kopieren Sie die Nummer.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "melden" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Vorfall melden</h2>

            <div className="grid grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((incident) => (
                <button
                  key={incident.type}
                  onClick={() => setSelectedIncident(selectedIncident === incident.type ? null : incident.type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    selectedIncident === incident.type
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${incident.color}`}>
                    <incident.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">{incident.label}</span>
                </button>
              ))}
            </div>

            {selectedIncident && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Beschreibung (optional)..."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
                />
                <Button 
                  onClick={handleIncidentSubmit} 
                  disabled={submittingIncident}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
                >
                  {submittingIncident ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Meldung senden
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "status" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Schnellstatus</h2>

            {/* Delay Report */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold">Verspätung melden</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Minuten"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white w-28"
                  />
                  <Button onClick={handleDelayReport} disabled={!delayMinutes} className="bg-orange-600 hover:bg-orange-700 flex-1">
                    Verspätung melden
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold mb-3">Schnellbefehle</h3>
                {[
                  { label: "Pause gestartet", icon: Clock, action: "break_start" },
                  { label: "Pause beendet", icon: CheckCircle2, action: "break_end" },
                  { label: "Fahrt gestartet", icon: Navigation, action: "trip_start" },
                  { label: "Fahrt beendet", icon: MapPin, action: "trip_end" },
                ].map((cmd) => (
                  <button
                    key={cmd.action}
                    onClick={async () => {
                      await supabase.from("incidents").insert({
                        type: cmd.action,
                        title: cmd.label,
                        description: `Fahrer-Status: ${cmd.label}`,
                        severity: "info",
                        source_type: "driver",
                        status: "resolved",
                      });
                      toast({ title: cmd.label, description: "Status wurde gemeldet." });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <cmd.icon className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium">{cmd.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Emergency */}
            <Card className="bg-red-950/30 border-red-900/50">
              <CardContent className="p-4">
                <button 
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = "tel:+4942112345";
                    }
                  }}
                >
                  <Phone className="w-5 h-5" />
                  Notruf Zentrale
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex safe-area-bottom">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === tab.id ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[11px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default DriverDashboard;
