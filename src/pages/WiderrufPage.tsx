import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LegalMarkdown from '@/components/legal/LegalMarkdown';
import { supabase } from '@/integrations/supabase/client';

export default function WiderrufPage() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tour_legal_documents')
        .select('content')
        .eq('document_type', 'widerruf')
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
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Widerrufsbelehrung</h1>
          <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 lg:p-8">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : content ? (
              <LegalMarkdown content={content} />
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  Die Widerrufsbelehrung wird derzeit aktualisiert. Bitte kontaktieren Sie uns unter{' '}
                  <a href="mailto:kundenservice@metours.de" className="text-primary hover:underline">kundenservice@metours.de</a>.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
