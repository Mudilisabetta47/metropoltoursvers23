import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Datenschutzerklärung</h1>
          
          <div className="bg-card rounded-xl shadow-card p-6 lg:p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Datenschutz auf einen Blick</h2>
              <h3 className="text-lg font-medium text-foreground mb-2">Allgemeine Hinweise</h3>
              <p className="text-muted-foreground">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Verantwortlicher</h2>
              <p className="text-muted-foreground">
                METROPOL TOURS GmbH<br />
                Musterstraße 123<br />
                20095 Hamburg<br />
                E-Mail: datenschutz@metropol-tours.de
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Cookies</h3>
              <p className="text-muted-foreground mb-4">
                Unsere Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät speichert. Cookies helfen uns dabei, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen.
              </p>
              <p className="text-muted-foreground">
                Einige Cookies sind "Session-Cookies". Solche Cookies werden nach Ende Ihrer Browser-Sitzung von selbst gelöscht. Hingegen bleiben andere Cookies auf Ihrem Endgerät bestehen, bis Sie diese selbst löschen. Solche Cookies helfen uns, Sie bei Rückkehr auf unserer Website wiederzuerkennen.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Server-Log-Dateien</h3>
              <p className="text-muted-foreground">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:<br />
                • Browsertyp und Browserversion<br />
                • Verwendetes Betriebssystem<br />
                • Referrer URL<br />
                • Hostname des zugreifenden Rechners<br />
                • Uhrzeit der Serveranfrage<br />
                • IP-Adresse
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Buchungen und Zahlungen</h2>
              <p className="text-muted-foreground">
                Bei einer Buchung erheben wir folgende Daten:<br />
                • Name und Vorname<br />
                • E-Mail-Adresse<br />
                • Telefonnummer (optional)<br />
                • Zahlungsinformationen<br />
                • Reisedaten
              </p>
              <p className="text-muted-foreground mt-4">
                Diese Daten werden zur Durchführung des Beförderungsvertrages und zur Erfüllung unserer rechtlichen Pflichten verarbeitet. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Ihre Rechte</h2>
              <p className="text-muted-foreground">
                Sie haben folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:<br />
                • Recht auf Auskunft<br />
                • Recht auf Berichtigung oder Löschung<br />
                • Recht auf Einschränkung der Verarbeitung<br />
                • Recht auf Widerspruch gegen die Verarbeitung<br />
                • Recht auf Datenübertragbarkeit<br />
                • Recht auf Beschwerde bei einer Aufsichtsbehörde
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Datensicherheit</h2>
              <p className="text-muted-foreground">
                Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Speicherdauer</h2>
              <p className="text-muted-foreground">
                Personenbezogene Daten werden nur so lange gespeichert, wie es für die Erfüllung der jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen. Buchungsdaten werden gemäß den handels- und steuerrechtlichen Vorschriften für 10 Jahre aufbewahrt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Kontakt</h2>
              <p className="text-muted-foreground">
                Bei Fragen zum Datenschutz wenden Sie sich bitte an unseren Datenschutzbeauftragten:<br />
                E-Mail: datenschutz@metropol-tours.de
              </p>
            </section>

            <p className="text-sm text-muted-foreground mt-8">
              Stand: Dezember 2024
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
