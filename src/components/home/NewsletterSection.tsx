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
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await (supabase as any).from('admin_mailbox').insert({
        subject: `Newsletter-Anmeldung: ${email}`,
        body: `Neue Newsletter-Anmeldung:\n\nE-Mail: ${email}`,
        sender_email: email,
        source_type: 'newsletter',
        folder: 'inbox',
        tags: ['newsletter'],
      });
      setIsSubmitted(true);
      toast.success("Erfolgreich angemeldet! 🎉");
    } catch {
      toast.error("Fehler beim Anmelden. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-10 lg:p-14 border border-border/50 shadow-lg text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              Exklusive Angebote
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Reise-Deals direkt ins Postfach
            </h2>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Erhalten Sie exklusive Frühbucher-Rabatte, Last-Minute-Angebote und
              Reisetipps – kostenlos und jederzeit abbestellbar.
            </p>

            {isSubmitted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-3 py-5 px-6 rounded-2xl bg-primary/10 text-primary font-semibold text-lg border border-primary/20"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
                Vielen Dank! Sie erhalten bald unsere besten Angebote.
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Ihre E-Mail-Adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 rounded-xl border-border/50 focus:border-primary"
                    aria-label="E-Mail-Adresse für Newsletter"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button type="submit" disabled={isLoading} className="shrink-0 h-12 rounded-xl px-6">
                    {isLoading ? "Wird gesendet..." : (
                      <>
                        Anmelden
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              Kein Spam – max. 2x pro Monat. Jederzeit abbestellbar.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
