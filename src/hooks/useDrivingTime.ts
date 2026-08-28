import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ComplianceResult,
  DRIVING_LIMITS,
  DutyDay,
  evaluateCompliance,
} from "@/lib/driving/euDrivingRules";

const db = supabase as any;

const todayKey = () => new Date().toISOString().slice(0, 10);

const SELECT =
  "log_date, driving_seconds, break_seconds, block_seconds, driving_since, rest_start, last_break_end, multi_driver";

/**
 * Lenk- und Ruhezeiten des angemeldeten Fahrers.
 * Der Zustand liegt in `driver_duty_log` (ein Eintrag pro Fahrer und Tag),
 * damit ein Gerätewechsel oder App-Neustart die Zeiten nicht verliert.
 */
export const useDrivingTime = (userId: string | undefined) => {
  const [today, setToday] = useState<DutyDay | null>(null);
  const [history, setHistory] = useState<DutyDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const saving = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const { data } = await db
      .from("driver_duty_log")
      .select(SELECT)
      .eq("driver_user_id", userId)
      .gte("log_date", from)
      .order("log_date", { ascending: false });
    const rows = (data ?? []) as DutyDay[];
    setHistory(rows);
    setToday(rows.find((r) => r.log_date === todayKey()) ?? null);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Sekundengenaue Anzeige ohne Dauer-Schreibzugriffe
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const upsert = useCallback(
    async (patch: Record<string, any>) => {
      if (!userId || saving.current) return;
      saving.current = true;
      try {
        const { data } = await db
          .from("driver_duty_log")
          .upsert(
            { driver_user_id: userId, log_date: todayKey(), ...patch },
            { onConflict: "driver_user_id,log_date" },
          )
          .select(SELECT)
          .maybeSingle();
        if (data) {
          setToday(data as DutyDay);
          setHistory((prev) => [
            data as DutyDay,
            ...prev.filter((r) => r.log_date !== (data as DutyDay).log_date),
          ]);
        }
      } finally {
        saving.current = false;
      }
    },
    [userId],
  );

  /** Laufende Lenkzeit in die Tages- und Blocksumme schreiben. */
  const flush = useCallback(async () => {
    if (!today?.driving_since) return { driving_seconds: today?.driving_seconds ?? 0, block_seconds: today?.block_seconds ?? 0 };
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(today.driving_since).getTime()) / 1000));
    const next = {
      driving_seconds: (today.driving_seconds ?? 0) + elapsed,
      block_seconds: (today.block_seconds ?? 0) + elapsed,
    };
    return next;
  }, [today]);

  const startDriving = useCallback(async () => {
    const nowIso = new Date().toISOString();
    // Wurde die Pause erfuellt, beginnt ein neuer Lenkblock.
    let breakSeconds = today?.break_seconds ?? 0;
    let blockSeconds = today?.block_seconds ?? 0;
    let lastBreakEnd = today?.last_break_end ?? null;
    if (today?.rest_start) {
      const pause = Math.max(0, Math.round((Date.now() - new Date(today.rest_start).getTime()) / 1000));
      breakSeconds += pause;
      if (pause >= DRIVING_LIMITS.breakSeconds) {
        blockSeconds = 0;
        lastBreakEnd = nowIso;
      }
    }
    await upsert({
      driving_since: nowIso,
      rest_start: null,
      break_seconds: breakSeconds,
      block_seconds: blockSeconds,
      last_break_end: lastBreakEnd,
    });
  }, [today, upsert]);

  const stopDriving = useCallback(
    async (opts: { startBreak?: boolean } = {}) => {
      const totals = await flush();
      await upsert({
        ...totals,
        driving_since: null,
        rest_start: opts.startBreak ? new Date().toISOString() : null,
      });
    },
    [flush, upsert],
  );

  const setMultiDriver = useCallback(
    async (value: boolean) => upsert({ multi_driver: value }),
    [upsert],
  );

  // Periodisches Sichern, damit ein App-Absturz maximal 5 Minuten kostet
  useEffect(() => {
    if (!today?.driving_since) return;
    const t = setInterval(async () => {
      const totals = await flush();
      await upsert({ ...totals, driving_since: new Date().toISOString() });
    }, 300000);
    return () => clearInterval(t);
  }, [today?.driving_since, flush, upsert]);

  const compliance: ComplianceResult = evaluateCompliance(today, history, new Date());
  void tick;

  return {
    compliance,
    today,
    history,
    isLoading,
    startDriving,
    stopDriving,
    setMultiDriver,
    reload: load,
  };
};
