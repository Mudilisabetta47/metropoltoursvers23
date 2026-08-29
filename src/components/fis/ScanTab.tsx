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
  passenger?: any;
  trip?: any;
  checked_in_at?: string | null;
  detail?: string;
  attempts?: number;
  usedFallback?: string | null;
}

const SCAN_COOLDOWN_MS = 1500;
const MAX_PAYLOAD_LENGTH = 200;
const QR_PAYLOAD_REGEX = /^[A-Za-z0-9\-_:./]+$/;
const CONTAINER_ID = "fis-qr-reader";
const MAX_ATTEMPTS = 3;
const TICKET_NUMBER_REGEX = /((?:TKT|MT|ADM)-[A-Z0-9]+(?:-[A-Z0-9]+)*)/i;

const resultLabel: Record<string, string> = {
  checked_in: "Eingecheckt",
  already_checked_in: "Bereits gescannt",
  invalid: "Ungültig",
  invalid_input: "Ungültiges Format",
  expired: "Abgelaufen",
  not_found: "Nicht gefunden",
  fraud_suspected: "Betrugsverdacht",
  rate_limited: "Zu viele Scans",
  forbidden: "Keine Berechtigung",
  error: "Technischer Fehler",
};

// Klartext-Status für jedes Ergebnis (Statusregeln)
const statusText: Record<string, string> = {
  checked_in: "GÜLTIG – Fahrgast eingecheckt",
  already_checked_in: "BENUTZT – Ticket wurde bereits eingecheckt",
  invalid: "UNGÜLTIG – storniert oder erstattet",
  expired: "ABGELAUFEN – Fahrt liegt in der Vergangenheit",
  not_found: "UNBEKANNT – Ticket nicht im System",
  fraud_suspected: "BETRUGSVERDACHT – bitte Ausweis prüfen",
  invalid_input: "UNGÜLTIGES FORMAT – Ticketnummer prüfen",
  rate_limited: "GESPERRT – zu viele Scans in kurzer Zeit",
  forbidden: "KEINE BERECHTIGUNG – Konto ohne Scan-Rechte",
  error: "FEHLER – Ticketstatus konnte nicht geprüft werden",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Ruft die Edge Function auf und liest bei Fehlern den echten Body/Status aus. */
async function invokeScan(payload: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("process-ticket-scan", {
    body: { qr_payload: payload },
  });
  if (!error) return data;

  let status: number | undefined;
  let detail = error.message || "Unbekannter Fehler";
  const ctx: any = (error as any).context;
  if (ctx && typeof ctx.status === "number") {
    status = ctx.status;
    try {
      const body = await ctx.clone().json();
      detail = body?.error || body?.message || detail;
    } catch {
      try {
        const text = (await ctx.clone().text())?.slice(0, 300);
        if (text) detail = text;
      } catch {
        /* ignore */
      }
    }
  }
  throw Object.assign(new Error(detail), { status });
}

const ScanTab = ({ userId }: { userId: string }) => {
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
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
    const raw = payload.trim();

    // Fallback-Kandidat: Ticketnummer aus QR-Inhalt (z. B. URL) extrahieren
    const extracted = raw.match(TICKET_NUMBER_REGEX)?.[1]?.toUpperCase();
    const candidates = [raw, ...(extracted && extracted !== raw.toUpperCase() ? [extracted] : [])].filter(
      (c) => c.length <= MAX_PAYLOAD_LENGTH && QR_PAYLOAD_REGEX.test(c),
    );

    if (candidates.length === 0) {
      setResult({
        result: "invalid_input",
        message: "Ungültiges Ticket-Format – bitte Ticketnummer manuell eingeben",
        color: "red",
      });
      return;
    }

    lastScanRef.current = now;
    setScanning(true);
    setResult(null);

    let lastError: any = null;
    try {
      for (let ci = 0; ci < candidates.length; ci++) {
        const candidate = candidates[ci];
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          setProgress(
            ci > 0
              ? `Fallback: Ticketnummer ${candidate}…`
              : attempt > 1
              ? `Erneuter Versuch ${attempt}/${MAX_ATTEMPTS}…`
              : "Ticket wird geprüft…",
          );
          try {
            const data = await invokeScan(candidate);
            const enriched: ScanResult = {
              ...(data as ScanResult),
              attempts: attempt,
              usedFallback: ci > 0 ? candidate : null,
            };
            setResult(enriched);
            if (navigator.vibrate) {
              if (enriched.color === "green") navigator.vibrate(200);
              else if (enriched.color === "yellow") navigator.vibrate([100, 50, 100]);
              else navigator.vibrate([200, 100, 200]);
            }
            if (enriched.color === "green") toast.success(statusText[enriched.result] ?? enriched.message);
            else if (enriched.color === "yellow") toast.warning(statusText[enriched.result] ?? enriched.message);
            else toast.error(statusText[enriched.result] ?? enriched.message);
            setManual("");
            loadHistory();
            return;
          } catch (err: any) {
            lastError = err;
            const status: number | undefined = err?.status;
            const retryable = status === undefined || status === 429 || status >= 500;
            if (!retryable || attempt === MAX_ATTEMPTS) break;
            await sleep(400 * attempt);
          }
        }
      }

      const status = lastError?.status;
      const detail = lastError?.message || "Unbekannter Fehler";
      const failure: ScanResult = {
        result: status === 401 ? "forbidden" : status === 429 ? "rate_limited" : "error",
        message:
          status === 401
            ? "Sitzung abgelaufen – bitte neu anmelden."
            : status === 403
            ? "Dein Konto hat keine Scan-Berechtigung."
            : status === 429
            ? "Zu viele Scans. Bitte kurz warten."
            : `Scan fehlgeschlagen (HTTP ${status ?? "n/a"}): ${detail}`,
        color: status === 429 ? "yellow" : "red",
        detail: `${status ?? "Netzwerkfehler"} · ${detail}`,
      };
      setResult(failure);
      toast.error(failure.message);
      setLocalHistory((prev) =>
        [
          {
            id: `local-${Date.now()}`,
            scan_time: new Date().toISOString(),
            result: failure.result,
            qr_payload: candidates[0],
            message: failure.detail,
            local: true,
          },
          ...prev,
        ].slice(0, 10),
      );
    } finally {
      setProgress(null);
      setScanning(false);
    }
  };


  const startCamera = async () => {
    if (cameraStarting) return;
    if (!window.isSecureContext) {
      toast.error("Kamera benötigt eine sichere HTTPS-Verbindung. Bitte https://app.metours.de öffnen.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Dieser Browser unterstützt keinen Kamerazugriff. Bitte Chrome oder Safari verwenden.");
      return;
    }
    setCameraStarting(true);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      stream.getTracks().forEach((t) => t.stop());
      await new Promise((r) => setTimeout(r, 300));

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) await scannerRef.current.stop();
        } catch {}
        scannerRef.current = null;
      }
      if (!document.getElementById(CONTAINER_ID)) throw new Error("Scanner-Container nicht gefunden");

      const scanner = new Html5Qrcode(CONTAINER_ID, {
        verbose: false,
        useBarCodeDetectorIfSupported: true,
      } as any);
      scannerRef.current = scanner;

      const onDecoded = (decoded: string) => {
        scanner
          .stop()
          .then(() => {
            setCameraActive(false);
            process(decoded);
          })
          .catch(() => process(decoded));
      };
      const config = {
        fps: 12,
        qrbox: (w: number, h: number) => {
          const size = Math.floor(Math.min(w, h) * 0.75);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      } as any;

      try {
        await scanner.start({ facingMode: { exact: "environment" } } as any, config, onDecoded, () => {});
      } catch {
        // Fallback: irgendeine verfügbare Kamera (z. B. Laptop / Frontkamera)
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras?.length) throw new Error("Keine Kamera gefunden.");
        const back = cameras.find((c) => /back|rear|environment|rück/i.test(c.label)) ?? cameras[cameras.length - 1];
        await scanner.start(back.id, config, onDecoded, () => {});
      }
    } catch (err: any) {
      setCameraActive(false);
      toast.error(
        err?.name === "NotAllowedError"
          ? "Kamerazugriff wurde blockiert. Bitte in den Browser-Einstellungen erlauben und Seite neu laden."
          : err?.name === "NotFoundError" || err?.name === "OverconstrainedError"
          ? "Keine passende Kamera gefunden."
          : err?.name === "NotReadableError"
          ? "Kamera wird bereits von einer anderen App verwendet. Bitte andere Apps schließen."
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

      {scanning && progress && (
        <div className="rounded-2xl border border-white/10 bg-[#131720] p-3 flex items-center gap-2 text-sm text-zinc-300">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> {progress}
        </div>
      )}

      {result && (
        <div className={cn("rounded-2xl border p-4 flex items-start gap-3", styles(result.color).box)}>
          {styles(result.color).icon}
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{resultLabel[result.result] || result.result}</div>
            <div className="text-xs font-medium uppercase tracking-wide opacity-80">
              {statusText[result.result] ?? "STATUS UNBEKANNT"}
            </div>
            <div className="text-sm opacity-90 break-words mt-1">{result.message}</div>
            {result.checked_in_at && (
              <div className="text-xs opacity-75 mt-1">
                Eingecheckt: {format(new Date(result.checked_in_at), "dd.MM.yyyy HH:mm", { locale: de })} Uhr
              </div>
            )}

            {result.passenger && (
              <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-white/90 rounded-xl bg-black/20 p-3">
                <Info label="Fahrgast" value={result.passenger.name} />
                <Info
                  label="Geburtsdatum"
                  value={
                    result.passenger.date_of_birth
                      ? format(new Date(result.passenger.date_of_birth), "dd.MM.yyyy", { locale: de })
                      : "— nicht hinterlegt"
                  }
                />
                <Info label="Adresse" value={result.passenger.address || "— nicht hinterlegt"} />
                <Info label="E-Mail" value={result.passenger.email} />
                <Info label="Telefon" value={result.passenger.phone} />
                <Info label="Sitzplatz" value={result.passenger.seat ? `Platz ${result.passenger.seat}` : null} />
                <Info label="Buchung" value={result.passenger.booking_number} />
                <Info
                  label="Strecke"
                  value={
                    result.passenger.origin || result.passenger.destination
                      ? `${result.passenger.origin ?? "?"} → ${result.passenger.destination ?? "?"}`
                      : null
                  }
                />
                {result.trip?.route && (
                  <Info
                    label="Fahrt"
                    value={`${result.trip.route}${result.trip.date ? ` · ${format(new Date(result.trip.date), "dd.MM.yyyy", { locale: de })}` : ""}${result.trip.time ? ` · ${String(result.trip.time).slice(0, 5)} Uhr` : ""}`}
                  />
                )}
              </dl>
            )}

            {(result.detail || result.usedFallback || (result.attempts ?? 1) > 1) && (
              <div className="text-[11px] opacity-70 mt-2 break-words">
                {result.usedFallback && `Fallback über Ticketnummer ${result.usedFallback}. `}
                {(result.attempts ?? 1) > 1 && `Versuche: ${result.attempts}. `}
                {result.detail && `Ursache: ${result.detail}`}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-[#131720] border border-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-zinc-400" />
          <h3 className="font-semibold text-white text-sm">Scan-Historie</h3>
        </div>
        {[...localHistory, ...history].length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Scans.</p>
        ) : (
          <div className="space-y-2">
            {[...localHistory, ...history].map((h) => (
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
                  <div className="text-[11px] text-zinc-500 truncate">
                    {h.qr_payload}
                    {h.message ? ` · ${h.message}` : ""}
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 tabular-nums">
                  {format(new Date(h.scan_time), "dd.MM. HH:mm:ss", { locale: de })}
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
