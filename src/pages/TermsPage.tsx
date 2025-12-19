import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Allgemeine Geschäftsbedingungen</h1>
          
          <div className="bg-card rounded-xl shadow-card p-6 lg:p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 1 Geltungsbereich</h2>
              <p className="text-muted-foreground">
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Beförderungsverträge zwischen der METROPOL TOURS GmbH (nachfolgend "Unternehmer") und dem Fahrgast (nachfolgend "Kunde").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 2 Vertragsschluss</h2>
              <p className="text-muted-foreground">
                (1) Der Beförderungsvertrag kommt durch Buchung und Bezahlung der Fahrkarte zustande.<br /><br />
                (2) Die Buchung kann online, telefonisch oder bei unseren Partnern erfolgen.<br /><br />
                (3) Nach erfolgreicher Buchung erhält der Kunde eine Buchungsbestätigung per E-Mail.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 3 Preise und Zahlung</h2>
              <p className="text-muted-foreground">
                (1) Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.<br /><br />
                (2) Die Preise können je nach Auslastung variieren (dynamische Preisgestaltung).<br /><br />
                (3) Die Zahlung erfolgt bei der Buchung. Akzeptierte Zahlungsmittel sind Kreditkarte, PayPal und Sofortüberweisung.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 4 Stornierung und Umbuchung</h2>
              <p className="text-muted-foreground">
                (1) Stornierungen sind bis 24 Stunden vor Abfahrt kostenlos möglich.<br /><br />
                (2) Bei Stornierung weniger als 24 Stunden vor Abfahrt wird eine Gebühr von 50% des Fahrpreises erhoben.<br /><br />
                (3) Umbuchungen sind bis 12 Stunden vor Abfahrt gegen eine Gebühr von 5 EUR möglich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 5 Gepäck</h2>
              <p className="text-muted-foreground">
                (1) Jeder Fahrgast darf ein Handgepäck (max. 7 kg) und ein Reisegepäck (max. 20 kg) kostenfrei mitnehmen.<br /><br />
                (2) Zusätzliches Gepäck kann gegen Aufpreis mitgenommen werden.<br /><br />
                (3) Für Sondergepäck (Fahrräder, Ski etc.) ist eine vorherige Anmeldung erforderlich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 6 Fahrgastpflichten</h2>
              <p className="text-muted-foreground">
                (1) Der Fahrgast muss rechtzeitig am Abfahrtsort erscheinen.<br /><br />
                (2) Die Fahrkarte ist während der gesamten Fahrt mitzuführen und auf Verlangen vorzuzeigen.<br /><br />
                (3) Den Anweisungen des Fahrpersonals ist Folge zu leisten.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 7 Haftung</h2>
              <p className="text-muted-foreground">
                (1) Der Unternehmer haftet für Personenschäden nach den gesetzlichen Bestimmungen.<br /><br />
                (2) Für Gepäckschäden haftet der Unternehmer bis zu einem Höchstbetrag von 1.200 EUR pro Gepäckstück.<br /><br />
                (3) Die Haftung für Verspätungen ist auf den Fahrpreis begrenzt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">§ 8 Schlussbestimmungen</h2>
              <p className="text-muted-foreground">
                (1) Es gilt das Recht der Bundesrepublik Deutschland.<br /><br />
                (2) Gerichtsstand ist Hamburg.<br /><br />
                (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
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
