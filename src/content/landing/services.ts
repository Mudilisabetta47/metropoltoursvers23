import type { LandingContent } from "./types";

/**
 * Leistungsseiten (Anlass- und Produktseiten).
 * Jede Seite beantwortet einen eigenen Suchintent und hat eigene Texte.
 */

export const busMieten: LandingContent = {
  slug: "bus-mieten",
  seoTitle: "Bus mieten mit Fahrer – Reisebus, Midibus & Kleinbus",
  seoDescription:
    "Bus mieten inklusive Fahrer: 8 bis 59 Plätze, Festpreis mit Maut und Kilometern, Abfahrt ab Hannover, Bremen und ganz Norddeutschland. Angebot in wenigen Stunden.",
  h1: "Bus mieten – mit Fahrer, Festpreis und fester Ansprechperson",
  heroKicker: "Der zentrale Einstieg für alle Mietfahrten",
  heroText:
    "Ob Tagesausflug, Klassenfahrt oder Mehrtagesreise durch Europa: Wir stellen Fahrzeug, Fahrer und Zeitplan so zusammen, dass Ihre Gruppe ohne Umwege ankommt. Sie sagen uns Datum, Strecke und Personenzahl – den Rest übernehmen wir.",
  heroImage: "heroBus",
  heroAlt: "Reisebus von Metropol Tours auf der Autobahn",
  heroFacts: ["8–59 Plätze", "Festpreis inkl. Fahrer", "Antwort meist am selben Werktag"],
  why: [
    {
      title: "Ein Ansprechpartner statt Portal-Kette",
      text: "Ihre Anfrage geht direkt an unsere Disposition. Dieselbe Person plant Angebot, Fahrzeug und Fahrer – und ist auch am Reisetag erreichbar.",
    },
    {
      title: "Preis ohne Kleingedrucktes",
      text: "Maut, Kilometer, Fahrerkosten und gesetzliche Pausen stehen im Angebot. Was nachher auf der Rechnung steht, kennen Sie vorher.",
    },
    {
      title: "Fahrzeug passend zur Gruppe",
      text: "Ein 57-Sitzer für 22 Personen ist teuer und unpraktisch. Wir schlagen die Größe vor, die zu Gruppe, Gepäck und Zufahrt passt.",
    },
    {
      title: "Planung mit Puffer",
      text: "Wir kalkulieren realistische Fahrzeiten inklusive Stau, Pausen und Be- und Entladen – statt reiner Navi-Zeiten.",
    },
  ],
  sections: [
    {
      h2: "Was kostet es, einen Bus zu mieten?",
      body: [
        "Der Preis ergibt sich aus vier Größen: gefahrene Kilometer, Einsatzdauer des Fahrers, Fahrzeuggröße und Zeitraum. Eine Tagesfahrt im Umkreis von 200 Kilometern ist deutlich günstiger als eine Mehrtagesreise mit Übernachtung des Fahrers, weil dort Spesen, Hotel und ein möglicher zweiter Fahrer hinzukommen.",
        "Sinnvoll ist der Vergleich pro Person: Ab etwa 25 Mitfahrenden liegt der Buspreis pro Kopf meist deutlich unter Bahn oder Mietwagen – und das inklusive Tür-zu-Tür-Abholung und Gepäck.",
      ],
      blocks: [
        {
          h3: "Was den Preis nach oben treibt",
          text: "Wochenend- und Feiertagstermine, Nachtfahrten, Fahrten in Umweltzonen mit Sondergenehmigung, sehr lange Standzeiten am Zielort und kurzfristige Buchungen in der Hochsaison.",
        },
        {
          h3: "Was den Preis senkt",
          text: "Frühe Buchung, flexible Uhrzeiten, ein zentraler Sammelpunkt statt vieler Zustiege und Rückfahrten, die innerhalb der Lenkzeit des Fahrers liegen.",
        },
      ],
    },
    {
      h2: "So läuft eine Busmiete bei uns ab",
      body: [
        "Nach Ihrer Anfrage prüfen wir Verfügbarkeit und Route und melden uns mit einem Festpreisangebot zurück. Sie bestätigen schriftlich, erhalten die Auftragsbestätigung und spätestens 48 Stunden vor Abfahrt die Kontaktdaten des Fahrers.",
        "Änderungen an Uhrzeit, Zustieg oder Personenzahl sind bis kurz vor der Fahrt möglich, solange sie in den Zeitplan passen. Wir sagen offen, wenn ein Wunsch die Lenkzeiten sprengt – lieber vorher als unterwegs.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Für Transfers, Delegationen und kleine Gruppen mit viel Gepäck." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Wendig für Innenstädte, Schulhöfe und enge Zufahrten." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Klimaanlage, WC, WLAN und großer Kofferraum für Tages- und Mehrtagesfahrten." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Bordküche, verstellbare Sitze und Fahrerteam für lange Strecken." },
  ],
  occasions: [
    { title: "Vereine & Sport", text: "Auswärtsfahrten mit Platz für Ausrüstung, Trikots und Verpflegung." },
    { title: "Schulen", text: "Wandertage, Studienfahrten und Abschlussfahrten mit erfahrenen Fahrern." },
    { title: "Unternehmen", text: "Betriebsausflüge, Messe-Shuttles und Mitarbeitertransfers." },
    { title: "Private Feiern", text: "Hochzeiten, Geburtstage und Familienfeiern mit sicherer Rückfahrt." },
  ],
  process: [
    { title: "1. Eckdaten senden", text: "Datum, Start, Ziel, Personenzahl – mehr brauchen wir für ein erstes Angebot nicht." },
    { title: "2. Festpreis erhalten", text: "Inklusive Fahrer, Kilometern, Maut und Pausen, meist am selben Werktag." },
    { title: "3. Feinplanung", text: "Zustiege, Zwischenstopps, Gepäck und Sonderwünsche werden abgestimmt." },
    { title: "4. Losfahren", text: "Fahrerkontakt vorab, Disposition während der Fahrt erreichbar." },
  ],
  area: {
    intro: "Wir starten schwerpunktmäßig in Norddeutschland und fahren von dort deutschlandweit und europaweit:",
    cities: ["Hannover", "Bremen", "Hamburg", "Braunschweig", "Osnabrück", "Bielefeld", "Oldenburg", "Kassel", "Göttingen", "Wolfsburg"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Fahrzeuge von 8 bis 59 Plätzen",
    "Feste Ansprechperson in der Disposition",
    "Fahrerkontakt spätestens 48 Stunden vor Abfahrt",
    "Rechnung auf Firmen-, Vereins- oder Schuladresse",
    "Zahlung per Überweisung, Karte oder PayPal",
  ],
  faqs: [
    { q: "Ab wie vielen Personen lohnt sich ein Bus?", a: "Ab etwa 20 Personen ist ein Bus in der Regel günstiger als mehrere Mietwagen oder Bahntickets – und die Gruppe bleibt zusammen." },
    { q: "Ist der Fahrer im Preis enthalten?", a: "Ja. Wir vermieten ausschließlich mit eigenem Fahrer, inklusive Sozialabgaben, Spesen und gesetzlicher Pausen." },
    { q: "Wie kurzfristig kann ich buchen?", a: "Sofern ein Fahrzeug frei ist, auch innerhalb von 24 Stunden. In der Hochsaison empfehlen wir mehrere Wochen Vorlauf." },
    { q: "Was passiert bei einer Panne?", a: "Die Disposition organisiert Ersatz. Bei Fahrten in Deutschland steht in der Regel innerhalb weniger Stunden ein anderes Fahrzeug bereit." },
    { q: "Kann ich kostenlos stornieren?", a: "Bis zu einer im Angebot genannten Frist ja. Die genauen Stornostufen stehen in Ihrer Auftragsbestätigung." },
  ],
  links: [
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Was Fahrer leisten, wie Lenkzeiten funktionieren." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Mehrtägige Reisen mit Hotel und Programm." },
    { label: "Bus Charter", path: "/bus-charter", text: "Exklusive Charterfahrten für Unternehmen und Veranstalter." },
    { label: "Bus mieten Hannover", path: "/bus-mieten-hannover", text: "Konditionen und Zustiege in Hannover." },
    { label: "Bus mieten Bremen", path: "/bus-mieten-bremen", text: "Konditionen und Zustiege in Bremen." },
  ],
  ctaTitle: "Jetzt Bus anfragen",
  ctaText: "Nennen Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein Festpreisangebot ohne versteckte Kosten.",
};

export const reisebusMitFahrer: LandingContent = {
  slug: "reisebus-mit-fahrer",
  seoTitle: "Reisebus mit Fahrer mieten – erfahren, geprüft, pünktlich",
  seoDescription:
    "Reisebus mit Fahrer mieten: festangestellte Berufskraftfahrer, geregelte Lenk- und Ruhezeiten, Fahrerteam auf langen Strecken. Jetzt Festpreisangebot anfordern.",
  h1: "Reisebus mit Fahrer mieten",
  heroKicker: "Berufskraftfahrer mit Code 95 · Fahrerteam auf Langstrecke",
  heroText:
    "Ein Bus ist so gut wie sein Fahrer. Unsere Fahrerinnen und Fahrer sind festangestellt, regelmäßig weitergebildet und kennen die Strecken, die sie fahren – vom Schulhof bis zur Adria.",
  heroImage: "premiumBus",
  heroAlt: "Fahrer von Metropol Tours am Reisebus",
  heroFacts: ["Festangestellte Fahrer", "Code 95 & Fahrerkarte", "Doppelbesetzung auf Langstrecke"],
  why: [
    { title: "Keine Subunternehmer-Lotterie", text: "Sie wissen vorher, wer fährt. Wir setzen unsere eigenen Fahrer ein und greifen nur mit Ihrer Zustimmung auf geprüfte Partner zurück." },
    { title: "Lenkzeiten sauber geplant", text: "Digitale Tachographen und Dispositionssoftware sorgen dafür, dass Pausen eingeplant und nicht improvisiert werden." },
    { title: "Mehrsprachig unterwegs", text: "Für Fahrten nach Süd- und Osteuropa setzen wir Fahrer ein, die vor Ort sprachlich weiterkommen." },
    { title: "Ruhig und serviceorientiert", text: "Beladen, Zählen, Umplanen bei Stau: Unsere Fahrer sind Teil des Reiseerlebnisses, nicht nur Chauffeure." },
  ],
  sections: [
    {
      h2: "Lenk- und Ruhezeiten – warum das Ihre Planung betrifft",
      body: [
        "Ein Fahrer darf pro Tag maximal neun Stunden lenken, zweimal pro Woche zehn. Nach viereinhalb Stunden ist eine Pause von 45 Minuten fällig. Die Gesamtarbeitszeit umfasst auch Warten, Beladen und Rangieren. Deshalb passt eine Tagesfahrt von Hannover nach München und zurück nicht in einen Tag mit nur einem Fahrer.",
        "Wir sagen Ihnen bei der Angebotserstellung, welche Variante zeitlich funktioniert: früherer Start, Übernachtung des Fahrers oder Doppelbesetzung. So gibt es keine bösen Überraschungen am Reisetag.",
      ],
      blocks: [
        { h3: "Doppelbesetzung", text: "Zwei Fahrer wechseln sich ab. Damit sind Nachtfahrten und Strecken über 700 Kilometer ohne Zwischenübernachtung möglich." },
        { h3: "Fahrerübernachtung", text: "Bei Mehrtagesreisen kalkulieren wir Einzelzimmer und Spesen mit ein – häufig günstiger als ein zweiter Fahrer." },
      ],
    },
    {
      h2: "Was unsere Fahrer mitbringen",
      body: [
        "Alle Fahrer besitzen die Fahrerlaubnis der Klasse D, die Grundqualifikation nach Berufskraftfahrer-Qualifikationsgesetz (Code 95) und eine gültige Fahrerkarte. Weiterbildungen zu Fahrsicherheit, Erster Hilfe und Umgang mit Fahrgästen laufen im festen Turnus.",
        "Für Klassenfahrten achten wir zusätzlich auf Erfahrung mit Jugendgruppen, für Seniorenreisen auf Geduld beim Ein- und Aussteigen sowie Unterstützung mit Gehhilfen und Gepäck.",
      ],
    },
  ],
  fleet: [
    { name: "Reisebus", seats: "48–57 Sitze", text: "Standard für Tages- und Mehrtagesfahrten mit einem Fahrer." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Für Langstrecken, meist im Fahrerteam." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Kleinere Gruppen, gleicher Fahrerstandard." },
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Transfers mit Fahrer, ohne Bus-Fahrschein-Aufwand für Ihre Gäste." },
  ],
  occasions: [
    { title: "Mehrtagesreisen", text: "Fahrer bleibt vor Ort und steht für Ausflüge zur Verfügung." },
    { title: "Nachtfahrten", text: "Mit Doppelbesetzung planbar und rechtssicher." },
    { title: "Seniorengruppen", text: "Mehr Zeit für Zustiege, Hilfe beim Gepäck." },
    { title: "Firmenshuttles", text: "Wiederkehrende Fahrten mit demselben Fahrer." },
  ],
  process: [
    { title: "1. Strecke prüfen", text: "Wir rechnen Ihre Wunschroute gegen Lenk- und Ruhezeiten." },
    { title: "2. Variante wählen", text: "Ein Fahrer, Fahrerübernachtung oder Doppelbesetzung – mit Preisvergleich." },
    { title: "3. Fahrer einteilen", text: "Feste Zuordnung, Sie erhalten Name und Nummer vor Abfahrt." },
    { title: "4. Betreuung unterwegs", text: "Disposition erreichbar, bei Verspätungen informieren wir aktiv." },
  ],
  area: {
    intro: "Fahrer und Fahrzeuge stellen wir ab Norddeutschland – gefahren wird in ganz Europa:",
    cities: ["Deutschland", "Niederlande", "Belgien", "Frankreich", "Österreich", "Schweiz", "Italien", "Tschechien", "Polen", "Kroatien"],
  },
  advantages: [
    "Festangestellte Berufskraftfahrer mit Code 95",
    "Digitale Lenkzeitkontrolle",
    "Doppelbesetzung auf Wunsch",
    "Mehrsprachige Fahrer für Auslandsfahrten",
    "Fahrerkontakt vor Abfahrt",
    "Erfahrung mit Schul-, Senioren- und Firmengruppen",
  ],
  faqs: [
    { q: "Kann der Fahrer während der Reise für Ausflüge eingesetzt werden?", a: "Ja, sofern die Ausflüge in die tägliche Lenk- und Arbeitszeit passen. Wir planen das im Reiseprogramm mit ein." },
    { q: "Muss ich Hotel und Verpflegung für den Fahrer zahlen?", a: "Bei Mehrtagesreisen sind Einzelzimmer und Spesen üblich. Wir weisen die Kosten transparent im Angebot aus, damit sie kalkulierbar bleiben." },
    { q: "Wie lange darf ein Fahrer am Stück fahren?", a: "Maximal viereinhalb Stunden, danach folgt eine Pause von 45 Minuten. Pro Tag sind in der Regel neun Lenkstunden erlaubt." },
    { q: "Sprechen die Fahrer Englisch?", a: "Ein Großteil unserer Fahrer spricht Englisch, viele zusätzlich Türkisch oder südosteuropäische Sprachen. Sagen Sie uns Ihren Bedarf bei der Anfrage." },
    { q: "Bekommen wir denselben Fahrer bei wiederkehrenden Fahrten?", a: "Bei regelmäßigen Shuttles planen wir feste Fahrer ein, soweit Dienstpläne und Urlaubszeiten es zulassen." },
  ],
  links: [
    { label: "Bus mieten", path: "/bus-mieten", text: "Fahrzeuge, Preise und Ablauf im Überblick." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Mehrtägige Reisen mit Fahrer und Programm." },
    { label: "Bus Charter", path: "/bus-charter", text: "Exklusive Charter für Veranstalter." },
    { label: "Schulfahrten", path: "/schulfahrten", text: "Fahrer mit Erfahrung für Klassenfahrten." },
    { label: "Flughafentransfer", path: "/flughafentransfer", text: "Pünktliche Transfers mit Flugüberwachung." },
  ],
  ctaTitle: "Reisebus mit Fahrer anfragen",
  ctaText: "Sagen Sie uns Ihre Route – wir prüfen Lenkzeiten und schlagen die passende Fahrervariante vor.",
};

export const schulfahrten: LandingContent = {
  slug: "schulfahrten",
  seoTitle: "Schulfahrten & Klassenfahrten mit dem Bus planen",
  seoDescription:
    "Schulfahrten mit dem Reisebus: Wandertag, Studienfahrt oder Abschlussfahrt – Festpreis pro Fahrt, Rechnung an die Schule, Fahrer mit Erfahrung mit Jugendgruppen.",
  h1: "Schulfahrten mit dem Reisebus",
  heroKicker: "Wandertag · Studienfahrt · Abschlussfahrt",
  heroText:
    "Klassenfahrten haben eigene Regeln: enge Budgets, Elternabende, Aufsichtspflicht und ein Zeitplan, der zur Schulglocke passt. Wir planen Schulfahrten so, dass Lehrkräfte sich um die Klasse kümmern können statt um Logistik.",
  heroImage: "group",
  heroAlt: "Schulklasse steigt in einen Reisebus ein",
  heroFacts: ["Rechnung an die Schule", "Festpreis pro Fahrt", "Gepäckraum für Klassensätze"],
  why: [
    { title: "Kalkulation für Elternabende", text: "Sie erhalten den Gesamtpreis und den Preis pro Schülerin und Schüler – belastbar genug, um ihn im Elternabend zu präsentieren." },
    { title: "Abholung am Schulhof", text: "Wir prüfen vorab, ob die Zufahrt für einen 13,5-Meter-Bus geeignet ist, und schlagen sonst einen sicheren Treffpunkt in Laufnähe vor." },
    { title: "Fahrer mit Nerven", text: "Unsere Fahrer sind Jugendgruppen gewohnt: Pausen, Sitzordnung, Gepäckchaos und die zwanzigste Nachzählung gehören dazu." },
    { title: "Kostenlose Umplanung", text: "Krankheitswellen, verschobene Prüfungen, Wetter: Termine lassen sich innerhalb der Frist ohne Gebühr verschieben." },
  ],
  sections: [
    {
      h2: "Wandertag, Studienfahrt oder Abschlussfahrt?",
      body: [
        "Beim Wandertag zählt Flexibilität: kurze Strecke, oft mehrere Stopps und eine Rückfahrt, die zur letzten Stunde passt. Hier ist der Midibus häufig die bessere Wahl, weil er auch enge Zufahrten zu Museen, Kletterparks oder Waldparkplätzen erreicht.",
        "Studien- und Abschlussfahrten laufen anders: Hier sind Gepäckraum, Bordtoilette und Beinfreiheit entscheidend, weil die Klasse mehrere Stunden im Bus verbringt. Für Ziele wie Prag, Amsterdam, München oder die Ostsee planen wir Zwischenstopps so, dass sie zu den Pausen des Fahrers passen.",
      ],
      blocks: [
        { h3: "Bus vor Ort behalten", text: "Bei mehrtägigen Fahrten bleibt der Bus auf Wunsch vor Ort und steht für Tagesausflüge zur Verfügung – das ist meist günstiger als lokale Transfers." },
        { h3: "Begleitpersonen", text: "Sitzplätze für Lehrkräfte und Begleitpersonen planen wir mit ein, in der Regel vorne und mit Blick in den Innenraum." },
      ],
    },
    {
      h2: "Sicherheit und Nachweise für die Schulleitung",
      body: [
        "Auf Wunsch stellen wir Nachweise bereit, die viele Schulträger verlangen: Kopie der Genehmigung nach Personenbeförderungsgesetz, Versicherungsnachweis und Angaben zu Fahrzeugalter und letzter Hauptuntersuchung.",
        "Alle eingesetzten Busse verfügen über Dreipunktgurte, ABS, ESP und Abstandsassistenten. Vor Abfahrt weist der Fahrer die Klasse kurz in Notausstiege und Verhaltensregeln ein.",
      ],
    },
  ],
  fleet: [
    { name: "Midibus", seats: "20–35 Sitze", text: "Für einzelne Klassen und enge Zufahrten am Ausflugsziel." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Zwei Klassen oder eine Jahrgangsstufe inklusive Gepäck." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Für Studienfahrten ins europäische Ausland." },
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Kurse, AGs und Wettbewerbsteams." },
  ],
  occasions: [
    { title: "Wandertag", text: "Halbtags- und Tagesfahrten in die Region, mit Wartezeit vor Ort." },
    { title: "Studienfahrt", text: "Mehrtägige Fahrten mit Programm, Bus bleibt vor Ort." },
    { title: "Abschlussfahrt", text: "Längere Strecken, viel Gepäck, klare Regeln an Bord." },
    { title: "Schulsport & Wettbewerbe", text: "Turniere, Jugend forscht, Musikwettbewerbe inklusive Material." },
  ],
  process: [
    { title: "1. Rahmen abstecken", text: "Termin, Klassenstärke, Ziel und Budgetrahmen genügen für ein Angebot." },
    { title: "2. Angebot für den Elternabend", text: "Mit Gesamtpreis, Preis pro Kopf und Stornofristen." },
    { title: "3. Bestätigung durch die Schule", text: "Rechnung geht an die Schule oder den Förderverein, Zahlung per Überweisung." },
    { title: "4. Fahrt", text: "Fahrerkontakt vorab, Abholung am vereinbarten Treffpunkt." },
  ],
  area: {
    intro: "Wir fahren Schulen aus Niedersachsen, Bremen und Hamburg – Ziele in ganz Europa:",
    cities: ["Hannover", "Bremen", "Hamburg", "Hildesheim", "Celle", "Braunschweig", "Oldenburg", "Osnabrück", "Wolfsburg", "Göttingen"],
  },
  advantages: [
    "Rechnung an Schule oder Förderverein",
    "Preis pro Schülerin und Schüler ausgewiesen",
    "Nachweise für die Schulleitung auf Anfrage",
    "Fahrer mit Erfahrung mit Jugendgruppen",
    "Bus bleibt bei Mehrtagesfahrten vor Ort",
    "Kostenlose Verschiebung innerhalb der Frist",
  ],
  faqs: [
    { q: "Können wir auf Rechnung zahlen?", a: "Ja. Wir stellen die Rechnung an Schule, Förderverein oder Elternvertretung – Zahlung per Überweisung nach der Fahrt oder nach Vereinbarung." },
    { q: "Wie viele Begleitpersonen fahren kostenlos mit?", a: "Begleitpersonen zählen als reguläre Sitzplätze; der Preis richtet sich nach der Fahrt, nicht nach Köpfen. Zusätzliche Kosten entstehen dadurch nicht." },
    { q: "Bleibt der Bus während des Ausflugs vor Ort?", a: "Bei Tagesfahrten in der Regel ja, sofern eine zulässige Abstellmöglichkeit vorhanden ist. Standzeiten sind im Festpreis enthalten." },
    { q: "Was ist mit Gepäck und Musikinstrumenten?", a: "Der Kofferraum eines Reisebusses fasst rund 10 Kubikmeter. Sperrige Instrumente oder Sportgeräte melden Sie bitte bei der Anfrage an." },
    { q: "Was passiert, wenn die Fahrt ausfällt?", a: "Bis zur im Angebot genannten Frist können Sie kostenlos stornieren oder verschieben. Danach greifen gestaffelte Stornosätze." },
  ],
  links: [
    { label: "Ausflugsfahrten", path: "/ausflugsfahrten", text: "Tagesziele und Ausflugsideen in der Region." },
    { label: "Vereinsfahrten", path: "/vereinsfahrten", text: "Fahrten für Sport-, Musik- und Karnevalsvereine." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Fahrzeugübersicht und Preisfaktoren." },
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Wie Lenkzeiten Ihre Tagesplanung beeinflussen." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Mehrtägige Fahrten inklusive Hotel." },
  ],
  ctaTitle: "Schulfahrt anfragen",
  ctaText: "Nennen Sie Termin, Klassenstärke und Ziel – Sie erhalten ein Angebot, das Sie direkt im Elternabend vorstellen können.",
};

export const vereinsfahrten: LandingContent = {
  slug: "vereinsfahrten",
  seoTitle: "Vereinsfahrten mit dem Bus – Sport, Musik & Karneval",
  seoDescription:
    "Vereinsfahrten mit dem Reisebus: Auswärtsspiele, Turniere, Musikauftritte und Vereinsausflüge. Platz für Ausrüstung, Festpreis, Rechnung an den Verein.",
  h1: "Vereinsfahrten mit dem Reisebus",
  heroKicker: "Auswärtsspiel · Turnier · Vereinsausflug",
  heroText:
    "Vereine reisen selten leicht: Trikotsätze, Instrumente, Kostüme, Getränkekisten. Wir planen Vereinsfahrten so, dass Ausrüstung, Zeitplan und Kasse zusammenpassen.",
  heroImage: "busReal",
  heroAlt: "Vereinsgruppe vor einem Reisebus",
  heroFacts: ["Großer Gepäckraum", "Vereinskonditionen", "Späte Rückfahrten möglich"],
  why: [
    { title: "Platz für Ausrüstung", text: "Bis zu 10 Kubikmeter Kofferraum, auf Wunsch Anhänger für Boote, Bühnentechnik oder Sportgeräte." },
    { title: "Preise, die die Kasse verträgt", text: "Für wiederkehrende Fahrten vereinbaren wir Saisonkonditionen statt Einzelpreise." },
    { title: "Auch spät noch zurück", text: "Nach dem Spiel oder Auftritt geht es zurück – auch wenn es später wird als geplant. Wir kalkulieren Puffer ein." },
    { title: "Feste Ansprechperson", text: "Ein Kontakt für die ganze Saison, der Ihre Strecken und Gewohnheiten kennt." },
  ],
  sections: [
    {
      h2: "Sportvereine: Auswärtsfahrten ohne Fahrgemeinschaften",
      body: [
        "Fahrgemeinschaften mit Privat-Pkw sind organisatorisch aufwendig und versicherungsrechtlich heikel. Ein Bus bringt Mannschaft, Betreuer und Ausrüstung gemeinsam ans Ziel – und alle kommen zur gleichen Zeit an, was für Aufwärmzeiten und Anpfiff entscheidend ist.",
        "Für Ligafahrten legen wir Standardrouten an: gleicher Treffpunkt, gleiche Abfahrtszeit, gleicher Fahrer. Das spart bei jeder Buchung Abstimmung.",
      ],
      blocks: [
        { h3: "Fanfahrten", text: "Für größere Fangruppen planen wir mehrere Busse im Konvoi, inklusive Absprache mit Ordnungsdienst und Stadionzufahrt." },
        { h3: "Turniere", text: "Bei Turnieren über mehrere Tage bleibt der Bus vor Ort und pendelt zwischen Unterkunft und Sportanlage." },
      ],
    },
    {
      h2: "Musik-, Karnevals- und Traditionsvereine",
      body: [
        "Orchester, Chöre und Spielmannszüge brauchen Instrumententransport mit Sorgfalt. Wir sichern empfindliches Material im Kofferraum ab und planen Ladezeiten realistisch – Instrumente lassen sich nicht in fünf Minuten verstauen.",
        "Für Karnevals- und Schützenvereine sind vor allem Rückfahrten das Thema. Wir stimmen Alkohol- und Verpflegungsregeln an Bord vorher ab, damit unterwegs niemand diskutieren muss.",
      ],
    },
  ],
  fleet: [
    { name: "Midibus", seats: "20–35 Sitze", text: "Eine Mannschaft plus Betreuerteam." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Verein, Fans und Ausrüstung in einem Fahrzeug." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Trainingslager und Turniere im Ausland." },
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Jugendteams, Vorstände und Delegationen." },
  ],
  occasions: [
    { title: "Auswärtsspiele", text: "Feste Termine über die Saison mit gleichbleibendem Ablauf." },
    { title: "Trainingslager", text: "Mehrtägige Fahrten mit Bus vor Ort." },
    { title: "Auftritte & Umzüge", text: "Instrumente, Kostüme und Bühnentechnik sicher transportiert." },
    { title: "Vereinsausflug", text: "Jahresausflug für Mitglieder und Familien." },
  ],
  process: [
    { title: "1. Saison durchsprechen", text: "Wir sammeln Ihre Termine und legen Standardrouten an." },
    { title: "2. Konditionen vereinbaren", text: "Preise für Einzelfahrten oder Paket über die Saison." },
    { title: "3. Abrufen statt neu verhandeln", text: "Fahrt per E-Mail abrufen, Bestätigung meist am selben Tag." },
    { title: "4. Fahren", text: "Fester Fahrer, bekannter Treffpunkt, Puffer für Verlängerung." },
  ],
  area: {
    intro: "Vereine aus Norddeutschland fahren mit uns regional und europaweit:",
    cities: ["Hannover", "Bremen", "Hamburg", "Hildesheim", "Braunschweig", "Osnabrück", "Bielefeld", "Wolfsburg", "Oldenburg", "Kassel"],
  },
  advantages: [
    "Vereinskonditionen für wiederkehrende Fahrten",
    "Anhänger für Sportgeräte und Technik möglich",
    "Rechnung an den Verein",
    "Späte Rückfahrten eingeplant",
    "Feste Fahrer über die Saison",
    "Absprachen zu Verpflegung an Bord",
  ],
  faqs: [
    { q: "Dürfen wir Getränke im Bus mitnehmen?", a: "Ja, in Absprache. Bei Fahrten mit Alkohol vereinbaren wir vorher Regeln und ggf. eine Reinigungspauschale, damit es hinterher keine Diskussion gibt." },
    { q: "Können wir einen Anhänger für Ausrüstung buchen?", a: "Für Sportgeräte, Bühnentechnik oder Boote ist ein Anhänger möglich. Bitte Maße und Gewicht bei der Anfrage angeben." },
    { q: "Gibt es Rabatte für die ganze Saison?", a: "Ja. Für feste Termine über eine Saison kalkulieren wir ein Paket, das günstiger ist als Einzelbuchungen." },
    { q: "Was, wenn das Spiel in die Verlängerung geht?", a: "Wir planen bei Sportfahrten Puffer ein. Deutliche Überschreitungen rechnen wir nach den im Angebot genannten Stundensätzen ab." },
    { q: "Fahren Sie auch zu Auswärtsspielen im Ausland?", a: "Ja, europaweit. Bei längeren Strecken planen wir Doppelbesetzung oder eine Fahrerübernachtung ein." },
  ],
  links: [
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Mehrtägige Vereinsreisen mit Hotel." },
    { label: "Ausflugsfahrten", path: "/ausflugsfahrten", text: "Ideen für den Jahresausflug." },
    { label: "Bus Charter", path: "/bus-charter", text: "Exklusive Charterfahrten und Konvois." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Fahrzeuggrößen und Preisfaktoren." },
    { label: "Schulfahrten", path: "/schulfahrten", text: "Fahrten für Schulen und Jugendgruppen." },
  ],
  ctaTitle: "Vereinsfahrt anfragen",
  ctaText: "Senden Sie uns Ihre Termine – wir erstellen ein Angebot für einzelne Fahrten oder die gesamte Saison.",
};

export const ausflugsfahrten: LandingContent = {
  slug: "ausflugsfahrten",
  seoTitle: "Ausflugsfahrten mit dem Bus – Tagesfahrten für Gruppen",
  seoDescription:
    "Ausflugsfahrten mit dem Reisebus: Tagesfahrten in den Harz, an die Nordsee, nach Hamburg oder Berlin. Abholung vor Ort, Wartezeit inklusive, Festpreis.",
  h1: "Ausflugsfahrten für Gruppen",
  heroKicker: "Tagesfahrten mit Abholung vor der Tür",
  heroText:
    "Ein guter Ausflug beginnt nicht am Bahnhof, sondern vor Ihrer Haustür. Wir holen Ihre Gruppe ab, warten am Ziel und bringen alle zusammen zurück – ohne Umsteigen, ohne Fahrplansuche.",
  heroImage: "journey",
  heroAlt: "Reisebus an einem Ausflugsziel",
  heroFacts: ["Abholung am Wunschort", "Standzeit inklusive", "Rückfahrt nach Ihrem Zeitplan"],
  why: [
    { title: "Kein Fahrplan-Tetris", text: "Ihr Zeitplan bestimmt die Abfahrt, nicht der Takt der Bahn. Das ist besonders bei Seniorengruppen und Familien mit Kindern ein Unterschied." },
    { title: "Standzeit ist eingerechnet", text: "Der Bus bleibt am Ziel. Wartezeiten sind Teil des Festpreises, nicht ein Extra auf der Rechnung." },
    { title: "Mehrere Zustiege möglich", text: "Wir sammeln unterwegs ein: Ortsteile, Nachbardörfer oder ein zweiter Treffpunkt am Bahnhof." },
    { title: "Zielvorschläge inklusive", text: "Sagen Sie uns Budget und Interesse – wir schlagen Ziele vor, die zur Fahrzeit passen." },
  ],
  sections: [
    {
      h2: "Beliebte Ausflugsziele ab Norddeutschland",
      body: [
        "Im Radius von zwei bis drei Fahrstunden liegen sehr unterschiedliche Ziele: der Harz mit Brocken und Bergbaumuseen, die Nordseeküste um Cuxhaven und Wilhelmshaven, das Weserbergland, Hamburg mit Hafenrundfahrt und Speicherstadt, das Steinhuder Meer oder die Lüneburger Heide zur Blütezeit.",
        "Für Tagesfahrten empfehlen wir maximal 250 Kilometer je Richtung. Darüber bleibt am Ziel zu wenig Zeit, und die Rückfahrt wird für ältere Gäste anstrengend.",
      ],
      blocks: [
        { h3: "Kultur & Städte", text: "Hamburg, Bremen, Berlin, Celle, Goslar, Lübeck, Hildesheim – Städtetouren mit fest vereinbarter Abholzeit am Abend." },
        { h3: "Natur & Freizeit", text: "Harz, Heide, Nordsee, Steinhuder Meer, Serengeti-Park, Weihnachtsmärkte im Advent." },
      ],
    },
    {
      h2: "Für wen wir Ausflugsfahrten planen",
      body: [
        "Seniorengruppen und Kirchengemeinden schätzen die Abholung direkt am Gemeindehaus und die ruhige Fahrweise. Für Betriebsausflüge kombinieren wir Zielprogramm und Rückfahrt so, dass niemand auf ein Taxi angewiesen ist.",
        "Auch Nachbarschaften, Kegelclubs und Familienverbände fahren mit uns – oft mit Kaffeepause auf halber Strecke, die wir bei der Routenplanung berücksichtigen.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Kleine Runden und Familienausflüge." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Ideal für Gemeinde- und Seniorengruppen." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Große Gruppen mit WC und Klimaanlage." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Wenn es doch einmal weiter weg gehen soll." },
  ],
  occasions: [
    { title: "Seniorenausflug", text: "Kurze Wege, Hilfe beim Einsteigen, Pausen nach Bedarf." },
    { title: "Betriebsausflug", text: "Abholung am Betrieb, Rückfahrt am späten Abend." },
    { title: "Weihnachtsmarkt", text: "Adventsfahrten nach Goslar, Bremen, Hamburg oder Celle." },
    { title: "Familienfeier", text: "Gemeinsame An- und Abreise zum Fest." },
  ],
  process: [
    { title: "1. Ziel und Zeitfenster", text: "Sie nennen Wunschziel, Datum und ungefähre Uhrzeiten." },
    { title: "2. Routen- und Zeitvorschlag", text: "Wir prüfen Fahrzeit, Pausen und Parkmöglichkeiten am Ziel." },
    { title: "3. Festpreis", text: "Inklusive Standzeit, Maut und Fahrer." },
    { title: "4. Ausflugstag", text: "Abholung am vereinbarten Ort, Rückfahrt nach Absprache." },
  ],
  area: {
    intro: "Startpunkte in Norddeutschland, Ziele im Umkreis von bis zu 300 Kilometern:",
    cities: ["Harz", "Nordsee", "Hamburg", "Bremen", "Berlin", "Lüneburger Heide", "Weserbergland", "Steinhuder Meer", "Celle", "Goslar"],
  },
  advantages: [
    "Abholung direkt am Treffpunkt",
    "Standzeit am Ziel inklusive",
    "Mehrere Zustiege möglich",
    "Ruhige Fahrweise, Pausen nach Bedarf",
    "Zielvorschläge passend zum Budget",
    "Festpreis ohne Nachberechnung",
  ],
  faqs: [
    { q: "Wie weit lohnt sich eine Tagesfahrt?", a: "Bis rund 250 Kilometer pro Richtung. Darüber bleibt am Ziel zu wenig Zeit und die Rückfahrt wird anstrengend." },
    { q: "Können wir unterwegs eine Kaffeepause einlegen?", a: "Ja. Pausen planen wir mit ein – sie decken sich in der Regel mit den gesetzlichen Pausen des Fahrers." },
    { q: "Ist der Bus während des Aufenthalts vor Ort?", a: "In der Regel ja. Sollte am Ziel keine Abstellfläche verfügbar sein, sagen wir das vorher und planen eine alternative Lösung." },
    { q: "Können Rollatoren mitgenommen werden?", a: "Ja, Rollatoren und Gehhilfen verstauen wir im Kofferraum. Bitte bei der Anfrage angeben, damit der Fahrer Zeit einplant." },
    { q: "Planen Sie auch das Programm am Ziel?", a: "Wir vermitteln gern Kontakte zu Museen, Restaurants und Stadtführungen; die Buchung des Programms übernehmen Sie oder wir auf Wunsch gemeinsam." },
  ],
  links: [
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Wenn aus dem Ausflug eine Reise wird." },
    { label: "Vereinsfahrten", path: "/vereinsfahrten", text: "Ausflüge für Vereine und Gruppen." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Fahrzeuggrößen und Preise." },
    { label: "Schulfahrten", path: "/schulfahrten", text: "Wandertage und Klassenausflüge." },
    { label: "Wochenendtrips", path: "/wochenendtrips", text: "Feste Städtetrips mit Busanreise." },
  ],
  ctaTitle: "Ausflugsfahrt anfragen",
  ctaText: "Nennen Sie Ziel, Datum und Gruppengröße – wir schlagen Route, Zeitplan und Festpreis vor.",
};

export const flughafentransfer: LandingContent = {
  slug: "flughafentransfer",
  seoTitle: "Flughafentransfer für Gruppen – Bus zum Flughafen",
  seoDescription:
    "Flughafentransfer mit dem Bus: Gruppentransfers nach Hannover-Langenhagen, Hamburg, Bremen, Frankfurt und Amsterdam. Flugüberwachung, Gepäckraum, Festpreis.",
  h1: "Flughafentransfer für Gruppen",
  heroKicker: "Hannover · Hamburg · Bremen · Frankfurt · Amsterdam",
  heroText:
    "Beim Transfer zum Flughafen entscheidet die Pufferzeit. Wir planen Abholung und Route so, dass Ihre Gruppe mit Ruhe am Check-in steht – und bei der Rückkehr niemand nachts im Terminal wartet.",
  heroImage: "business",
  heroAlt: "Reisebus vor einem Flughafenterminal",
  heroFacts: ["Flugüberwachung", "Gepäck- und Sperrgepäckraum", "Nacht- und Frühfahrten"],
  why: [
    { title: "Wir beobachten den Flug", text: "Bei Abholungen prüfen wir die Landezeit. Verspätet sich der Flug, verschiebt sich die Abholung – ohne dass Sie anrufen müssen." },
    { title: "Pufferzeit statt Hektik", text: "Für Gruppen ab 30 Personen kalkulieren wir zusätzliche Zeit für Check-in und Sicherheitskontrolle." },
    { title: "Gepäck ohne Kompromisse", text: "Koffer, Sportgepäck, Kinderwagen oder Instrumente reisen im Kofferraum – kein Zählen von Freigepäckstücken im Bus." },
    { title: "Rund um die Uhr", text: "Frühflüge um 6 Uhr bedeuten Abholung mitten in der Nacht. Das ist bei uns Standard, kein Sonderfall." },
  ],
  sections: [
    {
      h2: "Transfers ab Norddeutschland",
      body: [
        "Von Hannover aus sind Langenhagen (HAJ), Hamburg (HAM) und Bremen (BRE) in unter zwei Stunden erreichbar. Für interkontinentale Flüge ab Frankfurt, München oder Amsterdam Schiphol fahren wir ebenfalls direkt – bei diesen Strecken planen wir großzügige Puffer für Stau auf der A2, A7 und A3 ein.",
        "Für Reisegruppen, die als Ganzes fliegen, ist der Bustransfer meist günstiger als Bahn plus Flughafenexpress und deutlich planbarer, weil alle gemeinsam ankommen.",
      ],
      blocks: [
        { h3: "Kreuzfahrt-Transfers", text: "Auch Transfers zu den Kreuzfahrtterminals in Hamburg, Kiel, Bremerhaven, Warnemünde oder Rotterdam gehören zu unserem Standardgeschäft." },
        { h3: "Firmenreisen", text: "Für Delegationen und Messeteams fahren wir Hotel–Flughafen–Messe im festen Takt." },
      ],
    },
    {
      h2: "Ablauf am Terminal",
      body: [
        "Der Fahrer meldet sich vor der Ankunft telefonisch bei Ihrer Ansprechperson und nennt den Haltepunkt. An Flughäfen mit begrenzter Haltezeit stimmen wir vorab ab, wo genau Ein- und Ausstieg erfolgen – am Terminal, am Busparkplatz oder am Fernbusbereich.",
        "Bei Rückholungen wartet der Fahrer erst nach Gepäckausgabe an der vereinbarten Stelle. So entstehen keine Standgebühren, während die Gruppe noch am Band steht.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Delegationen und kleine Reisegruppen mit Koffern." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Mittlere Gruppen, wendig an Terminalzufahrten." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Große Reisegruppen mit vollem Gepäckraum." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Für weite Transfers wie Frankfurt oder Amsterdam." },
  ],
  occasions: [
    { title: "Reisegruppen", text: "Pauschal- und Vereinsreisen mit gemeinsamem Abflug." },
    { title: "Firmen & Messe", text: "Delegationen, Teamreisen und Incentive-Gruppen." },
    { title: "Kreuzfahrten", text: "Transfers zu den Häfen an Nord- und Ostsee." },
    { title: "Hochzeiten & Events", text: "Gästetransfers vom Flughafen zur Location." },
  ],
  process: [
    { title: "1. Flugdaten senden", text: "Flugnummer, Zeiten, Personen- und Gepäckzahl." },
    { title: "2. Puffer festlegen", text: "Wir schlagen die Abholzeit inklusive Check-in-Puffer vor." },
    { title: "3. Bestätigung", text: "Festpreis inklusive Maut, Parkgebühren und Wartezeit." },
    { title: "4. Transfer", text: "Fahrer meldet sich, Flug wird überwacht, Abholpunkt wird bestätigt." },
  ],
  area: {
    intro: "Regelmäßig angefahrene Flughäfen und Terminals:",
    cities: ["Hannover HAJ", "Hamburg HAM", "Bremen BRE", "Frankfurt FRA", "Düsseldorf DUS", "Berlin BER", "Amsterdam AMS", "Hafen Hamburg", "Hafen Kiel", "Bremerhaven"],
  },
  advantages: [
    "Flugüberwachung bei Abholungen",
    "Nacht- und Frühfahrten ohne Aufschlag-Überraschung",
    "Wartezeit und Parkgebühren im Festpreis",
    "Großer Gepäck- und Sperrgepäckraum",
    "Telefonischer Kontakt zum Fahrer",
    "Auch Kreuzfahrt- und Hafentransfers",
  ],
  faqs: [
    { q: "Wie früh sollten wir am Flughafen sein?", a: "Für innerdeutsche und europäische Flüge planen wir bei Gruppen zwei Stunden vor Abflug ein, bei Langstrecke drei Stunden." },
    { q: "Was passiert bei Flugverspätung?", a: "Wir überwachen die Landezeit und verschieben die Abholung entsprechend. Die ersten 60 Minuten Wartezeit sind in der Regel im Preis enthalten." },
    { q: "Fahren Sie auch nachts?", a: "Ja. Frühflüge bedeuten häufig Abholung zwischen 2 und 4 Uhr – das ist bei uns eingeplant und kein Sonderfall." },
    { q: "Wie viel Gepäck kann mit?", a: "Pro Person ein Koffer und ein Handgepäckstück sind problemlos. Sportgepäck oder Sperrgepäck bitte vorher anmelden." },
    { q: "Können wir mehrere Abholpunkte haben?", a: "Ja, mehrere Zustiege sind möglich. Jeder zusätzliche Stopp kostet Zeit, die wir in der Abholplanung berücksichtigen." },
  ],
  links: [
    { label: "Shuttle-Service", path: "/shuttle-service", text: "Wiederkehrende Transfers im Pendelverkehr." },
    { label: "Bus Charter", path: "/bus-charter", text: "Exklusive Fahrzeuge für Veranstalter." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Komplette Reisen inklusive Anreise." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Fahrzeugauswahl und Preisfaktoren." },
    { label: "Busunternehmen Hannover", path: "/busunternehmen-hannover", text: "Unser Standort und die Region." },
  ],
  ctaTitle: "Flughafentransfer anfragen",
  ctaText: "Senden Sie uns Flugnummer, Zeiten und Personenzahl – wir planen Abholung inklusive Puffer.",
};

export const shuttleService: LandingContent = {
  slug: "shuttle-service",
  seoTitle: "Shuttle-Service mit Bus – Mitarbeiter, Messe & Events",
  seoDescription:
    "Shuttle-Service für Unternehmen und Events: Werksverkehr, Messe-Shuttles und Pendelverkehr im festen Takt. Planbare Kosten, feste Fahrer, GPS-Nachverfolgung.",
  h1: "Shuttle-Service für Unternehmen und Events",
  heroKicker: "Werksverkehr · Messe · Großveranstaltung",
  heroText:
    "Ein Shuttle ist kein einzelner Bus, sondern ein Fahrplan. Wir rechnen Taktzeiten, Fahrzeugzahl und Umläufe so, dass niemand länger als nötig wartet – und Sie nicht mehr Busse zahlen als nötig.",
  heroImage: "metropolHero",
  heroAlt: "Shuttle-Bus im Pendelverkehr",
  heroFacts: ["Taktplanung inklusive", "Feste Fahrer", "GPS-Verfolgung möglich"],
  why: [
    { title: "Wir rechnen Ihren Takt", text: "Aus Personenzahl, Strecke und gewünschter Wartezeit ergibt sich die Zahl der Fahrzeuge. Diese Rechnung machen wir vor dem Angebot, nicht danach." },
    { title: "Kosten pro Monat statt pro Fahrt", text: "Für Werksverkehr und Dauerstrecken vereinbaren wir Monats- oder Jahrespauschalen mit fester Abrechnung." },
    { title: "Live-Verfolgung", text: "Auf Wunsch stellen wir eine Live-Ansicht der Fahrzeuge bereit, damit Ihre Gäste oder Mitarbeitenden sehen, wann der nächste Bus kommt." },
    { title: "Vertretung eingeplant", text: "Krankheit oder Fahrzeugausfall darf einen Shuttle nicht stoppen. Wir halten Reserve in der Disposition." },
  ],
  sections: [
    {
      h2: "Mitarbeiter-Shuttle und Werksverkehr",
      body: [
        "Viele Betriebsstandorte liegen außerhalb des ÖPNV-Takts, besonders im Früh- und Spätdienst. Ein Werksverkehr bindet Mitarbeitende, senkt Parkdruck auf dem Gelände und ist bei entsprechender Ausgestaltung steuerlich attraktiv.",
        "Wir starten meist mit einer Testphase über vier bis acht Wochen, messen die tatsächliche Auslastung und passen Takt und Fahrzeuggröße danach an. So zahlen Sie nicht dauerhaft für leere Sitze.",
      ],
      blocks: [
        { h3: "Schichtmodelle", text: "Fahrten passend zu Schichtbeginn und -ende, inklusive Wochenend- und Feiertagsbetrieb." },
        { h3: "Zustiegspunkte", text: "Wir legen Haltepunkte an ÖPNV-Knoten und Wohnschwerpunkten fest, statt jeden Haushalt einzeln anzufahren." },
      ],
    },
    {
      h2: "Event- und Messe-Shuttles",
      body: [
        "Bei Messen und Firmenevents ist die Spitze das Problem: Alle wollen gleichzeitig hin und gleichzeitig zurück. Wir planen deshalb mit einer Grundfrequenz und zusätzlichen Verstärkerfahrten zu Beginn und Ende der Veranstaltung.",
        "Für Veranstaltungen in Hannover kennen wir die Zufahrten zum Messegelände, die Halteflächen an den Eingängen Nord und West sowie die Ausweichrouten, wenn der Messeschnellweg dicht ist.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Kurze Takte mit geringer Personenzahl." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Standard im Werks- und Hotelshuttle." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Hohe Kapazität bei Spitzenzeiten." },
    { name: "Kombination", seats: "flexibel", text: "Mehrere Fahrzeuge im Umlauf mit abgestimmtem Takt." },
  ],
  occasions: [
    { title: "Werksverkehr", text: "Tägliche Fahrten zu Schichtbeginn und -ende." },
    { title: "Messe-Shuttle", text: "Hotel, Parkplatz und Messegelände im Takt verbunden." },
    { title: "Hotel-Shuttle", text: "Feste Verbindungen für Hotelgäste und Tagungen." },
    { title: "Festivals & Konzerte", text: "Zubringer von Bahnhof und Parkflächen zum Gelände." },
  ],
  process: [
    { title: "1. Bedarf erfassen", text: "Personenzahl, Zeitfenster, Strecke und gewünschte maximale Wartezeit." },
    { title: "2. Taktplan erstellen", text: "Wir liefern Umlaufplan, Fahrzeugzahl und Kostenrahmen." },
    { title: "3. Testphase", text: "Bei Dauerbetrieb starten wir mit einer Probephase und werten die Auslastung aus." },
    { title: "4. Regelbetrieb", text: "Feste Fahrer, monatliche Abrechnung, Anpassungen nach Bedarf." },
  ],
  area: {
    intro: "Shuttle-Betrieb schwerpunktmäßig in Norddeutschland:",
    cities: ["Hannover", "Messe Laatzen", "Langenhagen", "Bremen", "Hamburg", "Braunschweig", "Wolfsburg", "Salzgitter", "Hildesheim", "Celle"],
  },
  advantages: [
    "Umlauf- und Taktplanung inklusive",
    "Monats- oder Jahrespauschale möglich",
    "Reservefahrzeuge in der Disposition",
    "Live-Verfolgung auf Wunsch",
    "Beschriftung und Branding der Fahrzeuge möglich",
    "Feste Fahrer für wiederkehrende Strecken",
  ],
  faqs: [
    { q: "Ab welcher Personenzahl lohnt sich ein Shuttle?", a: "Ein Midibus im Werksverkehr rechnet sich meist ab etwa 20 regelmäßigen Mitfahrenden je Umlauf. Wir prüfen das anhand Ihrer Schichtzeiten." },
    { q: "Können die Busse mit unserem Logo fahren?", a: "Ja, magnetische Schilder oder Folierung sind möglich. Bei Dauerverträgen übernehmen wir die Beschriftung." },
    { q: "Wie wird abgerechnet?", a: "Nach Umlauf, Tag oder Monat – je nach Vertragsmodell. Bei Dauerbetrieb ist eine Monatspauschale üblich." },
    { q: "Was passiert bei Fahrzeugausfall?", a: "Wir halten Reserve vor und tauschen kurzfristig. Bei Ausfall informiert die Disposition Ihre Ansprechperson direkt." },
    { q: "Können Fahrgäste sehen, wo der Bus ist?", a: "Auf Wunsch stellen wir eine Live-Ansicht der Fahrzeugposition bereit, die Sie intern verlinken können." },
  ],
  links: [
    { label: "Flughafentransfer", path: "/flughafentransfer", text: "Einzeltransfers mit Flugüberwachung." },
    { label: "Bus Charter", path: "/bus-charter", text: "Exklusive Fahrzeuge für Veranstalter." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Einzelfahrten statt Dauerbetrieb." },
    { label: "Business-Services", path: "/business", text: "Unser Angebot für Firmenkunden." },
    { label: "Busunternehmen Hannover", path: "/busunternehmen-hannover", text: "Standort und Einsatzgebiet." },
  ],
  ctaTitle: "Shuttle-Konzept anfragen",
  ctaText: "Schildern Sie uns Strecke, Zeitfenster und Personenzahl – Sie erhalten Taktplan und Kostenrahmen.",
};

export const busCharter: LandingContent = {
  slug: "bus-charter",
  seoTitle: "Bus Charter – exklusive Reisebusse für Veranstalter",
  seoDescription:
    "Bus Charter für Veranstalter, Agenturen und Unternehmen: exklusive Fahrzeuge, mehrtägige Einsätze, Konvois und Rahmenverträge. Kalkulierbare Charterpreise.",
  h1: "Bus Charter für Veranstalter und Unternehmen",
  heroKicker: "Exklusive Fahrzeuge · Rahmenverträge · Konvois",
  heroText:
    "Charter heißt: Fahrzeug und Fahrer stehen ausschließlich Ihnen zur Verfügung – tageweise, wochenweise oder für eine komplette Tournee. Wir arbeiten als verlässlicher Subunternehmer und Partner von Agenturen, Reiseveranstaltern und Unternehmen.",
  heroImage: "premiumBus",
  heroAlt: "Charter-Reisebus von Metropol Tours",
  heroFacts: ["Tages- und Wochencharter", "Konvoi ab 2 Fahrzeugen", "Rahmenverträge möglich"],
  why: [
    { title: "Kalkulierbar für Ihr Angebot", text: "Sie erhalten Tages-, Kilometer- und Wartesätze, mit denen Sie Ihre eigene Kalkulation sauber aufbauen können." },
    { title: "B2B-Erfahrung", text: "Wir fahren für Reiseveranstalter, Eventagenturen, Industrie und öffentliche Auftraggeber – inklusive Ausschreibungsunterlagen." },
    { title: "Konvoi-Kompetenz", text: "Mehrere Fahrzeuge, gemeinsame Ankunft, koordinierte Ein- und Ausstiege statt gestaffeltem Chaos." },
    { title: "Vertragssicherheit", text: "Nachweise zur Genehmigung nach PBefG, Versicherungsdeckung und Fahrzeugdaten liefern wir auf Anfrage." },
  ],
  sections: [
    {
      h2: "Charter-Modelle im Überblick",
      body: [
        "Beim Tagescharter steht das Fahrzeug für einen definierten Zeitraum bereit, meist inklusive einer festgelegten Kilometerzahl. Beim Wochen- oder Tourcharter begleitet der Bus Ihre Gruppe über mehrere Tage – typisch bei Rundreisen, Tourneen oder Baustellen- und Projektteams.",
        "Für wiederkehrende Aufträge legen wir Rahmenverträge mit festen Sätzen und definierten Reaktionszeiten an. Das reduziert bei jedem Einsatz den Abstimmungsaufwand auf ein kurzes Abrufmail.",
      ],
      blocks: [
        { h3: "Subunternehmer für Veranstalter", text: "Wir treten auf Wunsch neutral auf, ohne eigene Beschriftung und mit Ihren Reiseunterlagen an Bord." },
        { h3: "Internationale Einsätze", text: "Charterfahrten in Europa inklusive Maut, Vignetten, Umweltplaketten und Kabotage-Prüfung." },
      ],
    },
    {
      h2: "Was im Charterpreis steckt",
      body: [
        "Ein Charterpreis besteht aus Fahrzeugbereitstellung, Fahrerkosten inklusive Spesen, Kilometern, Maut und Nebenkosten wie Parkgebühren oder Fährtickets. Wir weisen diese Positionen getrennt aus, damit Sie erkennen, welche Kosten bei Programmänderungen variieren.",
        "Bei mehrtägigen Einsätzen kommen Unterkunft des Fahrers und ggf. ein zweiter Fahrer hinzu. Wir stellen beide Varianten gegenüber, damit Sie die wirtschaftlichere wählen können.",
      ],
    },
  ],
  fleet: [
    { name: "Reisebus", seats: "48–57 Sitze", text: "Standardfahrzeug für Charter im Tages- und Mehrtageseinsatz." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Bordküche, große Kofferräume, für Tourneen und Rundreisen." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Für kleinere Gruppen und enge Innenstädte." },
    { name: "Konvoi", seats: "2+ Fahrzeuge", text: "Koordinierte Mehrfachgestellung mit einer Ansprechperson." },
  ],
  occasions: [
    { title: "Reiseveranstalter", text: "Busgestellung für Rundreisen und Pauschalprogramme." },
    { title: "Agenturen & Events", text: "Gästelogistik für Kongresse, Roadshows und Produktpremieren." },
    { title: "Industrie", text: "Projektteams, Werksbesichtigungen und Baustellenverkehr." },
    { title: "Öffentliche Auftraggeber", text: "Ausschreibungen, Schülerbeförderung, Sonderverkehre." },
  ],
  process: [
    { title: "1. Anforderung senden", text: "Zeitraum, Route, Kapazität und gewünschte Ausstattung." },
    { title: "2. Charterangebot", text: "Getrennt ausgewiesene Positionen inklusive Nebenkosten." },
    { title: "3. Vertrag oder Abruf", text: "Einzelauftrag oder Rahmenvertrag mit festen Sätzen." },
    { title: "4. Durchführung", text: "Feste Ansprechperson während des gesamten Einsatzes." },
  ],
  area: {
    intro: "Charterfahrten ab Norddeutschland in ganz Europa:",
    cities: ["Deutschland", "Niederlande", "Belgien", "Frankreich", "Schweiz", "Österreich", "Italien", "Tschechien", "Polen", "Balkan"],
  },
  advantages: [
    "Getrennt ausgewiesene Preisbestandteile",
    "Rahmenverträge mit festen Sätzen",
    "Neutrales Auftreten auf Wunsch",
    "Nachweise für Ausschreibungen",
    "Konvoi-Koordination aus einer Hand",
    "Europaweite Einsätze inklusive Maut und Vignetten",
  ],
  faqs: [
    { q: "Was unterscheidet Charter von einer normalen Busmiete?", a: "Beim Charter steht das Fahrzeug exklusiv über einen längeren Zeitraum bereit – oft mehrere Tage – statt für eine einzelne Fahrt." },
    { q: "Fahren Sie auch als Subunternehmer?", a: "Ja. Für Veranstalter und Agenturen treten wir auf Wunsch neutral auf, ohne eigene Werbung am Fahrzeug." },
    { q: "Können wir einen Rahmenvertrag abschließen?", a: "Ja. Bei regelmäßigem Bedarf vereinbaren wir feste Tages- und Kilometersätze sowie Reaktionszeiten." },
    { q: "Welche Nachweise erhalten wir?", a: "Genehmigung nach Personenbeförderungsgesetz, Versicherungsnachweis, Fahrzeugdaten und auf Wunsch Angaben zu Emissionsklassen." },
    { q: "Sind mehrere Busse gleichzeitig möglich?", a: "Ja. Für Konvois koordinieren wir Fahrzeuge, Fahrer und Ankunftszeiten über eine zentrale Ansprechperson." },
  ],
  links: [
    { label: "Business-Services", path: "/business", text: "Unser komplettes B2B-Angebot." },
    { label: "Shuttle-Service", path: "/shuttle-service", text: "Pendelverkehr im festen Takt." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Reisen inklusive Hotel und Programm." },
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Fahrerthemen und Lenkzeiten." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Einzelfahrten und Fahrzeugübersicht." },
  ],
  ctaTitle: "Charter-Anfrage stellen",
  ctaText: "Nennen Sie Zeitraum, Route und Kapazität – Sie erhalten ein Charterangebot mit getrennt ausgewiesenen Positionen.",
};

export const gruppenreisen: LandingContent = {
  slug: "gruppenreisen",
  seoTitle: "Gruppenreisen mit dem Bus – Planung aus einer Hand",
  seoDescription:
    "Gruppenreisen mit dem Reisebus: mehrtägige Reisen für Vereine, Firmen und Freundeskreise inklusive Hotel, Programm und Fahrer. Individuell geplant, Festpreis pro Person.",
  h1: "Gruppenreisen mit dem Reisebus",
  heroKicker: "Ab 20 Personen · mehrtägig · individuell geplant",
  heroText:
    "Eine Gruppenreise ist mehr als ein Bus mit Ziel. Wir planen Anreise, Hotel, Programm und Rückfahrt so, dass die Gruppe zusammenbleibt und die Organisatorin oder der Organisator nicht selbst zum Reiseleiter wird.",
  heroImage: "group",
  heroAlt: "Reisegruppe vor einem Reisebus im Urlaub",
  heroFacts: ["Ab 20 Personen", "Hotel & Programm möglich", "Preis pro Person ausgewiesen"],
  why: [
    { title: "Ein Angebot statt fünf Buchungen", text: "Bus, Hotel, Eintritte und Führungen kommen aus einer Hand – mit einer Rechnung und einer Ansprechperson." },
    { title: "Preis pro Person", text: "Wir weisen den Preis pro Kopf aus, damit Sie ihn direkt an Ihre Gruppe weitergeben können, inklusive Einzelzimmerzuschlag." },
    { title: "Realistische Tagesplanung", text: "Statt sechs Programmpunkte an einem Tag planen wir drei, die wirklich funktionieren – inklusive Fahrzeit und Pausen." },
    { title: "Freiplätze möglich", text: "Ab bestimmten Gruppengrößen sind Freiplätze für Organisation oder Begleitung üblich. Wir sagen offen, ab wann." },
  ],
  sections: [
    {
      h2: "Wie eine Gruppenreise entsteht",
      body: [
        "Am Anfang stehen drei Fragen: Wohin, wie lange und mit welchem Budget pro Person? Aus diesen Angaben bauen wir einen ersten Reiseverlauf mit Anreiseweg, Hotelkategorie und zwei bis drei Programmvorschlägen. Sie geben Rückmeldung, wir passen an – meist genügen zwei Runden bis zum finalen Programm.",
        "Erst danach reservieren wir Hotelkontingente. Das hat einen Grund: Kontingente binden Kapital und Fristen. Wir stellen sie fest, wenn der Reiseverlauf steht und die Gruppe die Größenordnung bestätigt hat.",
      ],
      blocks: [
        { h3: "Beliebte Ziele", text: "Prag, Amsterdam, Wien, Budapest, Südtirol, Gardasee, Toskana, Paris, Kroatien und die deutsche Ostseeküste." },
        { h3: "Reisedauer", text: "Klassisch sind 3 bis 5 Tage. Für Ziele südlich der Alpen empfehlen wir mindestens 5 Tage, damit die Anreise sich lohnt." },
      ],
    },
    {
      h2: "Sicherheit, Versicherung und Zahlung",
      body: [
        "Bei Pauschalreisen greift die gesetzliche Insolvenzabsicherung; Sie erhalten den entsprechenden Sicherungsschein. Reiserücktritts- und Reiseabbruchversicherungen können wir für die Gruppe oder individuell vermitteln.",
        "Üblich ist eine Anzahlung nach Vertragsschluss und die Restzahlung vor Reiseantritt. Für Vereine und Schulen sind Sammelrechnungen und Teilzahlungen möglich, wenn die Beträge über Mitglieder eingesammelt werden.",
      ],
    },
  ],
  fleet: [
    { name: "Reisebus", seats: "48–57 Sitze", text: "Der Standard für mehrtägige Gruppenreisen." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Für Ziele jenseits der Alpen mit hohem Komfort." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Kleinere Gruppen, oft mit exklusiverem Programm." },
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Familienverbände und kleine Freundeskreise." },
  ],
  occasions: [
    { title: "Vereinsreise", text: "Jahresfahrt mit Programm für Mitglieder und Angehörige." },
    { title: "Firmenreise", text: "Incentives, Jubiläen und Teamreisen." },
    { title: "Kirchengemeinde", text: "Wallfahrten, Gemeindefahrten und Studienreisen." },
    { title: "Freundeskreis", text: "Städtereisen und Jubiläumsfahrten in privater Runde." },
  ],
  process: [
    { title: "1. Ziel und Budget", text: "Wir klären Wunschziel, Reisedauer und Preisrahmen pro Person." },
    { title: "2. Reiseverlauf", text: "Sie erhalten einen Vorschlag mit Hotel, Programm und Zeitplan." },
    { title: "3. Feinabstimmung", text: "Anpassungen an Programm, Hotelkategorie und Zustiegen." },
    { title: "4. Buchung & Reise", text: "Reiseunterlagen, Sicherungsschein und Betreuung während der Fahrt." },
  ],
  area: {
    intro: "Wir starten in Norddeutschland und fahren zu Zielen in ganz Europa:",
    cities: ["Prag", "Amsterdam", "Wien", "Budapest", "Südtirol", "Gardasee", "Toskana", "Paris", "Kroatien", "Ostsee"],
  },
  advantages: [
    "Bus, Hotel und Programm aus einer Hand",
    "Preis pro Person inklusive Zuschlägen",
    "Freiplätze ab bestimmter Gruppengröße",
    "Sicherungsschein bei Pauschalreisen",
    "Anzahlung und Restzahlung planbar",
    "Feste Ansprechperson vor und während der Reise",
  ],
  faqs: [
    { q: "Ab wie vielen Personen gilt eine Gruppenreise?", a: "Bei uns ab 20 Personen. Kleinere Gruppen planen wir ebenfalls, dann meist als individuelle Mietfahrt mit Hotelvermittlung." },
    { q: "Gibt es Freiplätze?", a: "Ab bestimmten Gruppengrößen ja – die genaue Staffel nennen wir im Angebot, damit Sie sie in Ihre Kalkulation einrechnen können." },
    { q: "Können Einzelzimmer gebucht werden?", a: "Ja, gegen Einzelzimmerzuschlag. Wir weisen ihn getrennt aus, damit Ihre Gruppe frei wählen kann." },
    { q: "Wer betreut die Gruppe vor Ort?", a: "Der Fahrer ist Ansprechpartner für alles rund um den Bus. Für Programmbetreuung vermitteln wir auf Wunsch örtliche Reiseleitungen." },
    { q: "Wie sicher ist meine Anzahlung?", a: "Bei Pauschalreisen ist Ihre Zahlung über die gesetzliche Insolvenzabsicherung geschützt; den Sicherungsschein erhalten Sie mit der Buchungsbestätigung." },
  ],
  links: [
    { label: "Bus mieten", path: "/bus-mieten", text: "Reine Busmiete ohne Hotel und Programm." },
    { label: "Vereinsfahrten", path: "/vereinsfahrten", text: "Fahrten speziell für Vereine." },
    { label: "Ausflugsfahrten", path: "/ausflugsfahrten", text: "Tagesfahrten in der Region." },
    { label: "Wochenendtrips", path: "/wochenendtrips", text: "Fertige Städtetrips mit Busanreise." },
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Fahrer, Lenkzeiten und Betreuung." },
  ],
  ctaTitle: "Gruppenreise anfragen",
  ctaText: "Nennen Sie Ziel, Reisedauer und Gruppengröße – Sie erhalten einen Reiseverlauf mit Preis pro Person.",
};
