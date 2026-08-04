import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserRound, ChevronRight } from "lucide-react";

const cache = new Map<string, string>();

/** Clickable driver chip inside an incident/SOS message → opens the driver mask. */
const IncidentDriverLink = ({ driverId }: { driverId: string }) => {
  const navigate = useNavigate();
  const [name, setName] = useState<string>(cache.get(driverId) ?? "");

  useEffect(() => {
    if (cache.has(driverId)) return;
    let active = true;
    supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", driverId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        const n = [data.first_name, data.last_name].filter(Boolean).join(" ") || data.email;
        cache.set(driverId, n);
        setName(n);
      });
    return () => { active = false; };
  }, [driverId]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/admin/drivers/${driverId}`);
      }}
      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:text-emerald-200 transition"
      title="Fahrermaske öffnen"
    >
      <UserRound className="w-3 h-3" />
      {name || "Fahrer öffnen"}
      <ChevronRight className="w-3 h-3 opacity-70" />
    </button>
  );
};

export default IncidentDriverLink;
