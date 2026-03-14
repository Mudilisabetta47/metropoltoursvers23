import { Shield, CreditCard, Lock } from "lucide-react";

const TrustLogos = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-primary-foreground/10">
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <Lock className="w-4 h-4" />
        <span>SSL-verschlüsselt</span>
      </div>
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <CreditCard className="w-4 h-4" />
        <span>PayPal</span>
      </div>
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <CreditCard className="w-4 h-4" />
        <span>Visa / Mastercard</span>
      </div>
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <CreditCard className="w-4 h-4" />
        <span>Überweisung</span>
      </div>
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <Shield className="w-4 h-4" />
        <span>DSGVO-konform</span>
      </div>
    </div>
  );
};

export default TrustLogos;
