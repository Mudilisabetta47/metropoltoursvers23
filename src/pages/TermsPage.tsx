import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import DOMPurify from 'dompurify';
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
              <div
                className="prose prose-sm max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:font-medium [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.replace(/\n/g, '<br />')) }}
              />
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">AGB werden derzeit finalisiert.</p>
                  <p className="text-muted-foreground">
                    Unsere Allgemeinen Geschäftsbedingungen sind noch nicht veröffentlicht. Buchungen sind
                    aktuell nur nach vorheriger Rücksprache möglich. Bitte kontaktieren Sie uns unter{' '}
                    <a href="mailto:info@metours.de" className="text-primary hover:underline">info@metours.de</a>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
