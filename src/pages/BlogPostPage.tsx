import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, ArrowLeft, ArrowRight, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, SITE_NAME, absoluteUrl, withBrand } from "@/lib/seo";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  hero_image_url: string | null;
  author_name: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  updated_at: string | null;
  tags: string[] | null;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, content, hero_image_url, author_name, meta_title, meta_description, published_at, updated_at, tags")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
      } else {
        setPost(data as BlogPost);
        document.title = withBrand(data.meta_title || data.title);
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", data.meta_description || data.excerpt || "");
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.meta_description || post.excerpt || undefined,
      image: post.hero_image_url || undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { "@type": "Organization", name: post.author_name || SITE_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    });
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, [post]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Artikel wird geladen…</div>;
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-3">Artikel nicht gefunden</h1>
        <p className="text-muted-foreground mb-6">Dieser Artikel existiert nicht oder wurde verschoben.</p>
        <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">
          <ArrowLeft className="w-4 h-4" /> Zum Reise-Magazin
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative h-[46vh] min-h-80 overflow-hidden">
        {post.hero_image_url ? (
          <img src={post.hero_image_url} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/25 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        <div className="container relative mx-auto h-full flex flex-col justify-end px-4 pb-10">
          <nav className="mb-4 flex items-center gap-2 text-sm text-white/70">
            <Link to="/" className="hover:text-white">Start</Link>
            <span>›</span>
            <Link to="/blog" className="hover:text-white">Magazin</Link>
          </nav>
          <h1 className="max-w-3xl text-3xl md:text-5xl font-bold text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-white/85 text-sm">
            {post.author_name && (
              <span className="inline-flex items-center gap-1.5"><User className="w-4 h-4" />{post.author_name}</span>
            )}
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {new Date(post.published_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {post.excerpt && <p className="text-lg text-muted-foreground mb-8">{post.excerpt}</p>}
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => {
                  const hrefStr = String(href ?? "");
                  const internal = hrefStr.startsWith("/");
                  return internal ? (
                    <Link to={hrefStr}>{children}</Link>
                  ) : (
                    <a href={hrefStr} target="_blank" rel="noopener noreferrer">{children}</a>
                  );
                },
              }}
            >
              {post.content || ""}
            </ReactMarkdown>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10">
              {post.tags.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{t}</span>
              ))}
            </div>
          )}

          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border font-medium hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Alle Artikel
            </Link>
            <Link
              to="/wochenendtrips"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
            >
              Jetzt Reisen entdecken <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPostPage;
