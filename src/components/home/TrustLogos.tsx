import { Shield, Lock } from "lucide-react";

const TrustLogos = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-8 border-t border-primary-foreground/10">
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <Lock className="w-4 h-4" />
        <span>SSL-verschlüsselt</span>
      </div>
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <img
          src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
          alt="PayPal"
          className="h-5 brightness-0 invert opacity-60"
          loading="lazy"
        />
      </div>
      <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
        <Shield className="w-4 h-4" />
        <span>DSGVO-konform</span>
      </div>
    </div>
  );
};

export default TrustLogos;
