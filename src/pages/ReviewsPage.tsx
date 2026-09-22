import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, BadgeCheck, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/seo";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface PublishedReview {
  id: string;
  author_name: string | null;
  title: string | null;
  comment: string | null;
  stars: number | null;
  reply_text: string | null;
  created_at: string;
}

const PAGE_PATH = "/bewertungen";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

/** Setzt/aktualisiert ein Meta-Tag im <head> und meldet eine Aufräumfunktion. */
const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  let created = false;
  const previous = el?.getAttribute("content") ?? null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
    created = true;
  }
  el.setAttribute("content", content);
  return () => {
    if (!el) return;
    if (created) el.remove();
    else if (previous !== null) el.setAttribute("content", previous);
  };
};

/**
 * Öffentliche Bewertungsseite – zeigt ausschließlich echte, freigegebene
 * Bewertungen aus customer_reviews und gibt Open-Graph-Tags aus (ohne
 * Review-/AggregateRating-JSON-LD für das eigene Unternehmen).
 */
const ReviewsPage = () => {
  const [reviews, setReviews] = useState<PublishedReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("customer_reviews")
        .select("id, author_name, title, comment, stars, reply_text, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setReviews((data ?? []) as PublishedReview[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((s, r) => s + (r.stars ?? 0), 0);
    const avg = Math.round((sum / reviews.length) * 10) / 10;
    const dist = [5, 4, 3, 2, 1].map((s) => ({
      stars: s,
      count: reviews.filter((r) => r.stars === s).length,
    }));
    return { avg, count: reviews.length, dist };
  }, [reviews]);

  // Titel, Beschreibung, Canonical & Open Graph
  useEffect(() => {
    const prevTitle = document.title;
    const ratingText = stats ? `${stats.avg.toFixed(1).replace(".", ",")} von 5 Sternen aus ${stats.count} Bewertungen. ` : "";
    const title = stats
      ? `Kundenbewertungen ${stats.avg.toFixed(1).replace(".", ",")}/5 (${stats.count}) | Metropol Tours`
      : "Kundenbewertungen | Metropol Tours";
    const description = `${ratingText}Echte Erfahrungen unserer Gäste mit Busreisen, Gruppenreisen und Busvermietung von METROPOL TOURS.`;

    document.title = title;

    const cleanups = [
      setMeta('meta[name="description"]', "name", "description", description),
      setMeta('meta[property="og:type"]', "property", "og:type", "website"),
      setMeta('meta[property="og:url"]', "property", "og:url", PAGE_URL),
      setMeta('meta[property="og:title"]', "property", "og:title", title),
      setMeta('meta[property="og:description"]', "property", "og:description", description),
      setMeta('meta[name="twitter:title"]', "name", "twitter:title", title),
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", description),
      setMeta('meta[name="twitter:url"]', "name", "twitter:url", PAGE_URL),
    ];

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = PAGE_URL;

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn());
      if (canonical && prevCanonical) canonical.href = prevCanonical;
    };
  }, [stats]);

  // Kein Review-/AggregateRating-JSON-LD: selbst verwaltete Bewertungen über
  // das eigene Unternehmen qualifizieren laut Google nicht für Review-Snippets.
  // Die sichtbare Darstellung der Bewertungen bleibt unverändert.


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-16 lg:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Star className="w-4 h-4 fill-primary" />
            Gästebewertungen
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
            Bewertungen unserer <span className="text-primary">Gäste</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Echte Rückmeldungen von Reisenden, die mit METROPOL TOURS unterwegs waren.
          </p>

          {stats && (
            <div className="mt-10 inline-flex flex-col items-center gap-3 rounded-3xl bg-card border border-border/60 px-10 py-8 shadow-lg">
              <p className="text-5xl font-bold text-foreground">
                {stats.avg.toFixed(1).replace(".", ",")}
                <span className="text-2xl text-muted-foreground"> / 5</span>
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i <= Math.round(stats.avg) ? "text-amber-400 fill-amber-400" : "text-muted fill-muted"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Basierend auf {stats.count} verifizierten Bewertungen
              </p>
              <div className="w-64 space-y-1.5 pt-2">
                {stats.dist.map((d) => (
                  <div key={d.stars} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-8 text-right">{d.stars} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${stats.count ? (d.count / stats.count) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-6">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        {loading ? (
          <p className="text-center text-muted-foreground py-16">Bewertungen werden geladen…</p>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            Aktuell sind keine freigegebenen Bewertungen vorhanden.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="h-full rounded-2xl bg-card border border-border/60 p-6 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <Quote className="w-8 h-8 text-primary/15 mb-3" />
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= (r.stars ?? 0) ? "text-amber-400 fill-amber-400" : "text-muted fill-muted"}`}
                    />
                  ))}
                </div>
                {r.title && <h2 className="text-lg font-semibold text-foreground mb-2">{r.title}</h2>}
                {r.comment && <p className="text-sm text-muted-foreground leading-relaxed mb-4">„{r.comment}"</p>}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{r.author_name || "Gast"}</span>
                  <BadgeCheck className="w-4 h-4 text-primary" aria-label="Verifizierte Reise" />
                  <span className="text-muted-foreground">
                    · {new Date(r.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>
                {r.reply_text && (
                  <div className="mt-4 bg-primary/5 border border-primary/15 rounded-xl p-4">
                    <p className="text-xs font-semibold text-primary mb-1">Antwort von METROPOL TOURS</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{r.reply_text}</p>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default ReviewsPage;
