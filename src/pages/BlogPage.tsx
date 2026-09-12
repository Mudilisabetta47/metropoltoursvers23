import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, ArrowRight, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  hero_image_url: string | null;
  published_at: string | null;
  tags: string[] | null;
}

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Reise-Magazin & Tipps | Metropol Tours";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Reise-Magazin von METROPOL TOURS: Tipps zu Wochenendtrips, Fahrplan, Live-Tracking und allen Infos rund um Ihre Busreise.");
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, hero_image_url, published_at, tags")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      setPosts((data ?? []) as BlogPost[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!posts.length) return;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `Reise-Magazin – ${SITE_NAME}`,
      url: `${SITE_URL}/blog`,
      blogPost: posts.slice(0, 10).map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${SITE_URL}/blog/${p.slug}`,
        datePublished: p.published_at,
      })),
    });
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, [posts]);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-16 lg:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Newspaper className="w-4 h-4" />
            Reise-Magazin
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
            Tipps & <span className="text-primary">Reisegeschichten</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Alles, was Sie für Ihre nächste Busreise wissen müssen – von Zustiegsorten bis Zieltipps.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        {loading ? (
          <p className="text-center text-muted-foreground py-16">Artikel werden geladen…</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            Aktuell keine Artikel – schauen Sie bald wieder vorbei.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={`/blog/${p.slug}`}
                  className="group block h-full rounded-2xl bg-card border border-border/60 overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    {p.hero_image_url ? (
                      <img
                        src={p.hero_image_url}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
                        <Newspaper className="w-10 h-10 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {p.title}
                    </h2>
                    {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{p.excerpt}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="w-4 h-4" />
                        {p.published_at ? new Date(p.published_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        Lesen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BlogPage;
