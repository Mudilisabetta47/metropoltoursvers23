import { ArrowRight, Smartphone, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import TrustLogos from "@/components/home/TrustLogos";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Rich gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-foreground" />
      
      {/* Animated background elements */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--primary-foreground)) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-semibold mb-8 border border-primary-foreground/10"
            >
              <Gift className="w-4 h-4" />
              <span>10% Rabatt auf Ihre erste Buchung</span>
            </motion.div>
            
            <h2 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Bereit für Ihr nächstes{" "}
              <span className="relative">
                Abenteuer?
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary-light rounded-full origin-left"
                />
              </span>
            </h2>
            
            <p className="text-lg text-primary-foreground/70 mb-10 max-w-lg leading-relaxed">
              Laden Sie unsere App herunter und buchen Sie Ihre Reise in Sekunden. 
              Profitieren Sie von exklusiven App-Angeboten und verwalten Sie Ihre Buchungen unterwegs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="hero"
                  size="xl"
                  onClick={() => navigate("/reisen")}
                  className="shadow-lg shadow-primary/30"
                >
                  Jetzt buchen
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="glass" size="xl">
                  <Smartphone className="w-5 h-5" />
                  App herunterladen
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* App Preview Mockup - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateY: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative mx-auto w-72"
            >
              <div className="bg-foreground/80 backdrop-blur-xl rounded-[3rem] p-3 shadow-2xl border border-primary-foreground/10">
                <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full flex flex-col">
                    <div className="bg-primary h-8 flex items-center justify-center">
                      <div className="w-20 h-5 bg-secondary/50 rounded-full" />
                    </div>
                    <div className="bg-primary px-4 pb-6 pt-4">
                      <div className="text-primary-foreground text-sm font-semibold mb-2">METROPOL TOURS</div>
                      <div className="bg-primary-foreground/20 rounded-xl p-3 backdrop-blur-sm">
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
                    <div className="flex-1 p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-muted rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="h-3 bg-foreground/20 rounded w-24" />
                            <div className="h-4 bg-primary rounded-lg w-12" />
                          </div>
                          <div className="h-2 bg-muted-foreground/30 rounded w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -right-10 top-20 bg-card rounded-2xl p-3.5 shadow-2xl border border-border/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">-10%</div>
                    <div className="text-xs text-muted-foreground">Rabatt</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Trust Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <TrustLogos />
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
