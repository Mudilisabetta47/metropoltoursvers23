import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Music2, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSection } from "@/hooks/useSiteContent";

const TIKTOK_HANDLE = "metours.de";
const PROFILE_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;

declare global {
  interface Window {
    tiktokEmbedScriptLoaded?: boolean;
  }
}

function loadTikTokScript() {
  if (window.tiktokEmbedScriptLoaded) return;
  const script = document.createElement("script");
  script.src = "https://www.tiktok.com/embed.js";
  script.async = true;
  document.body.appendChild(script);
  window.tiktokEmbedScriptLoaded = true;
}

/** Einzelnes Video mit 2-Klick-Lösung: erst nach Zustimmung wird tiktok.com geladen. */
function TikTokEmbed({ videoId }: { videoId: string }) {
  const [consented, setConsented] = useState(false);

  if (!consented) {
    return (
      <button
        type="button"
        onClick={() => {
          setConsented(true);
          loadTikTokScript();
        }}
        className="group flex aspect-[9/16] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-muted/40 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/60"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
          <Play className="h-6 w-6 fill-current" />
        </span>
        <span className="text-sm font-semibold text-foreground">TikTok-Video laden</span>
        <span className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Mit dem Laden werden Daten an TikTok übertragen. Details in der Datenschutzerklärung.
        </span>
      </button>
    );
  }

  return (
    <blockquote
      className="tiktok-embed w-full"
      cite={`${PROFILE_URL}/video/${videoId}`}
      data-video-id={videoId}
      style={{ maxWidth: 325, minWidth: 288 }}
    >
      <section>
        <a target="_blank" rel="noopener noreferrer" href={`${PROFILE_URL}/video/${videoId}`}>
          Video auf TikTok ansehen
        </a>
      </section>
    </blockquote>
  );
}

/** Profil-Feed (neueste Videos automatisch) – ebenfalls erst nach Zustimmung. */
function TikTokProfileEmbed({ handle }: { handle: string }) {
  const [consented, setConsented] = useState(false);
  const profileUrl = `https://www.tiktok.com/@${handle}`;

  if (!consented) {
    return (
      <button
        type="button"
        onClick={() => {
          setConsented(true);
          loadTikTokScript();
        }}
        className="group mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-muted/40 p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/60"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
          <Play className="h-6 w-6 fill-current" />
        </span>
        <span className="text-base font-semibold text-foreground">Neueste TikTok-Videos laden</span>
        <span className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Mit dem Laden werden Daten an TikTok übertragen. Details in der Datenschutzerklärung.
        </span>
      </button>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <blockquote
        className="tiktok-embed w-full"
        cite={profileUrl}
        data-unique-id={handle}
        data-embed-type="creator"
        style={{ maxWidth: 780, minWidth: 288 }}
      >
        <section>
          <a target="_blank" rel="noopener noreferrer" href={profileUrl}>
            @{handle}
          </a>
        </section>
      </blockquote>
    </div>
  );
}


const TikTokSection = () => {
  const { meta } = useSiteSection("home_tiktok");
  const videoIds = Array.isArray(meta.video_ids)
    ? (meta.video_ids as unknown[]).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  const handle = typeof meta.handle === "string" && meta.handle ? meta.handle : TIKTOK_HANDLE;
  const profileUrl = `https://www.tiktok.com/@${handle}`;

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Music2 className="h-4 w-4" />
            @{handle}
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground lg:text-4xl">
            METROPOL TOURS auf TikTok
          </h2>
          <p className="mt-3 text-muted-foreground">
            Einblicke hinter die Kulissen, unsere Busse auf Tour und die schönsten Momente
            unterwegs – folge uns und sei live dabei.
          </p>
        </motion.div>

        {videoIds.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            {videoIds.map((id) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45 }}
                className="w-[288px] sm:w-[325px]"
              >
                <TikTokEmbed videoId={id} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <TikTokProfileEmbed handle={handle} />
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Music2 className="h-4 w-4" />
              Neueste Videos direkt von @{handle}
            </div>
          </motion.div>
        )}

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="gap-2">
            <a href={profileUrl} target="_blank" rel="noopener noreferrer">
              Alle Videos auf TikTok
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

      </div>
    </section>
  );
};

export default TikTokSection;
