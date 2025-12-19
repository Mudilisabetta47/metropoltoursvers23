import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ImprintPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Impressum</h1>
          
          <div className="bg-card rounded-xl shadow-card p-6 lg:p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Angaben gemäß § 5 TMG</h2>
              <p className="text-muted-foreground">
                METROPOL TOURS GmbH<br />
                Musterstraße 123<br />
                20095 Hamburg<br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Kontakt</h2>
              <p className="text-muted-foreground">
                Telefon: +49 40 123 456 789<br />
                E-Mail: info@metropol-tours.de<br />
                Website: www.metropol-tours.de
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Vertretungsberechtigte Geschäftsführer</h2>
              <p className="text-muted-foreground">
                Max Mustermann<br />
                Maria Musterfrau
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Registereintrag</h2>
              <p className="text-muted-foreground">
                Eintragung im Handelsregister<br />
                Registergericht: Amtsgericht Hamburg<br />
                Registernummer: HRB 123456
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Umsatzsteuer-ID</h2>
              <p className="text-muted-foreground">
                Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
                DE123456789
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Aufsichtsbehörde</h2>
              <p className="text-muted-foreground">
                Behörde für Wirtschaft und Innovation<br />
                Alter Steinweg 4<br />
                20459 Hamburg
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Verbraucherstreitbeilegung</h2>
              <p className="text-muted-foreground">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="text-muted-foreground mt-2">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Haftung für Inhalte</h2>
              <p className="text-muted-foreground">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Haftung für Links</h2>
              <p className="text-muted-foreground">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Urheberrecht</h2>
              <p className="text-muted-foreground">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
