import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';

export default function TermsPage() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tour_legal_documents')
        .select('content')
        .eq('document_type', 'agb')
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
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Allgemeine Geschäftsbedingungen</h1>
          <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 lg:p-8">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : content ? (
              <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:font-medium [&_p]:leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            ) : (
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">§ 1 Geltungsbereich</h2>
                  <p className="text-muted-foreground leading-relaxed">Diese Allgemeinen Geschäftsbedingungen gelten für alle Beförderungsverträge zwischen der METROPOL TOURS GmbH (nachfolgend "Unternehmer") und dem Fahrgast (nachfolgend "Kunde").</p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">§ 2 Vertragsschluss</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    (1) Der Beförderungsvertrag kommt durch Buchung und Bezahlung der Fahrkarte zustande.<br /><br />
                    (2) Die Buchung kann online, telefonisch oder bei unseren Partnern erfolgen.<br /><br />
                    (3) Nach erfolgreicher Buchung erhält der Kunde eine Buchungsbestätigung per E-Mail.
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">§ 3 Preise und Zahlung</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    (1) Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.<br /><br />
                    (2) Die Zahlung erfolgt bei der Buchung. Akzeptierte Zahlungsmittel sind Kreditkarte, PayPal und Überweisung.
                  </p>
                </section>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">§ 4 Stornierung und Umbuchung</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    (1) Stornierungen sind gemäß der jeweiligen Tarifbedingungen möglich.<br /><br />
                    (2) Umbuchungen sind bis 12 Stunden vor Abfahrt gegen eine Gebühr möglich.
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
