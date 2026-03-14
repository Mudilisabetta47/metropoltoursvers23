import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate subscription
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitted(true);
    setIsLoading(false);
    toast.success("Erfolgreich angemeldet! 🎉");
  };

  return (
    <section className="py-16 lg:py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Exklusive Angebote
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Reise-Deals direkt ins Postfach
          </h2>
          <p className="text-muted-foreground mb-8">
            Erhalten Sie exklusive Frühbucher-Rabatte, Last-Minute-Angebote und
            Reisetipps – kostenlos und jederzeit abbestellbar.
          </p>

          {isSubmitted ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-primary/10 text-primary font-medium"
            >
              <Check className="w-5 h-5" />
              Vielen Dank! Sie erhalten bald unsere besten Angebote.
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Ihre E-Mail-Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  aria-label="E-Mail-Adresse für Newsletter"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="shrink-0">
                {isLoading ? (
                  "Wird gesendet..."
                ) : (
                  <>
                    Anmelden
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Kein Spam – max. 2x pro Monat. Jederzeit abbestellbar.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
