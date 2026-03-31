import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';

export default function ImprintPage() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tour_legal_documents')
        .select('content')
        .eq('document_type', 'impressum')
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
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Impressum</h1>
          <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 lg:p-8">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : content ? (
              <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:font-medium [&_p]:leading-relaxed [&_br]:leading-loose" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            ) : (
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Angaben gemäß § 5 TMG</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    METROPOL TOURS GmbH<br />Musterstraße 123<br />20095 Hamburg<br />Deutschland
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Kontakt</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Telefon: +49 40 123 456 789<br />E-Mail: info@metropol-tours.de<br />Website: www.metropol-tours.de
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Vertretungsberechtigte Geschäftsführer</h2>
                  <p className="text-muted-foreground leading-relaxed">Max Mustermann<br />Maria Musterfrau</p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Registereintrag</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Eintragung im Handelsregister<br />Registergericht: Amtsgericht Hamburg<br />Registernummer: HRB 123456
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Umsatzsteuer-ID</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />DE 123 456 789
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
                  <p className="text-muted-foreground leading-relaxed">Max Mustermann<br />METROPOL TOURS GmbH<br />Musterstraße 123<br />20095 Hamburg</p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Streitschlichtung</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                  </p>
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
