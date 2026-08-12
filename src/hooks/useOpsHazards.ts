import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OpsHazard } from "@/lib/ops/hazards";

const db = supabase as any;

/** Verkehrs-/Gefahrenmeldungen inkl. Supabase Realtime. */
export const useOpsHazards = () => {
  const [hazards, setHazards] = useState<OpsHazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await db
      .from("ops_hazards")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(500);
    const now = Date.now();
    setHazards(
      ((data ?? []) as OpsHazard[]).filter(
        (h) => !h.valid_until || new Date(h.valid_until).getTime() > now,
      ),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("ops-hazards")
      .on("postgres_changes", { event: "*", schema: "public", table: "ops_hazards" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const createHazard = useCallback(
    async (payload: Partial<OpsHazard> & { hazard_type: string; title: string; latitude: number; longitude: number }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await db.from("ops_hazards").insert({ ...payload, created_by: auth.user?.id ?? null });
      if (error) throw error;
      await load();
    },
    [load],
  );

  const deactivateHazard = useCallback(
    async (id: string) => {
      const { error } = await db.from("ops_hazards").update({ is_active: false }).eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  return { hazards, isLoading, reload: load, createHazard, deactivateHazard };
};
