import AdminLayout from "@/components/admin/AdminLayout";
import { Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AdminStubProps {
  title: string;
  subtitle?: string;
  description?: string;
}

export default function AdminStub({ title, subtitle, description }: AdminStubProps) {
  const navigate = useNavigate();
  return (
    <AdminLayout title={title} subtitle={subtitle}>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md text-center space-y-5 p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#00CC36]/10 border border-[#00CC36]/30 flex items-center justify-center">
            <Construction className="w-7 h-7 text-[#00CC36]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-zinc-400 mt-2">
              {description || "Dieser Bereich wird gerade vorbereitet und ist in Kürze verfügbar."}
            </p>
          </div>
          <Button onClick={() => navigate("/admin/dashboard")} className="bg-[#00CC36] hover:bg-[#00b82f] text-black">
            Zurück zum Cockpit
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
