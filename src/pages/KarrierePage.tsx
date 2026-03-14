import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, MapPin, Clock, ChevronRight, Send, Users,
  Heart, Shield, Coffee, Bus, Star, CheckCircle2, Sparkles, Rocket
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string | null;
  requirements: string[];
  benefits: string[];
  salary_range: string | null;
  created_at: string;
}

const BENEFITS = [
  { icon: Bus, title: "Kostenlose Reisen", desc: "Mitarbeiterrabatte auf alle Busreisen" },
  { icon: Heart, title: "Work-Life-Balance", desc: "Flexible Arbeitszeiten & 30 Tage Urlaub" },
  { icon: Shield, title: "Sicherheit", desc: "Unbefristete Verträge & faire Vergütung" },
  { icon: Coffee, title: "Team-Kultur", desc: "Regelmäßige Team-Events & flache Hierarchien" },
  { icon: Star, title: "Entwicklung", desc: "Weiterbildungen & Aufstiegsmöglichkeiten" },
  { icon: Users, title: "Familiäres Umfeld", desc: "Kleines Team mit großem Zusammenhalt" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const KarrierePage = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    message: "", job_listing_id: "",
  });

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await (supabase as any)
        .from("job_listings")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setJobs((data as JobListing[]) || []);
      setIsLoading(false);
    };
    fetchJobs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) {
      toast({ title: "Bitte füllen Sie alle Pflichtfelder aus.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await (supabase as any).from("job_applications").insert({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      message: form.message || null,
      job_listing_id: form.job_listing_id || null,
    });

    if (error) {
      toast({ title: "Fehler beim Senden", description: "Bitte versuchen Sie es erneut.", variant: "destructive" });
    } else {
      toast({ title: "Bewerbung gesendet!", description: "Wir melden uns schnellstmöglich bei Ihnen." });
      setForm({ first_name: "", last_name: "", email: "", phone: "", message: "", job_listing_id: "" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 lg:py-28 bg-secondary">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-5 bg-primary/20 text-primary border-0 text-sm px-4 py-1.5">
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
                Karriere bei Metropol Tours
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-secondary-foreground mb-5">
                Werde Teil unseres <span className="gradient-text">Teams</span>
              </h1>
              <p className="text-lg text-secondary-foreground/70 max-w-2xl mx-auto">
                Wir verbinden Menschen mit ihren Traumreisezielen. Gestalte mit uns die Zukunft des Reisens auf dem Balkan.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <Heart className="w-3 h-3 mr-1" />
                Benefits
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Warum Metropol Tours?
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="card-elevated p-8 h-full border border-transparent hover:border-primary/30 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <b.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-2">{b.title}</h3>
                    <p className="text-muted-foreground">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <Briefcase className="w-3 h-3 mr-1" />
                Stellenangebote
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Offene Stellen</h2>
              <p className="text-muted-foreground mt-2">
                Finde die passende Position für dich.
              </p>
            </motion.div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-card rounded-2xl border border-border p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-2">Aktuell keine offenen Stellen</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Initiativbewerbungen sind jederzeit willkommen. Nutze das Formular unten, um dich bei uns vorzustellen.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    <div
                      className={`bg-card rounded-2xl border-2 cursor-pointer transition-all hover:border-primary/30 ${
                        selectedJob === job.id ? "border-primary" : "border-border"
                      }`}
                      style={{ boxShadow: "var(--shadow-card)" }}
                      onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-lg">{job.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.employment_type}</span>
                              <Badge variant="outline" className="rounded-full">{job.department}</Badge>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-all ${selectedJob === job.id ? "bg-primary/10" : ""}`}>
                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selectedJob === job.id ? "rotate-90 text-primary" : ""}`} />
                          </div>
                        </div>

                        {selectedJob === job.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-5 pt-5 border-t border-border"
                          >
                            {job.description && (
                              <p className="text-muted-foreground mb-5 leading-relaxed">{job.description}</p>
                            )}
                            {job.requirements.length > 0 && (
                              <div className="mb-5">
                                <h4 className="font-bold text-foreground mb-3">Anforderungen</h4>
                                <ul className="space-y-2">
                                  {job.requirements.map((r, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {job.salary_range && (
                              <p className="text-primary font-semibold mb-4">Gehalt: {job.salary_range}</p>
                            )}
                            <Button
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm(f => ({ ...f, job_listing_id: job.id }));
                                document.getElementById("bewerbung")?.scrollIntoView({ behavior: "smooth" });
                              }}
                            >
                              Jetzt bewerben <ChevronRight className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Application Form */}
        <section id="bewerbung" className="py-20 lg:py-28 bg-muted/30">
          <div className="max-w-[720px] mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <Send className="w-3 h-3 mr-1" />
                Bewerbung
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Bewerbung senden</h2>
              <p className="text-muted-foreground mt-2">
                Auch Initiativbewerbungen sind willkommen.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-card rounded-2xl border border-border p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {jobs.length > 0 && (
                    <div>
                      <Label>Stelle (optional)</Label>
                      <Select value={form.job_listing_id} onValueChange={v => setForm(f => ({ ...f, job_listing_id: v }))}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Initiativbewerbung" /></SelectTrigger>
                        <SelectContent>
                          {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Vorname *</Label>
                      <Input className="mt-1.5" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Nachname *</Label>
                      <Input className="mt-1.5" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>E-Mail *</Label>
                      <Input type="email" className="mt-1.5" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input className="mt-1.5" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Nachricht / Motivation</Label>
                    <Textarea className="mt-1.5 min-h-[120px]" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Erzähle uns etwas über dich..." />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Wird gesendet..." : "Bewerbung absenden"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KarrierePage;
