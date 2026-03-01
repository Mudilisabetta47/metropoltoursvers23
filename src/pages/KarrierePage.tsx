import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, MapPin, Clock, ChevronRight, Send, Users, 
  Heart, Shield, Coffee, Bus, Star, CheckCircle2
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 lg:py-28">
          <div className="max-w-[1240px] mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
                <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Karriere bei Metropol Tours
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Werde Teil unseres <span className="text-primary">Teams</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Wir verbinden Menschen mit ihren Traumreisezielen. Gestalte mit uns die Zukunft des Reisens auf dem Balkan.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-[1240px] mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">
              Warum Metropol Tours?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="border-border bg-card hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <b.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                        <p className="text-sm text-muted-foreground">{b.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="py-16">
          <div className="max-w-[1240px] mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">Offene Stellen</h2>
            <p className="text-muted-foreground mb-8">
              Finde die passende Position für dich.
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="p-10 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Aktuell keine offenen Stellen</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Initiativbewerbungen sind jederzeit willkommen. Nutze das Formular unten, um dich bei uns vorzustellen.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <motion.div key={job.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <Card
                      className={`border-border bg-card cursor-pointer transition-all hover:shadow-md ${
                        selectedJob === job.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-lg">{job.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.employment_type}</span>
                              <Badge variant="outline">{job.department}</Badge>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${selectedJob === job.id ? "rotate-90" : ""}`} />
                        </div>

                        {selectedJob === job.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-4 pt-4 border-t border-border"
                          >
                            {job.description && (
                              <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
                            )}
                            {job.requirements.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-foreground mb-2">Anforderungen</h4>
                                <ul className="space-y-1.5">
                                  {job.requirements.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {job.salary_range && (
                              <p className="text-sm text-primary font-medium">Gehalt: {job.salary_range}</p>
                            )}
                            <Button
                              className="mt-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm(f => ({ ...f, job_listing_id: job.id }));
                                document.getElementById("bewerbung")?.scrollIntoView({ behavior: "smooth" });
                              }}
                            >
                              Jetzt bewerben <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Application Form */}
        <section id="bewerbung" className="py-16 bg-muted/30">
          <div className="max-w-[720px] mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">Bewerbung senden</h2>
            <p className="text-muted-foreground mb-8">
              Auch Initiativbewerbungen sind willkommen.
            </p>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
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
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Wird gesendet..." : "Bewerbung absenden"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KarrierePage;
