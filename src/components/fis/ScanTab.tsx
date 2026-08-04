import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Scan, CheckCircle2, AlertTriangle, XCircle, Loader2, History } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScanResult {
  result: string;
  message: string;
  color: string;
  ticket?: any;
}

const SCAN_COOLDOWN_MS = 1500;
const MAX_PAYLOAD_LENGTH = 200;
const QR_PAYLOAD_REGEX = /^[A-Za-z0-9\-_:./]+$/;
const CONTAINER_ID = "fis-qr-reader";

const resultLabel: Record<string, string> = {
  checked_in: "Eingecheckt",
  already_checked_in: "Bereits gescannt",
  invalid: "Ungültig",
  invalid_input: "Ungültiges Format",
  expired: "Abgelaufen",
  not_found: "Nicht gefunden",
  fraud_suspected: "Betrugsverdacht",
};

const ScanTab = ({ userId }: { userId: string }) => {
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef(0);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from("scan_logs")
      .select("id, scan_time, result, message, qr_payload")
      .eq("user_id", userId)
      .order("scan_time", { ascending: false })
      .limit(25);
    setHistory(data || []);
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  const process = async (payload: string) => {
    if (scanning || !payload.trim()) return;
    const now = Date.now();
    if (now - lastScanRef.current < SCAN_COOLDOWN_MS) return;
    const sanitized = payload.trim();
    if (sanitized.length > MAX_PAYLOAD_LENGTH || !QR_PAYLOAD_REGEX.test(sanitized)) {
      setResult({ result: "invalid_input", message: "Ungültiges Ticket-Format", color: "red" });
      return;
    }
    lastScanRef.current = now;
    setScanning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("process-ticket-scan", {
        body: { qr_payload: sanitized },
      });
      if (error) throw error;
      setResult(data as ScanResult);
      if (navigator.vibrate) {
        if (data.color === "green") navigator.vibrate(200);
        else if (data.color === "yellow") navigator.vibrate([100, 50, 100]);
        else navigator.vibrate([200, 100, 200]);
      }
      setManual("");
      loadHistory();
    } catch (err: any) {
      setResult({ result: "error", message: "Fehler: " + (err?.message || "Unbekannt"), color: "red" });
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async () => {
    if (cameraStarting) return;
    setCameraStarting(true);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach((t) => t.stop());
      await new Promise((r) => setTimeout(r, 300));

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) await scannerRef.current.stop();
        } catch {}
        scannerRef.current = null;
      }
      if (!document.getElementById(CONTAINER_ID)) throw new Error("Scanner-Container nicht gefunden");

      const scanner = new Html5Qrcode(CONTAINER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          scanner
            .stop()
            .then(() => {
              setCameraActive(false);
              process(decoded);
            })
            .catch(() => {});
        },
        () => {}
      );
    } catch (err: any) {
      setCameraActive(false);
      toast.error(
        err?.name === "NotAllowedError"
          ? "Bitte Kamerazugriff erlauben und Seite neu laden."
          : err?.name === "NotFoundError"
          ? "Keine Kamera gefunden."
          : err?.message || "Kamera konnte nicht gestartet werden"
      );
    } finally {
      setCameraStarting(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    } catch {}
    setCameraActive(false);
  };

  const styles = (color?: string) =>
    color === "green"
      ? { box: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200", icon: <CheckCircle2 className="w-10 h-10 text-emerald-400" /> }
      : color === "yellow"
      ? { box: "border-amber-500/50 bg-amber-500/10 text-amber-200", icon: <AlertTriangle className="w-10 h-10 text-amber-400" /> }
      : { box: "border-red-500/50 bg-red-500/10 text-red-200", icon: <XCircle className="w-10 h-10 text-red-400" /> };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#131720] border border-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Scan className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-white">Ticket-Scanner</h2>
        </div>

        <div
          id={CONTAINER_ID}
          className={cn("rounded-xl overflow-hidden bg-black mb-3", cameraActive ? "block" : "hidden")}
        />

        {!cameraActive && (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0f1218] h-40 flex flex-col items-center justify-center gap-2 mb-3">
            <Camera className="w-8 h-8 text-zinc-600" />
            <span className="text-xs text-zinc-500">QR-Code oder Barcode scannen</span>
          </div>
        )}

        <button
          onClick={cameraActive ? stopCamera : startCamera}
          disabled={scanning || cameraStarting}
          className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold flex items-center justify-center gap-2 transition"
        >
          {cameraStarting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : cameraActive ? (
            <CameraOff className="w-5 h-5" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
          {cameraActive ? "Kamera stoppen" : "Kamera starten"}
        </button>

        <div className="flex gap-2 mt-3">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && process(manual)}
            placeholder="Ticket-Nr. manuell eingeben"
            className="flex-1 h-11 rounded-xl bg-[#0f1218] border border-white/10 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={() => process(manual)}
            disabled={scanning || !manual.trim()}
            className="h-11 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 flex items-center"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {result && (
        <div className={cn("rounded-2xl border p-4 flex items-start gap-3", styles(result.color).box)}>
          {styles(result.color).icon}
          <div className="min-w-0">
            <div className="font-semibold">{resultLabel[result.result] || result.result}</div>
            <div className="text-sm opacity-90 break-words">{result.message}</div>
            {result.ticket?.booking && (
              <div className="text-xs mt-2 opacity-80">
                {result.ticket.booking.passenger_first_name} {result.ticket.booking.passenger_last_name}
                {result.ticket.booking.seats?.seat_number && ` · Platz ${result.ticket.booking.seats.seat_number}`}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-[#131720] border border-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-zinc-400" />
          <h3 className="font-semibold text-white text-sm">Letzte Scans</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Scans.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl bg-[#0f1218] border border-white/5 px-3 py-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    h.result === "checked_in"
                      ? "bg-emerald-400"
                      : h.result === "already_checked_in"
                      ? "bg-amber-400"
                      : "bg-red-400"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{resultLabel[h.result] || h.result}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{h.qr_payload}</div>
                </div>
                <div className="text-[11px] text-zinc-500 tabular-nums">
                  {format(new Date(h.scan_time), "dd.MM. HH:mm", { locale: de })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanTab;
