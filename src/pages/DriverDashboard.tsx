import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Scan, CheckCircle2, XCircle, AlertTriangle, Loader2,
  LogOut, Bus, Clock, Camera, CameraOff,
  History, Shield, List, CalendarDays, MapPin, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format, startOfWeek, addDays } from "date-fns";
import { de } from "date-fns/locale";

type DriverTab = "scan" | "history" | "shifts" | "route";

const QR_PAYLOAD_REGEX = /^[a-zA-Z0-9\-_.]+$/;
const MAX_PAYLOAD_LENGTH = 200;
const SCAN_COOLDOWN_MS = 2000;

interface PassengerInfo {
  name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  seat?: string;
  price?: number;
  extras?: any;
  origin?: string;
  destination?: string;
}

interface ScanResult {
  result: string;
  message: string;
  color: "green" | "yellow" | "red";
  passenger?: PassengerInfo | string;
  ticket?: any;
  trip?: any;
  checked_in_at?: string;
}

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user, hasAnyStaffRole, isLoading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DriverTab>("scan");

  // Scanner state
  const [manualTicket, setManualTicket] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const scannerContainerId = "qr-reader";

  // History state
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Shifts state
  const [shifts, setShifts] = useState<any[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  
  // Route & delay state
  const { token: mapboxToken } = useMapboxToken();
  const [todayShift, setTodayShift] = useState<any>(null);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [delayMinutes, setDelayMinutes] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [reportingDelay, setReportingDelay] = useState(false);
  const [showDelayForm, setShowDelayForm] = useState(false);
  const geoWatchRef = useRef<number | null>(null);

  // Geolocation tracking - send position every 30s
  useEffect(() => {
    if (!user) return;

    const updatePosition = async (lat: number, lng: number, speed: number | null, heading: number | null) => {
      // Get today's shift to find assigned bus
      const today = new Date().toISOString().split('T')[0];
      const { data: shift } = await supabase
        .from('employee_shifts')
        .select('assigned_bus_id, assigned_trip_id')
        .eq('user_id', user.id)
        .eq('shift_date', today)
        .in('status', ['scheduled', 'active'])
        .order('shift_start', { ascending: true })
        .limit(1)
        .maybeSingle();

      const busId = shift?.assigned_bus_id;
      if (!busId) return; // No bus assigned today, don't track

      const posData = {
        driver_user_id: user.id,
        bus_id: busId,
        trip_id: shift?.assigned_trip_id || null,
        latitude: lat,
        longitude: lng,
        speed_kmh: speed ? Math.round((speed * 3.6) * 10) / 10 : 0,
        heading: heading || 0,
        status: 'on_time',
        updated_at: new Date().toISOString(),
      };

      // Upsert based on driver_user_id
      const { error } = await supabase
        .from('vehicle_positions')
        .upsert(posData, { onConflict: 'driver_user_id' });
      
      if (error) console.error('Position update failed:', error);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude, pos.coords.speed, pos.coords.heading),
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true }
      );

      geoWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude, pos.coords.speed, pos.coords.heading),
        (err) => console.warn('Geolocation watch error:', err),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    }

    return () => {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
    };
  }, [user]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
      }
    };
  }, []);

  // Stop camera when leaving scan tab
  useEffect(() => {
    if (activeTab !== "scan" && cameraActive) {
      stopCamera();
    }
  }, [activeTab]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data } = await supabase
        .from("scan_logs")
        .select("*, tickets(qr_payload, status), bookings(passenger_first_name, passenger_last_name, ticket_number), trips(departure_date, departure_time, routes(name))")
        .eq("user_id", user.id)
        .order("scan_time", { ascending: false })
        .limit(50);
      setScanHistory(data || []);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  const fetchShifts = useCallback(async () => {
    if (!user) return;
    setShiftsLoading(true);
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 13); // Show 2 weeks
      
      const { data } = await supabase
        .from("employee_shifts")
        .select("*, buses(name, license_plate), trips(departure_time, arrival_time, routes(name))")
        .eq("user_id", user.id)
        .gte("shift_date", format(weekStart, "yyyy-MM-dd"))
        .lte("shift_date", format(weekEnd, "yyyy-MM-dd"))
        .order("shift_date", { ascending: true })
        .order("shift_start", { ascending: true });
      setShifts(data || []);
    } catch (err) {
      console.error("Shifts fetch error:", err);
    } finally {
      setShiftsLoading(false);
    }
  }, [user]);

  // Fetch today's route for route tab
  const fetchTodayRoute = useCallback(async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data: shift } = await supabase
      .from("employee_shifts")
      .select("*, buses(name, license_plate), trips(departure_time, arrival_time, route_id, routes(name, id))")
      .eq("user_id", user.id)
      .eq("shift_date", today)
      .in("status", ["scheduled", "active"])
      .order("shift_start", { ascending: true })
      .limit(1)
      .maybeSingle();
    
    setTodayShift(shift);
    
    if (shift?.trips?.route_id) {
      const { data: stops } = await supabase
        .from("stops")
        .select("*")
        .eq("route_id", shift.trips.route_id)
        .order("stop_order", { ascending: true });
      setRouteStops(stops || []);
    } else {
      setRouteStops([]);
    }
  }, [user]);

  // Report delay
  const reportDelay = async () => {
    if (!user || !delayMinutes) return;
    setReportingDelay(true);
    try {
      const mins = parseInt(delayMinutes);
      if (isNaN(mins) || mins < 1) {
        toast({ title: "Ungültige Minutenangabe", variant: "destructive" });
        return;
      }

      // Update vehicle position with delay
      await supabase
        .from("vehicle_positions")
        .update({ 
          delay_minutes: mins, 
          status: mins > 5 ? 'delayed' : 'on_time',
          updated_at: new Date().toISOString() 
        })
        .eq("driver_user_id", user.id);

      // Create incident for operations center
      await supabase.from("incidents").insert({
        type: "delay",
        title: `Verspätung: ${mins} Min.`,
        description: delayReason || `Fahrer meldet ${mins} Minuten Verspätung`,
        severity: mins > 15 ? "warning" : "info",
        source_type: "driver_report",
        source_id: user.id,
        status: "open",
      });

      toast({ title: `Verspätung von ${mins} Min. gemeldet` });
      setDelayMinutes("");
      setDelayReason("");
      setShowDelayForm(false);
    } catch (err) {
      toast({ title: "Fehler beim Melden", variant: "destructive" });
    } finally {
      setReportingDelay(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
    if (activeTab === "shifts") fetchShifts();
    if (activeTab === "route") fetchTodayRoute();
  }, [activeTab, fetchHistory, fetchShifts, fetchTodayRoute]);

  const processQrPayload = async (payload: string) => {
    if (scanning || !payload.trim()) return;
    const now = Date.now();
    if (now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
      toast({ title: "Bitte warten", description: "Cooldown zwischen Scans aktiv", variant: "destructive" });
      return;
    }
    const sanitized = payload.trim();
    if (sanitized.length > MAX_PAYLOAD_LENGTH || !QR_PAYLOAD_REGEX.test(sanitized)) {
      setScanResult({ result: "invalid_input", message: "Ungültiges Ticket-Format", color: "red" });
      return;
    }
    lastScanTimeRef.current = now;
    setScanning(true);
    setScanResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("process-ticket-scan", {
        body: { qr_payload: sanitized },
      });
      if (error) throw error;
      setScanResult(data as ScanResult);
      if (navigator.vibrate) {
        if (data.color === "green") navigator.vibrate(200);
        else if (data.color === "yellow") navigator.vibrate([100, 50, 100]);
        else navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (err: any) {
      setScanResult({ result: "error", message: "Fehler: " + (err.message || "Unbekannt"), color: "red" });
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async () => {
    if (cameraStarting) return;
    setCameraStarting(true);
    // Show the container first so Html5Qrcode can render into it
    setCameraActive(true);
    
    try {
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      stream.getTracks().forEach(track => track.stop());
      
      // Wait for DOM to update with visible container
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Clean up any previous scanner instance
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch {}
        scannerRef.current = null;
      }

      const el = document.getElementById(scannerContainerId);
      if (!el) {
        throw new Error("Scanner-Container nicht gefunden");
      }

      const scanner = new Html5Qrcode(scannerContainerId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().then(() => {
            setCameraActive(false);
            processQrPayload(decodedText);
          }).catch(() => {});
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraActive(false);
      toast({
        title: "Kamera-Fehler",
        description: err.name === "NotAllowedError" 
          ? "Bitte erlaube den Kamerazugriff in den Browser-Einstellungen und lade die Seite neu."
          : err.name === "NotFoundError"
          ? "Keine Kamera gefunden. Bitte prüfe ob dein Gerät eine Kamera hat."
          : err.name === "NotReadableError"
          ? "Kamera wird von einer anderen App verwendet. Bitte schließe andere Apps und versuche es erneut."
          : (err.message || "Kamera konnte nicht gestartet werden"),
        variant: "destructive",
      });
    } finally {
      setCameraStarting(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {}
    }
    setCameraActive(false);
  };

  const getResultStyles = (color: string) => {
    switch (color) {
      case "green":
        return { border: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-300", icon: <CheckCircle2 className="w-12 h-12 text-emerald-400" /> };
      case "yellow":
        return { border: "border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-300", icon: <AlertTriangle className="w-12 h-12 text-amber-400" /> };
      default:
        return { border: "border-red-500/50", bg: "bg-red-500/10", text: "text-red-300", icon: <XCircle className="w-12 h-12 text-red-400" /> };
    }
  };

  const getHistoryBadge = (result: string) => {
    switch (result) {
      case "checked_in":
        return <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Eingecheckt</Badge>;
      case "already_checked_in":
        return <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">Bereits gescannt</Badge>;
      case "not_found":
        return <Badge className="bg-red-500/20 text-red-400 text-[10px]">Nicht gefunden</Badge>;
      case "invalid":
        return <Badge className="bg-red-500/20 text-red-400 text-[10px]">Ungültig</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 text-[10px]">{result}</Badge>;
    }
  };

  const getShiftStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">Geplant</Badge>;
      case "in_progress":
        return <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Aktiv</Badge>;
      case "completed":
        return <Badge className="bg-zinc-500/20 text-zinc-400 text-[10px]">Abgeschlossen</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 text-[10px]">Abgesagt</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 text-[10px]">{status}</Badge>;
    }
  };

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

  const tabs = [
    { id: "scan" as DriverTab, label: "Scanner", icon: Scan },
    { id: "shifts" as DriverTab, label: "Dienstplan", icon: CalendarDays },
    { id: "history" as DriverTab, label: "Verlauf", icon: History },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Bus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">METROPOL TOURS</h1>
            <p className="text-[10px] text-zinc-500">Fahrer-Dashboard</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-zinc-400 hover:text-white">
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 pb-24">
        {activeTab === "scan" && (
          <div className="space-y-4 max-w-md mx-auto">
            {/* Camera Scanner - container is ALWAYS in DOM */}
            <div className="relative">
              <div
                id={scannerContainerId}
                className="w-full rounded-xl overflow-hidden"
                style={{ 
                  minHeight: cameraActive || cameraStarting ? 300 : 0, 
                  height: cameraActive || cameraStarting ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'min-height 0.3s ease'
                }}
              />
              {!cameraActive && (
                <button
                  onClick={startCamera}
                  disabled={scanning || cameraStarting}
                  className="w-full flex flex-col items-center justify-center gap-4 py-16 rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
                >
                  {cameraStarting ? (
                    <>
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <span className="text-lg font-bold text-emerald-400">KAMERA WIRD GESTARTET...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Camera className="w-10 h-10 text-white" />
                      </div>
                      <span className="text-lg font-bold text-emerald-400">SCAN STARTEN</span>
                      <span className="text-xs text-zinc-500">QR-Code oder Barcode scannen</span>
                    </>
                  )}
                </button>
              )}
              {cameraActive && (
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="absolute top-2 right-2 z-10 bg-zinc-900/80 border-zinc-700 text-white"
                  size="sm"
                >
                  <CameraOff className="w-4 h-4 mr-1" /> Stopp
                </Button>
              )}
            </div>

            {/* Manual Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Ticket-Nr. manuell eingeben..."
                value={manualTicket}
                onChange={(e) => { setManualTicket(e.target.value); setScanResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && processQrPayload(manualTicket)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
              />
              <Button
                onClick={() => processQrPayload(manualTicket)}
                disabled={scanning || !manualTicket.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 px-6"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              </Button>
            </div>

            {/* Scan Result */}
            {scanResult && (() => {
              const styles = getResultStyles(scanResult.color);
              const p = typeof scanResult.passenger === 'object' ? scanResult.passenger : null;
              const passengerName = p?.name || (typeof scanResult.passenger === 'string' ? scanResult.passenger : null);
              
              return (
                <Card className={`border-2 ${styles.border} ${styles.bg} animate-in fade-in duration-300`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">{styles.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-xl ${styles.text}`}>{scanResult.message}</p>
                      </div>
                    </div>

                    {/* Passenger Details Card */}
                    {(passengerName || p) && (
                      <div className="mt-4 space-y-2 bg-zinc-800/50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fahrgast-Info</h4>
                        
                        {passengerName && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">👤</span>
                            <span className="text-white font-bold text-lg">{passengerName}</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {p?.seat && (
                            <div className="bg-zinc-700/50 rounded px-2 py-1.5">
                              <span className="text-zinc-400 text-xs block">Sitzplatz</span>
                              <span className="text-white font-bold">{p.seat}</span>
                            </div>
                          )}
                          {p?.price != null && (
                            <div className="bg-zinc-700/50 rounded px-2 py-1.5">
                              <span className="text-zinc-400 text-xs block">Preis</span>
                              <span className="text-white font-bold">{p.price.toFixed(2)} €</span>
                            </div>
                          )}
                          {p?.origin && (
                            <div className="bg-zinc-700/50 rounded px-2 py-1.5">
                              <span className="text-zinc-400 text-xs block">Von</span>
                              <span className="text-white text-xs font-medium">{p.origin}</span>
                            </div>
                          )}
                          {p?.destination && (
                            <div className="bg-zinc-700/50 rounded px-2 py-1.5">
                              <span className="text-zinc-400 text-xs block">Nach</span>
                              <span className="text-white text-xs font-medium">{p.destination}</span>
                            </div>
                          )}
                        </div>
                        
                        {p?.phone && (
                          <div className="flex items-center gap-2 text-sm text-zinc-300">
                            <span>📱</span>
                            <a href={`tel:${p.phone}`} className="underline">{p.phone}</a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trip Info */}
                    {scanResult.trip && (
                      <div className="mt-3 bg-zinc-800/50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Fahrt</h4>
                        <p className="text-white font-medium">🚌 {scanResult.trip.route}</p>
                        <p className="text-zinc-300 text-sm">
                          📅 {scanResult.trip.date} • 🕐 {scanResult.trip.time}
                          {scanResult.trip.arrival && ` → ${scanResult.trip.arrival}`}
                        </p>
                      </div>
                    )}

                    {scanResult.checked_in_at && (
                      <p className="text-zinc-500 text-xs mt-2">
                        Eingecheckt: {new Date(scanResult.checked_in_at).toLocaleString("de-DE")}
                      </p>
                    )}

                    <Button
                      onClick={() => { setScanResult(null); setManualTicket(""); }}
                      variant="outline"
                      className="w-full mt-4 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    >
                      Nächstes Ticket scannen
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        {activeTab === "shifts" && (
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Mein Dienstplan</h2>
              <Button variant="ghost" size="sm" onClick={fetchShifts} className="text-zinc-400">
                <Clock className="w-4 h-4 mr-1" /> Aktualisieren
              </Button>
            </div>

            {shiftsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                <p>Keine Schichten in den nächsten 2 Wochen</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  let lastDate = "";
                  return shifts.map((shift) => {
                    const showDate = shift.shift_date !== lastDate;
                    lastDate = shift.shift_date;
                    const isToday = shift.shift_date === format(new Date(), "yyyy-MM-dd");
                    
                    return (
                      <div key={shift.id}>
                        {showDate && (
                          <div className={`text-xs font-medium mt-3 mb-1 px-1 ${isToday ? "text-emerald-400" : "text-zinc-500"}`}>
                            {isToday ? "📍 Heute – " : ""}
                            {format(new Date(shift.shift_date), "EEEE, dd. MMMM", { locale: de })}
                          </div>
                        )}
                        <Card className={`border ${isToday ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900 border-zinc-800"}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">
                                    {shift.shift_start ? format(new Date(shift.shift_start), "HH:mm") : "–"}
                                    {shift.shift_end ? ` – ${format(new Date(shift.shift_end), "HH:mm")}` : ""}
                                  </span>
                                  {getShiftStatusBadge(shift.status)}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
                                  {shift.buses && (
                                    <p>🚌 {shift.buses.name} ({shift.buses.license_plate})</p>
                                  )}
                                  {shift.trips?.routes?.name && (
                                    <p>📍 {shift.trips.routes.name}</p>
                                  )}
                                  {shift.notes && (
                                    <p className="text-zinc-600">💬 {shift.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Letzte Scans</h2>
              <Button variant="ghost" size="sm" onClick={fetchHistory} className="text-zinc-400">
                <Clock className="w-4 h-4 mr-1" /> Aktualisieren
              </Button>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : scanHistory.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <List className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                <p>Noch keine Scans durchgeführt</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scanHistory.map((log) => (
                  <Card key={log.id} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {log.qr_payload || log.tickets?.qr_payload || "–"}
                            </span>
                            {getHistoryBadge(log.result)}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {log.bookings && `${log.bookings.passenger_first_name} ${log.bookings.passenger_last_name}`}
                            {log.trips?.routes?.name && ` • ${log.trips.routes.name}`}
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                          {formatDistanceToNow(new Date(log.scan_time), { addSuffix: true, locale: de })}
                        </span>
                      </div>
                      {log.message && (
                        <p className="text-xs text-zinc-500 mt-1">{log.message}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex safe-area-pb">
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