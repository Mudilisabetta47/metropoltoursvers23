import { ArrowRight, Smartphone, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-primary via-primary to-primary-dark relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6">
              <Gift className="w-4 h-4" />
              <span>10% Rabatt auf Ihre erste Buchung</span>
            </div>
            
            <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
              Bereit für Ihr nächstes Abenteuer?
            </h2>
            
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
              Laden Sie unsere App herunter und buchen Sie Ihre Reise in Sekunden. 
              Profitieren Sie von exklusiven App-Angeboten und verwalten Sie Ihre Buchungen unterwegs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate("/search")}
              >
                Jetzt buchen
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="glass"
                size="xl"
              >
                <Smartphone className="w-5 h-5" />
                App herunterladen
              </Button>
            </div>
          </div>

          {/* App Preview Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto w-72">
              {/* Phone Frame */}
              <div className="bg-secondary rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  {/* App Screen Content */}
                  <div className="h-full flex flex-col">
                    {/* Status Bar */}
                    <div className="bg-primary h-8 flex items-center justify-center">
                      <div className="w-20 h-5 bg-secondary rounded-full" />
                    </div>
                    
                    {/* App Header */}
                    <div className="bg-primary px-4 pb-6 pt-4">
                      <div className="text-primary-foreground text-sm font-semibold mb-2">GreenBus</div>
                      <div className="bg-primary-foreground/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          <div className="h-3 bg-primary-foreground/50 rounded flex-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <div className="h-3 bg-primary-foreground/50 rounded flex-1" />
                        </div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="flex-1 p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-muted rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="h-3 bg-foreground/20 rounded w-24" />
                            <div className="h-4 bg-primary rounded w-12" />
                          </div>
                          <div className="h-2 bg-muted-foreground/30 rounded w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -right-8 top-20 bg-card rounded-xl p-3 shadow-elevated animate-bounce" style={{ animationDuration: "3s" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">-10%</div>
                    <div className="text-[10px] text-muted-foreground">Rabatt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
