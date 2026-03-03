import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Scan, CheckCircle2, XCircle, AlertTriangle, Loader2,
  LogOut, Bus, Clock, Camera, CameraOff,
  History, Shield, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type DriverTab = "scan" | "history";

// Bot protection: client-side validation & cooldown
const QR_PAYLOAD_REGEX = /^[a-zA-Z0-9\-_.]+$/;
const MAX_PAYLOAD_LENGTH = 200;
const SCAN_COOLDOWN_MS = 2000;

interface ScanResult {
  result: string;
  message: string;
  color: "green" | "yellow" | "red";
  passenger?: string;
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const scannerContainerId = "qr-reader";

  // History state
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

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

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  const processQrPayload = async (payload: string) => {
    if (scanning || !payload.trim()) return;

    // Client-side bot protection: cooldown
    const now = Date.now();
    if (now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
      toast({ title: "Bitte warten", description: "Cooldown zwischen Scans aktiv", variant: "destructive" });
      return;
    }

    // Input validation
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

      // Vibrate on mobile for feedback
      if (navigator.vibrate) {
        if (data.color === "green") navigator.vibrate(200);
        else if (data.color === "yellow") navigator.vibrate([100, 50, 100]);
        else navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (err: any) {
      setScanResult({
        result: "error",
        message: "Fehler: " + (err.message || "Unbekannt"),
        color: "red",
      });
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async () => {
    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // On successful scan
          scanner.stop().then(() => {
            setCameraActive(false);
            processQrPayload(decodedText);
          });
        },
        () => {} // ignore errors during scanning
      );
      setCameraActive(true);
    } catch (err: any) {
      toast({
        title: "Kamera-Fehler",
        description: err.message || "Kamera konnte nicht gestartet werden",
        variant: "destructive",
      });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
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
            <p className="text-[10px] text-zinc-500">Ticket-Scanner</p>
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
            {/* Camera Scanner */}
            <div className="relative">
              <div
                id={scannerContainerId}
                className={`w-full rounded-xl overflow-hidden ${cameraActive ? "min-h-[300px]" : "hidden"}`}
              />
              {!cameraActive && (
                <button
                  onClick={startCamera}
                  disabled={scanning}
                  className="w-full flex flex-col items-center justify-center gap-4 py-16 rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-lg font-bold text-emerald-400">SCAN STARTEN</span>
                  <span className="text-xs text-zinc-500">QR-Code oder Barcode scannen</span>
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
              return (
                <Card className={`border-2 ${styles.border} ${styles.bg} animate-in fade-in duration-300`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">{styles.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-xl ${styles.text}`}>{scanResult.message}</p>
                        {scanResult.passenger && (
                          <p className="text-zinc-300 text-sm mt-1">👤 {scanResult.passenger}</p>
                        )}
                        {scanResult.trip && (
                          <p className="text-zinc-400 text-xs mt-1">
                            🚌 {scanResult.trip.route} • {scanResult.trip.date} • {scanResult.trip.time}
                          </p>
                        )}
                        {scanResult.checked_in_at && (
                          <p className="text-zinc-500 text-xs mt-1">
                            Eingecheckt: {new Date(scanResult.checked_in_at).toLocaleString("de-DE")}
                          </p>
                        )}
                      </div>
                    </div>

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
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex">
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
