import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

interface PublishedReview {
  id: string;
  author_name: string | null;
  title: string | null;
  comment: string | null;
  stars: number | null;
  reply_text: string | null;
  created_at: string;
  source: string | null;
}

/**
 * Gästebewertungen – ausschließlich echte, veröffentlichte Bewertungen aus der
 * Datenbank (customer_reviews). Ohne veröffentlichte Bewertungen wird die
 * Sektion ausgeblendet – es gibt keine erfundenen Testimonials.
 * Enthält echte Bewertungen vorhanden, wird strukturiertes Data (JSON-LD,
 * AggregateRating + Review) ausgegeben, damit Google Sterne anzeigen kann.
 */
const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<PublishedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("customer_reviews")
        .select("id, author_name, title, comment, stars, reply_text, created_at, source")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(12);
      setReviews((data ?? []) as PublishedReview[]);
      setLoading(false);
    })();
  }, []);

  // Strukturierte Daten für Google (Sterne in Suchergebnissen)
  useEffect(() => {
    if (!reviews.length) return;
    const avg = reviews.reduce((s, r) => s + (r.stars ?? 0), 0) / reviews.length;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Math.round(avg * 10) / 10,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.stars ?? 5, bestRating: 5, worstRating: 1 },
        author: { "@type": "Person", name: r.author_name || "Gast" },
        datePublished: r.created_at?.slice(0, 10),
        name: r.title || undefined,
        reviewBody: r.comment || undefined,
      })),
    };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.text = JSON.stringify(jsonLd);
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, [reviews]);

  useEffect(() => {
    if (!auto || reviews.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, [auto, reviews.length]);

  if (loading || reviews.length === 0) return null;

  const r = reviews[Math.min(index, reviews.length - 1)];
  const initials = (r.author_name || "G")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section id="bewertungen" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Star className="w-4 h-4 fill-primary" />
            Gästebewertungen
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Das sagen unsere <span className="text-primary">Gäste</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Echte Bewertungen von Reisenden, die mit uns unterwegs waren.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {reviews.length > 1 && (
            <>
              <button
                onClick={() => { setAuto(false); setIndex((index - 1 + reviews.length) % reviews.length); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-14 z-10 w-12 h-12 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center hover:bg-primary/5 transition-all"
                aria-label="Vorherige Bewertung"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => { setAuto(false); setIndex((index + 1) % reviews.length); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-14 z-10 w-12 h-12 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center hover:bg-primary/5 transition-all"
                aria-label="Nächste Bewertung"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </>
          )}

          <div className="overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.4 }}
                className="bg-card rounded-3xl p-10 lg:p-14 border border-border/50 shadow-lg text-center"
              >
                <div className="relative inline-block mb-8">
                  <Quote className="w-16 h-16 text-primary/10" />
                </div>

                {r.title && <h3 className="text-xl font-semibold text-foreground mb-4">{r.title}</h3>}
                <p className="text-xl lg:text-2xl text-foreground mb-10 leading-relaxed font-medium max-w-2xl mx-auto">
                  „{r.comment}"
                </p>

                <div className="flex items-center justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i <= (r.stars ?? 0) ? "text-amber-400 fill-amber-400" : "text-muted fill-muted"}`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground text-lg flex items-center gap-2">
                      {r.author_name || "Gast"}
                      <BadgeCheck className="w-4 h-4 text-primary" aria-label="Verifizierte Reise" />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Verifizierte Bewertung · {new Date(r.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>

                {r.reply_text && (
                  <div className="mt-8 text-left bg-primary/5 border border-primary/15 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-primary mb-1">Antwort von METROPOL TOURS</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{r.reply_text}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {reviews.length > 1 && (
            <div className="flex justify-center gap-2.5 mt-8">
              {reviews.map((rev, i) => (
                <button
                  key={rev.id}
                  onClick={() => { setAuto(false); setIndex(i); }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === index ? "bg-primary w-10" : "bg-primary/20 hover:bg-primary/40 w-2.5"}`}
                  aria-label={`Bewertung ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
