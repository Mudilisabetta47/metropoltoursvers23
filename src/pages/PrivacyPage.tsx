import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';

export default function PrivacyPage() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tour_legal_documents')
        .select('content')
        .eq('document_type', 'datenschutz')
        .eq('is_current', true)
        .maybeSingle();
      setContent(data?.content || null);
      setIsLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 lg:pt-24">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Datenschutzerklärung</h1>
          <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 lg:p-8">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : content ? (
              <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:font-medium [&_p]:leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            ) : (
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">1. Datenschutz auf einen Blick</h2>
                  <p className="text-muted-foreground leading-relaxed">Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.</p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">2. Verantwortlicher</h2>
                  <p className="text-muted-foreground leading-relaxed">METROPOL TOURS GmbH<br />Musterstraße 123<br />20095 Hamburg<br />E-Mail: datenschutz@metropol-tours.de</p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">3. Datenerfassung auf dieser Website</h2>
                  <p className="text-muted-foreground leading-relaxed">Unsere Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät speichert. Cookies helfen uns dabei, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen.</p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">4. Ihre Rechte</h2>
                  <p className="text-muted-foreground leading-relaxed">Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung oder Löschung dieser Daten.</p>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
