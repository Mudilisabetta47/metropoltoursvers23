import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import FISLayout from "@/components/fis/FISLayout";
import DashboardTab from "@/components/fis/DashboardTab";
import TripsTab from "@/components/fis/TripsTab";
import VehicleTab from "@/components/fis/VehicleTab";
import ChatTab from "@/components/fis/ChatTab";
import MoreTab from "@/components/fis/MoreTab";

export type FISTab = "dashboard" | "trips" | "vehicle" | "chat" | "more";

const FISPage = () => {
  const { user, isDriver, isAdmin, isOffice, isLoading } = useAuth();
  const [tab, setTab] = useState<FISTab>("dashboard");
  const [status, setStatus] = useState<string>("off_duty");

  // Bootstrap driver_status row
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("driver_status")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.status) setStatus(data.status);
      else {
        await (supabase as any)
          .from("driver_status")
          .upsert({ user_id: user.id, status: "off_duty" }, { onConflict: "user_id" });
      }
    })();
  }, [user]);

  const updateStatus = async (newStatus: string) => {
    if (!user) return;
    setStatus(newStatus);
    await (supabase as any)
      .from("driver_status")
      .upsert(
        { user_id: user.id, status: newStatus, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0d13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?redirect=/fahrer" replace />;
  if (!isDriver && !isAdmin && !isOffice) return <Navigate to="/" replace />;

  return (
    <FISLayout
      tab={tab}
      onTabChange={setTab}
      status={status}
      onStatusChange={updateStatus}
      userId={user.id}
    >
      {tab === "dashboard" && (
        <DashboardTab userId={user.id} status={status} onStatusChange={updateStatus} />
      )}
      {tab === "trips" && <TripsTab userId={user.id} />}
      {tab === "vehicle" && <VehicleTab userId={user.id} />}
      {tab === "chat" && <ChatTab userId={user.id} />}
      {tab === "more" && <MoreTab userId={user.id} />}
    </FISLayout>
  );
};

export default FISPage;
