import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, MapPin, Clock, ChevronRight, Send, Users,
  Heart, Shield, Coffee, Bus, Star, CheckCircle2, Rocket,
  Upload, FileText, X
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const KarrierePage = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    message: "", job_listing_id: "",
    address: "", city: "", postal_code: "",
    earliest_start_date: "",
    experience_years: "",
    desired_salary: "",
    how_found_us: "",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Nur PDF oder Word-Dateien erlaubt.", variant: "destructive" });
      return;
    }
    if (file.size > maxSize) {
      toast({ title: "Datei darf maximal 10 MB groß sein.", variant: "destructive" });
      return;
    }
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) {
      toast({ title: "Bitte füllen Sie alle Pflichtfelder aus.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    let resume_url: string | null = null;
    let resume_filename: string | null = null;

    // Upload file if present
    if (resumeFile) {
      const ext = resumeFile.name.split(".").pop();
      const filePath = `${Date.now()}_${form.last_name}_${form.first_name}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("job-applications")
        .upload(filePath, resumeFile);
      if (uploadError) {
        toast({ title: "Fehler beim Hochladen der Datei", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      resume_url = filePath;
      resume_filename = resumeFile.name;
    }

    const { error } = await (supabase as any).from("job_applications").insert({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      message: form.message || null,
      job_listing_id: form.job_listing_id || null,
      address: form.address || null,
      city: form.city || null,
      postal_code: form.postal_code || null,
      earliest_start_date: form.earliest_start_date || null,
      experience_years: form.experience_years || null,
      desired_salary: form.desired_salary || null,
      how_found_us: form.how_found_us || null,
      resume_url,
      resume_filename,
    });

    if (!error) {
      const jobTitle = jobs.find(j => j.id === form.job_listing_id)?.title || "Initiativbewerbung";
      await (supabase as any).from("admin_mailbox").insert({
        folder: "inbox",
        subject: `Neue Bewerbung: ${form.first_name} ${form.last_name} – ${jobTitle}`,
        body: `Neue Bewerbung eingegangen.\n\nName: ${form.first_name} ${form.last_name}\nE-Mail: ${form.email}\nTelefon: ${form.phone || "—"}\nAdresse: ${form.address || "—"}, ${form.postal_code || ""} ${form.city || ""}\nFrühester Start: ${form.earliest_start_date || "—"}\nBerufserfahrung: ${form.experience_years || "—"}\nGehaltsvorstellung: ${form.desired_salary || "—"}\nGefunden über: ${form.how_found_us || "—"}\nLebenslauf: ${resume_filename || "Nicht hochgeladen"}\n\nNachricht:\n${form.message || "Keine Nachricht"}`,
        sender_email: form.email,
        sender_name: `${form.first_name} ${form.last_name}`,
        source_type: "application",
        tags: ["bewerbung"],
      });
    }

    if (error) {
      toast({ title: "Fehler beim Senden", description: "Bitte versuchen Sie es erneut.", variant: "destructive" });
    } else {
      toast({ title: "Bewerbung gesendet!", description: "Wir melden uns schnellstmöglich bei Ihnen." });
      setForm({ first_name: "", last_name: "", email: "", phone: "", message: "", job_listing_id: "", address: "", city: "", postal_code: "", earliest_start_date: "", experience_years: "", desired_salary: "", how_found_us: "" });
      setResumeFile(null);
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
                Wir verbinden Menschen mit ihren Traumreisezielen. Gestalte mit uns die Zukunft des komfortablen Reisens in Europa.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-0"><Heart className="w-3 h-3 mr-1" />Benefits</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Warum Metropol Tours?</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((b, i) => (
                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="group">
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
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
              <Badge className="mb-4 bg-primary/10 text-primary border-0"><Briefcase className="w-3 h-3 mr-1" />Stellenangebote</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Offene Stellen</h2>
              <p className="text-muted-foreground mt-2">Finde die passende Position für dich.</p>
            </motion.div>

            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : jobs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-card rounded-2xl border border-border p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-2">Aktuell keine offenen Stellen</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">Initiativbewerbungen sind jederzeit willkommen. Nutze das Formular unten.</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, i) => (
                  <motion.div key={job.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <div
                      className={`bg-card rounded-2xl border-2 cursor-pointer transition-all hover:border-primary/30 ${selectedJob === job.id ? "border-primary" : "border-border"}`}
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
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-5 pt-5 border-t border-border">
                            {job.description && <p className="text-muted-foreground mb-5 leading-relaxed">{job.description}</p>}
                            {job.requirements.length > 0 && (
                              <div className="mb-5">
                                <h4 className="font-bold text-foreground mb-3">Anforderungen</h4>
                                <ul className="space-y-2">
                                  {job.requirements.map((r, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />{r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {job.salary_range && <p className="text-primary font-semibold mb-4">Gehalt: {job.salary_range}</p>}
                            <Button className="gap-2" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, job_listing_id: job.id })); document.getElementById("bewerbung")?.scrollIntoView({ behavior: "smooth" }); }}>
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
          <div className="max-w-[820px] mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <Badge className="mb-4 bg-primary/10 text-primary border-0"><Send className="w-3 h-3 mr-1" />Bewerbung</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Bewerbung senden</h2>
              <p className="text-muted-foreground mt-2">Auch Initiativbewerbungen sind willkommen.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="bg-card rounded-2xl border border-border p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Job selection */}
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

                  {/* Personal info */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Persönliche Daten
                    </h3>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>E-Mail *</Label>
                        <Input type="email" className="mt-1.5" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                      </div>
                      <div>
                        <Label>Telefon</Label>
                        <Input className="mt-1.5" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Adresse</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Straße & Hausnummer</Label>
                        <Input className="mt-1.5" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>PLZ</Label>
                          <Input className="mt-1.5" value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Stadt</Label>
                          <Input className="mt-1.5" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional info */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" /> Berufliche Angaben
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Berufserfahrung</Label>
                        <Select value={form.experience_years} onValueChange={v => setForm(f => ({ ...f, experience_years: v }))}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keine">Keine / Berufseinsteiger</SelectItem>
                            <SelectItem value="1-2">1–2 Jahre</SelectItem>
                            <SelectItem value="3-5">3–5 Jahre</SelectItem>
                            <SelectItem value="5-10">5–10 Jahre</SelectItem>
                            <SelectItem value="10+">Mehr als 10 Jahre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Frühester Starttermin</Label>
                        <Input type="date" className="mt-1.5" value={form.earliest_start_date} onChange={e => setForm(f => ({ ...f, earliest_start_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>Gehaltsvorstellung (brutto/Jahr)</Label>
                        <Input className="mt-1.5" placeholder="z.B. 35.000 €" value={form.desired_salary} onChange={e => setForm(f => ({ ...f, desired_salary: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Wie haben Sie uns gefunden?</Label>
                        <Select value={form.how_found_us} onValueChange={v => setForm(f => ({ ...f, how_found_us: v }))}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="empfehlung">Empfehlung</SelectItem>
                            <SelectItem value="jobportal">Jobportal</SelectItem>
                            <SelectItem value="sonstiges">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Lebenslauf / Dokumente
                    </h3>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {resumeFile ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{resumeFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => { setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Upload className="w-8 h-8" />
                        <span className="text-sm font-medium">Datei auswählen oder hierher ziehen</span>
                        <span className="text-xs">PDF oder Word, max. 10 MB</span>
                      </button>
                    )}
                  </div>

                  {/* Message */}
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
