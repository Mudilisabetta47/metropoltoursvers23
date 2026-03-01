import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Send, Clock, CheckCircle, AlertTriangle, Loader2,
  FileText, UserCheck, Star, CreditCard
} from "lucide-react";

interface AutomationPanelProps {
  bookingId: string;
  bookingStatus: string;
  paidAt: string | null;
  contactEmail: string;
  passengerDetails: any[];
  participants: number;
}

const emailTypes = [
  {
    type: "booking_confirmation",
    label: "Buchungsbestätigung",
    icon: FileText,
    description: "Bestätigung + Überweisungsdaten",
    color: "text-blue-400",
  },
  {
    type: "payment_reminder",
    label: "Zahlungserinnerung",
    icon: CreditCard,
    description: "Freundliche Erinnerung an offene Zahlung",
    color: "text-amber-400",
  },
  {
    type: "data_completion",
    label: "Daten nachreichen",
    icon: UserCheck,
    description: "Link zum Ergänzen fehlender Passagierdaten",
    color: "text-purple-400",
  },
  {
    type: "pre_departure",
    label: "Vorab-Info (48h)",
    icon: Clock,
    description: "Ticket + Treffpunkt + Checkliste",
    color: "text-emerald-400",
  },
  {
    type: "post_trip_review",
    label: "Bewertungs-Mail",
    icon: Star,
    description: "Feedback nach der Reise einholen",
    color: "text-yellow-400",
  },
];

const AutomationPanel = ({
  bookingId, bookingStatus, paidAt, contactEmail, passengerDetails, participants
}: AutomationPanelProps) => {
  const { toast } = useToast();
  const [sending, setSending] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());

  // Check if passenger data is incomplete
  const isDataIncomplete = !passengerDetails || passengerDetails.length < participants ||
    passengerDetails.some((p: any) => !p.first_name || !p.last_name);

  const sendEmail = async (emailType: string, force = false) => {
    setSending(emailType);
    try {
      const { data, error } = await supabase.functions.invoke("send-automation-email", {
        body: { booking_id: bookingId, email_type: emailType, force },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      if (data.skipped) {
        toast({ title: "Bereits gesendet", description: "Diese E-Mail wurde schon gesendet." });
      } else {
        toast({ title: `📧 ${emailTypes.find(e => e.type === emailType)?.label} gesendet!` });
        setSentEmails(prev => new Set([...prev, emailType]));
      }
    } catch (err: any) {
      toast({ title: "Fehler beim Senden", description: err.message, variant: "destructive" });
    }
    setSending(null);
  };

  const getStatusHint = (type: string) => {
    if (sentEmails.has(type)) return <Badge className="bg-emerald-600/20 text-emerald-400 text-[10px]">Gesendet</Badge>;

    switch (type) {
      case "payment_reminder":
        if (paidAt) return <Badge className="bg-zinc-700/50 text-zinc-500 text-[10px]">Bereits bezahlt</Badge>;
        break;
      case "data_completion":
        if (!isDataIncomplete) return <Badge className="bg-zinc-700/50 text-zinc-500 text-[10px]">Daten vollständig</Badge>;
        return <Badge className="bg-amber-600/20 text-amber-400 text-[10px]">Empfohlen</Badge>;
      case "pre_departure":
        if (bookingStatus !== "confirmed") return <Badge className="bg-zinc-700/50 text-zinc-500 text-[10px]">Erst nach Bestätigung</Badge>;
        break;
    }
    return null;
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-zinc-300">
          <Mail className="w-4 h-4 text-emerald-400" />
          Automatisierte E-Mails
        </CardTitle>
        <p className="text-xs text-zinc-500">An: {contactEmail}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {emailTypes.map((email) => {
          const Icon = email.icon;
          const hint = getStatusHint(email.type);
          const isSending = sending === email.type;

          return (
            <div key={email.type} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${email.color}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{email.label}</span>
                    {hint}
                  </div>
                  <p className="text-[11px] text-zinc-500">{email.description}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-zinc-400 hover:text-white"
                onClick={() => sendEmail(email.type, sentEmails.has(email.type))}
                disabled={isSending}
              >
                {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AutomationPanel;
