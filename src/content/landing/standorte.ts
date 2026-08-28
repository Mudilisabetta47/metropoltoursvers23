import type { LandingContent } from "./types";

/**
 * Standortseiten Hannover & Bremen.
 * Jede Seite hat einen eigenen Suchintent und eigene, ortsbezogene Inhalte.
 */

export const busunternehmenHannover: LandingContent = {
  slug: "busunternehmen-hannover",
  seoTitle: "Busunternehmen Hannover – Reisebusse mit Fahrer",
  seoDescription:
    "Metropol Tours ist Ihr Busunternehmen in Hannover: moderne Reisebusse mit Fahrer für Gruppen, Vereine, Schulen und Firmen. Jetzt unverbindlich Angebot erhalten.",
  h1: "Busunternehmen in Hannover",
  heroKicker: "Sitz in Hannover · Fahrten in ganz Europa",
  heroText:
    "Wir sind ein inhabergeführtes Busunternehmen aus Hannover. Von der Tagesfahrt in den Harz bis zur mehrtägigen Vereinsreise nach Prag planen wir Ihre Fahrt mit eigenem Fuhrpark und festangestellten Fahrern.",
  heroImage: "busReal",
  heroAlt: "Reisebus von Metropol Tours vor der Abfahrt in Hannover",
  heroFacts: ["Eigener Fuhrpark", "Festangestellte Fahrer", "Antwort meist am selben Werktag"],
  locality: "Hannover",
  why: [
    {
      title: "Wir kennen Hannover",
      text: "Zustiege am ZOB, am Hauptbahnhof, an der Messe Laatzen, am Kröpcke oder direkt vor Ihrer Schule oder Firma – wir wissen, wo ein Reisebus in Hannover halten darf und wo es eng wird.",
    },
    {
      title: "Disposition statt Callcenter",
      text: "Ihre Anfrage landet direkt bei unserer Disposition in Hannover. Sie sprechen mit derselben Person, die später auch den Fahrer einteilt.",
    },
    {
      title: "Eigene Werkstattpartner",
      text: "Wartung, HU und Reifen laufen über feste Partner in der Region. Fällt ein Fahrzeug aus, steht in der Regel innerhalb weniger Stunden Ersatz bereit.",
    },
    {
      title: "Transparente Preise",
      text: "Sie bekommen ein Festpreisangebot inklusive Fahrer, Kilometern, Maut und gesetzlicher Pausen – ohne Nachberechnung nach der Fahrt.",
    },
  ],
  sections: [
    {
      h2: "Ihr Busunternehmen mit Standort Hannover",
      body: [
        "Hannover ist als Messe- und Kongressstadt einer der verkehrsreichsten Knotenpunkte Norddeutschlands. Genau deshalb arbeiten wir hier mit einer eigenen Disposition: Wer zur Messe, zum Spiel in die Heinz-von-Heiden-Arena oder zum Schützenfest fährt, braucht Fahrzeiten, die zu den realen Verkehrslagen auf dem Südschnellweg und dem Messeschnellweg passen – nicht zu einer Routenplaner-Schätzung.",
        "Über die A2 und A7 erreichen wir Braunschweig, Bielefeld, Hamburg, Kassel und Berlin ohne Umwege. Für europäische Ziele fahren wir im Fahrerteam, sodass Lenk- und Ruhezeiten eingehalten werden, ohne dass Ihre Gruppe eine Nacht unterwegs verliert.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Hannover",
          text: "ZOB am Hauptbahnhof, Raschplatz, Messegelände Laatzen, Expo Plaza, Herrenhäuser Gärten, Universität Hannover sowie Abholungen direkt an Schulen, Hotels und Firmenstandorten in Linden, List, Kleefeld oder Langenhagen.",
        },
        {
          h3: "Typische Ziele ab Hannover",
          text: "Harz, Hamburg, Nordsee, Berlin, Ruhrgebiet, Amsterdam, Prag, Wien und die Adria. Für Tagesfahrten ist alles im Radius von rund 300 Kilometern gut machbar.",
        },
      ],
    },
    {
      h2: "Was uns von reinen Vermittlungsportalen unterscheidet",
      body: [
        "Viele Angebote im Netz stammen von Portalen, die Ihre Anfrage weiterverkaufen. Sie erfahren erst kurz vor der Fahrt, welches Unternehmen wirklich fährt. Bei uns steht von Anfang an fest, welches Fahrzeug eingeplant ist und welche Ausstattung es hat.",
        "Sie erhalten spätestens zwei Tage vor Abfahrt die Kontaktdaten Ihres Fahrers. Bei mehrtägigen Reisen ist die Disposition während der gesamten Fahrt erreichbar.",
      ],
    },
  ],
  fleet: [
    { name: "Midibus", seats: "20–35 Sitze", text: "Wendig genug für die Innenstadt und enge Schulhöfe, ideal für Tagesfahrten." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Der Klassiker für Vereins-, Klassen- und Firmenfahrten mit Klimaanlage, WC und WLAN." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Mit Bordküche, verstellbaren Sitzen und großem Kofferraum für Mehrtagesreisen." },
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Für Delegationen, Transfers und kleine Gruppen mit viel Gepäck." },
  ],
  occasions: [
    { title: "Messe & Kongress", text: "Shuttles zwischen Hotel, Messegelände Laatzen und Innenstadt – auch im Pendelbetrieb." },
    { title: "Vereins- und Fanfahrten", text: "Auswärtsfahrten mit Gepäckraum für Ausrüstung und Betreuung durch erfahrene Fahrer." },
    { title: "Klassen- und Abschlussfahrten", text: "Von der Tagesfahrt in den Serengeti-Park bis zur Studienfahrt nach Prag." },
    { title: "Firmenevents", text: "Betriebsausflüge, Jubiläen und Weihnachtsfeiern inklusive später Rückfahrt." },
  ],
  process: [
    { title: "1. Anfrage senden", text: "Datum, Start, Ziel und Personenzahl genügen für ein erstes Angebot." },
    { title: "2. Angebot erhalten", text: "Sie bekommen einen Festpreis inklusive Fahrer, Maut und Kilometern." },
    { title: "3. Details klären", text: "Zustiege, Zwischenstopps und Wünsche zur Ausstattung stimmen wir gemeinsam ab." },
    { title: "4. Fahrt durchführen", text: "Fahrerkontakt vorab, pünktliche Abholung, feste Ansprechperson während der Fahrt." },
  ],
  area: {
    intro:
      "Ab Hannover fahren wir deutschlandweit und in ganz Europa. Häufig angefragt werden Fahrten aus der Region Hannover und dem südlichen Niedersachsen:",
    cities: ["Hannover", "Langenhagen", "Garbsen", "Laatzen", "Lehrte", "Hildesheim", "Celle", "Hameln", "Braunschweig", "Wolfsburg"],
  },
  advantages: [
    "Regionale Disposition mit direkter Durchwahl",
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Fahrer im Team bei langen Strecken",
    "Kostenlose Stornierung nach Vereinbarung",
    "Rechnung auf Firmen-, Schul- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wo hat Metropol Tours seinen Sitz?", a: "Unser Unternehmenssitz ist Hannover. Von dort disponieren wir alle Fahrten und planen Zustiege in der gesamten Region." },
    { q: "Wie schnell bekomme ich ein Angebot?", a: "In der Regel am selben Werktag. Anfragen, die vor 15 Uhr eingehen, beantworten wir meist innerhalb weniger Stunden." },
    { q: "Kann der Bus direkt an unserer Schule oder Firma halten?", a: "Ja, sofern die Zufahrt für ein Fahrzeug mit bis zu 13,5 Metern Länge geeignet ist. Wir prüfen die Adresse vor der Bestätigung." },
    { q: "Fahren Sie auch nachts oder am Wochenende?", a: "Ja. Nacht- und Wochenendfahrten sind möglich; unser Büro ist Montag bis Freitag von 8 bis 20 Uhr besetzt." },
    { q: "Was kostet ein Bus ab Hannover?", a: "Eine Tagesfahrt in der Region beginnt üblicherweise im niedrigen vierstelligen Bereich, abhängig von Kilometern, Einsatzdauer und Fahrzeuggröße. Sie erhalten immer einen Festpreis." },
  ],
  links: [
    { label: "Bus mieten Hannover", path: "/bus-mieten-hannover", text: "Preise, Ablauf und Fahrzeugauswahl für Mietfahrten ab Hannover." },
    { label: "Reisebus mieten Hannover", path: "/reisebus-mieten-hannover", text: "Mehrtägige Reisen mit Fernreisebus ab Hannover." },
    { label: "Busvermietung Hannover", path: "/busvermietung-hannover", text: "Unser Vermietungsangebot mit Konditionen im Überblick." },
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Alles zu Fahrern, Lenkzeiten und Betreuung unterwegs." },
    { label: "Flughafentransfer", path: "/flughafentransfer", text: "Gruppentransfers ab Hannover-Langenhagen, Hamburg und Bremen." },
  ],
  ctaTitle: "Bus in Hannover anfragen",
  ctaText: "Senden Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busMietenHannover: LandingContent = {
  slug: "bus-mieten-hannover",
  seoTitle: "Bus mieten Hannover – mit Fahrer ab Festpreis",
  seoDescription:
    "Bus mieten in Hannover: Midibus, Reisebus oder Kleinbus inklusive Fahrer. Transparenter Festpreis, schnelle Rückmeldung. Jetzt Angebot anfragen.",
  h1: "Bus mieten in Hannover",
  heroKicker: "8 bis 59 Plätze · inklusive Fahrer",
  heroText:
    "Ob Tagesausflug, Firmenfeier oder Transfer: Bei uns mieten Sie in Hannover einen Bus in genau der Größe, die zu Ihrer Gruppe passt – inklusive Fahrer, Versicherung und Maut.",
  heroImage: "premiumBus",
  heroAlt: "Moderner Mietbus von Metropol Tours mit geöffneter Tür in Hannover",
  heroFacts: ["Festpreis ohne Nachberechnung", "Fahrzeuge von 8 bis 59 Plätzen", "Zustieg an Wunschadresse"],
  locality: "Hannover",
  why: [
    { title: "Richtige Größe statt Standardbus", text: "Für 24 Personen schicken wir keinen 57-Sitzer. Das spart Kosten und macht Zufahrten in Wohngebieten deutlich einfacher." },
    { title: "Preis steht vor der Buchung", text: "Kilometer, Standzeiten, Maut und Fahrerkosten sind im Angebot enthalten. Nachträglich kommt nichts dazu." },
    { title: "Abholung an Ihrer Adresse", text: "Statt Treffpunkt am ZOB holen wir Sie dort ab, wo Ihre Gruppe startet – Schule, Vereinsheim, Hotel oder Betriebsgelände." },
    { title: "Kurzfristig möglich", text: "Auch Anfragen mit wenigen Tagen Vorlauf können wir häufig bedienen, weil wir eigene Fahrzeuge disponieren." },
  ],
  sections: [
    {
      h2: "Was kostet es, in Hannover einen Bus zu mieten?",
      body: [
        "Der Preis für einen Mietbus setzt sich aus drei Faktoren zusammen: gefahrene Kilometer, Einsatzdauer des Fahrers und Fahrzeuggröße. Eine Halbtagsfahrt innerhalb der Region Hannover ist deutlich günstiger als eine Tagesfahrt an die Nordsee, weil der Fahrer weniger Einsatzstunden benötigt.",
        "Rechnen Sie bei einer Tagesfahrt mit Rückkehr am selben Abend mit einem Festpreis, der Anfahrt, Wartezeiten und Rückfahrt enthält. Bei mehrtägigen Einsätzen kommen Übernachtung und Verpflegung des Fahrers hinzu – diese Posten weisen wir im Angebot getrennt aus, damit Sie den Preis nachvollziehen können.",
      ],
      blocks: [
        { h3: "Was ist immer enthalten?", text: "Fahrer, Kraftstoff, Maut, Versicherung, Reinigung sowie WLAN und Klimaanlage im Fahrzeug." },
        { h3: "Was kann zusätzlich anfallen?", text: "Parkgebühren an Zielorten, Übernachtung des Fahrers bei Mehrtagesfahrten, Sonderwünsche wie Getränkeservice oder Anhänger für Sportgeräte." },
      ],
    },
    {
      h2: "Bus mieten für Gruppen jeder Größe",
      body: [
        "Für Gruppen bis 19 Personen ist ein Kleinbus meist die wirtschaftlichste Lösung. Ab 20 Personen lohnt sich ein Midibus, ab 40 Personen ein klassischer Reisebus. Wenn Ihre Teilnehmerzahl noch schwankt, planen wir zunächst mit einer Bandbreite und legen die Fahrzeuggröße wenige Tage vor Abfahrt fest.",
        "Wichtig ist auch das Gepäck: Für Skifreizeiten, Musikinstrumente oder Sportausrüstung planen wir zusätzlichen Stauraum ein – bei Bedarf mit Anhänger.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Für Transfers, Delegationen und kleine Gruppen mit direkter Tür-zu-Tür-Abholung." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Kompakt, klimatisiert und ideal für Ausflüge in der Region Hannover." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Mit WC, WLAN, Bordküche und großem Kofferraum für lange Strecken." },
    { name: "Doppelstockbus", seats: "bis 79 Sitze", text: "Auf Anfrage für sehr große Gruppen bei Events und Shuttles." },
  ],
  occasions: [
    { title: "Betriebsausflug", text: "Abholung vor dem Betriebsgelände, Rückfahrt auch spät am Abend." },
    { title: "Hochzeit & Feier", text: "Gästetransfer zwischen Kirche, Location und Hotels im Raum Hannover." },
    { title: "Tagesausflug", text: "Harz, Steinhuder Meer, Hamburg, Serengeti-Park oder Weserbergland." },
    { title: "Konzert & Stadion", text: "Gemeinsame An- und Abreise ohne Parkplatzsuche und ohne Alkoholthema." },
  ],
  process: [
    { title: "1. Eckdaten nennen", text: "Datum, Uhrzeit, Start, Ziel und ungefähre Personenzahl." },
    { title: "2. Angebot prüfen", text: "Sie erhalten Fahrzeugvorschlag und Festpreis schriftlich per E-Mail." },
    { title: "3. Verbindlich buchen", text: "Nach Ihrer Freigabe erhalten Sie die Auftragsbestätigung." },
    { title: "4. Abfahrt", text: "Fahrerkontakt vorab, pünktliche Abholung an Ihrer Wunschadresse." },
  ],
  area: {
    intro: "Wir vermieten Busse in Hannover und im gesamten Umland – Abholungen sind auch außerhalb der Stadtgrenze möglich:",
    cities: ["Hannover-Mitte", "List", "Linden", "Laatzen", "Langenhagen", "Garbsen", "Ronnenberg", "Sehnde", "Burgdorf", "Wunstorf"],
  },
  advantages: [
    "Festpreis inklusive Fahrer und Maut",
    "Fahrzeuge von 8 bis 79 Plätzen",
    "Abholung an jeder befahrbaren Adresse",
    "Auch kurzfristige Anfragen möglich",
    "Rechnung mit ausgewiesener Umsatzsteuer",
    "Ansprechpartner während der gesamten Fahrt",
  ],
  faqs: [
    { q: "Kann ich einen Bus ohne Fahrer mieten?", a: "Nein. Wir vermieten ausschließlich mit eigenem, festangestelltem Fahrer – das ist bei Fahrzeugen dieser Größe die sichere und rechtlich saubere Lösung." },
    { q: "Wie viele Tage im Voraus sollte ich buchen?", a: "Für Tagesfahrten genügen oft wenige Tage. In der Hauptsaison von Mai bis September und rund um Messetermine empfehlen wir vier bis acht Wochen Vorlauf." },
    { q: "Darf im Bus gegessen und getrunken werden?", a: "Ja, in Maßen und ohne Glasflaschen. Für Feiern mit Getränkeservice sprechen Sie uns bitte vorab an." },
    { q: "Wie wird abgerechnet?", a: "Per Rechnung nach der Fahrt oder mit Anzahlung bei mehrtägigen Einsätzen. Firmen, Schulen und Vereine erhalten Zahlungsziel." },
    { q: "Was passiert bei einer Panne?", a: "Wir organisieren Ersatz über unser Partnernetz. Bei Fahrten in der Region steht meist innerhalb von 60 bis 120 Minuten ein Ersatzfahrzeug bereit." },
  ],
  links: [
    { label: "Reisebus mieten Hannover", path: "/reisebus-mieten-hannover", text: "Für Mehrtagesfahrten und lange Strecken ab Hannover." },
    { label: "Busunternehmen Hannover", path: "/busunternehmen-hannover", text: "Wer wir sind und wie unsere Disposition arbeitet." },
    { label: "Busvermietung Hannover", path: "/busvermietung-hannover", text: "Konditionen, Ausstattung und Buchungsbedingungen." },
    { label: "Schulfahrten", path: "/schulfahrten", text: "Klassenfahrten und Wandertage mit Reisebus." },
    { label: "Vereinsfahrten", path: "/vereinsfahrten", text: "Auswärtsfahrten und Vereinsausflüge planen." },
  ],
  ctaTitle: "Jetzt Bus in Hannover anfragen",
  ctaText: "Ein kurzes Formular genügt – Sie erhalten Fahrzeugvorschlag und Festpreis schriftlich.",
};

export const reisebusMietenHannover: LandingContent = {
  slug: "reisebus-mieten-hannover",
  seoTitle: "Reisebus mieten Hannover – Fernbusse für Gruppen",
  seoDescription:
    "Reisebus mieten in Hannover für Mehrtagesfahrten, Studienreisen und Vereinsausflüge. Komfortbusse mit WC, WLAN und Bordküche. Jetzt Angebot erhalten.",
  h1: "Reisebus mieten in Hannover",
  heroKicker: "Komfortklasse für lange Strecken",
  heroText:
    "Wenn es weiter geht als bis zum Harz: Unsere Fernreisebusse ab Hannover haben verstellbare Sitze, Bord-WC, Klimaanlage und genug Kofferraum für eine Woche Gepäck.",
  heroImage: "metropolHero",
  heroAlt: "Fernreisebus von Metropol Tours auf der Autobahn Richtung Süden",
  heroFacts: ["Fahrerteam auf Langstrecken", "Bord-WC und Bordküche", "Gepäckraum für Mehrtagesreisen"],
  locality: "Hannover",
  why: [
    { title: "Ausgelegt auf Distanz", text: "Unsere Fernbusse fahren regelmäßig Strecken nach Prag, Wien, Amsterdam und an die Adria. Sitzabstand und Federung sind darauf ausgelegt." },
    { title: "Zwei Fahrer, wenn nötig", text: "Ab bestimmten Streckenlängen planen wir ein Fahrerteam ein, damit die Ankunftszeit trotz Lenkzeiten stimmt." },
    { title: "Planung inklusive", text: "Wir kalkulieren Pausen, Fährzeiten, Mautstrecken und Umweltzonen mit ein – kein böses Erwachen an der Grenze." },
    { title: "Reisebegleitung möglich", text: "Auf Wunsch organisieren wir zusätzlich Reiseleitung, Hotelblöcke und Programmpunkte." },
  ],
  sections: [
    {
      h2: "Reisebus für Mehrtagesfahrten ab Hannover",
      body: [
        "Eine mehrtägige Fahrt ist etwas anderes als ein Ausflug. Sie müssen Lenk- und Ruhezeiten, Hotelparkplätze für ein 13,5 Meter langes Fahrzeug, Mautsysteme in Österreich oder Tschechien und die Verpflegung des Fahrers berücksichtigen. Wir übernehmen diese Planung vollständig und liefern Ihnen einen fertigen Fahrplan mit realistischen Ankunftszeiten.",
        "Bei Studien- und Vereinsreisen bewährt sich eine feste Tagesstruktur: Abfahrt früh am Morgen ab Hannover, eine längere Mittagspause an einer Raststätte mit Sitzmöglichkeiten und Ankunft am Zielort vor dem Abendessen. So bleibt der erste Reisetag nutzbar.",
      ],
      blocks: [
        { h3: "Beliebte Mehrtagesziele", text: "Prag, Wien, Amsterdam, Paris, Südtirol, Gardasee, Kroatien, Berlin und die Ostseeküste." },
        { h3: "Ausstattung im Fernbus", text: "Verstellbare Sitze mit Fußstütze, Klimaanlage, Bord-WC, Kaffeemaschine, Kühlschrank, USB-Anschlüsse, WLAN und Monitore." },
      ],
    },
    {
      h2: "Ab wann lohnt sich ein Reisebus gegenüber Bahn oder Flug?",
      body: [
        "Ab etwa 25 Personen ist der Reisebus in den meisten Fällen die günstigste Variante – vor allem, weil Gepäck, Transfers vor Ort und Umsteigezeiten entfallen. Die Gruppe bleibt zusammen, der Bus steht am Zielort zur Verfügung und Tagesausflüge vor Ort lassen sich ohne Zusatzkosten einplanen.",
        "Für Schulen und Vereine kommt ein praktischer Punkt hinzu: Die Aufsicht ist im Bus deutlich einfacher zu organisieren als in Zügen mit Umstiegen.",
      ],
    },
  ],
  fleet: [
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Vier-Sterne-Komfort mit Bordküche, WC und großem Gepäckraum." },
    { name: "Komfort-Reisebus", seats: "48–53 Sitze", text: "Mehr Beinfreiheit durch reduzierte Bestuhlung – beliebt bei Seniorengruppen." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Für kleinere Reisegruppen auf mittleren Strecken." },
    { name: "Doppelstockbus", seats: "bis 79 Sitze", text: "Auf Anfrage für große Reisegruppen." },
  ],
  occasions: [
    { title: "Studien- und Abschlussfahrten", text: "Mehrtägige Fahrten mit festem Programm und Bus vor Ort." },
    { title: "Vereinsreisen", text: "Jahresausflug, Turnierfahrt oder Chorreise inklusive Instrumententransport." },
    { title: "Seniorenreisen", text: "Ruhige Etappen, viele Pausen, Einstiegshilfe und Gepäckservice." },
    { title: "Firmenreisen", text: "Incentive-Reisen und Standortbesuche mit fester Ansprechperson." },
  ],
  process: [
    { title: "1. Reiseidee schildern", text: "Ziel, Reisezeitraum, Personenzahl und gewünschtes Komfortniveau." },
    { title: "2. Routenvorschlag", text: "Wir planen Etappen, Pausen und Ankunftszeiten realistisch durch." },
    { title: "3. Festpreis & Buchung", text: "Angebot inklusive Fahrerkosten, Maut und Übernachtung des Fahrers." },
    { title: "4. Reisebegleitung", text: "Fahrerkontakt vorab, Disposition während der Reise erreichbar." },
  ],
  area: {
    intro: "Startpunkt ist Hannover, Zusteige entlang der Route sind kostenfrei möglich. Häufige Reiseziele:",
    cities: ["Prag", "Wien", "Amsterdam", "Paris", "Südtirol", "Gardasee", "Kroatien", "Berlin", "Ostsee", "Harz"],
  },
  advantages: [
    "Fernbusse mit Bord-WC und Bordküche",
    "Fahrerteam auf langen Strecken",
    "Bus steht am Zielort zur Verfügung",
    "Maut- und Fährkosten im Festpreis",
    "Gepäckraum für Mehrtagesreisen",
    "Reiseleitung auf Wunsch buchbar",
  ],
  faqs: [
    { q: "Wie weit fahren Sie ab Hannover?", a: "Wir fahren in ganz Europa. Typische Ziele liegen zwischen 300 und 1.500 Kilometern; darüber hinaus planen wir mit Fahrerwechsel." },
    { q: "Steht der Bus während der Reise zur Verfügung?", a: "Ja, im Rahmen der gesetzlichen Lenk- und Ruhezeiten des Fahrers. Ausflüge vor Ort planen wir mit ein." },
    { q: "Wer bezahlt Hotel und Verpflegung des Fahrers?", a: "Diese Kosten sind Teil des Angebots. Häufig übernimmt das Zielhotel ein kostenfreies Fahrerzimmer – das rechnen wir für Sie an." },
    { q: "Gibt es WLAN während der ganzen Fahrt?", a: "Unsere Fernbusse haben WLAN. In Tunneln und Grenzregionen kann die Verbindung kurzzeitig abbrechen." },
    { q: "Können wir unterwegs zusteigen?", a: "Ja. Zusätzliche Zustiege entlang der Strecke, etwa in Hildesheim, Göttingen oder Kassel, sind meist ohne Aufpreis möglich." },
  ],
  links: [
    { label: "Bus mieten Hannover", path: "/bus-mieten-hannover", text: "Kurzfahrten, Transfers und Tagesausflüge ab Hannover." },
    { label: "Busunternehmen Hannover", path: "/busunternehmen-hannover", text: "Unser Standort, unsere Fahrzeuge und unsere Disposition." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Komplette Gruppenreisen inklusive Hotel und Programm." },
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Lenkzeiten, Fahrerteam und Betreuung erklärt." },
    { label: "Bus Charter", path: "/bus-charter", text: "Exklusive Charterfahrten für Veranstalter und Unternehmen." },
  ],
  ctaTitle: "Reisebus ab Hannover anfragen",
  ctaText: "Sagen Sie uns Ziel und Reisezeitraum – wir planen Etappen und nennen Ihnen einen Festpreis.",
};

export const busvermietungHannover: LandingContent = {
  slug: "busvermietung-hannover",
  seoTitle: "Busvermietung Hannover – Konditionen & Fuhrpark",
  seoDescription:
    "Busvermietung in Hannover mit klaren Konditionen: Fuhrpark, Ausstattung, Stornoregeln und Festpreise auf einen Blick. Jetzt Bus mit Fahrer anfragen.",
  h1: "Busvermietung in Hannover",
  heroKicker: "Konditionen, Fuhrpark und Buchung",
  heroText:
    "Diese Seite erklärt, wie unsere Busvermietung in Hannover funktioniert: welche Fahrzeuge verfügbar sind, was im Preis steckt, welche Fristen gelten und wie die Buchung abläuft.",
  heroImage: "business",
  heroAlt: "Busflotte von Metropol Tours auf dem Betriebshof in Hannover",
  heroFacts: ["Klare Stornofristen", "Rahmenverträge möglich", "Rechnung mit Zahlungsziel"],
  locality: "Hannover",
  why: [
    { title: "Konditionen vorab schriftlich", text: "Sie erhalten Preis, Leistungsumfang und Stornofristen im Angebot – nicht erst in den AGB nach der Buchung." },
    { title: "Rahmenverträge für Firmen", text: "Wer regelmäßig fährt, bekommt feste Konditionen, hinterlegte Kostenstellen und Sammelrechnung." },
    { title: "Ersatzfahrzeugkonzept", text: "Wir halten Reservekapazitäten vor und arbeiten mit geprüften Partnerbetrieben in der Region zusammen." },
    { title: "Dokumentierte Wartung", text: "HU, Sicherheitsprüfung und Wartungsintervalle sind lückenlos dokumentiert und auf Anfrage einsehbar." },
  ],
  sections: [
    {
      h2: "So funktioniert die Busvermietung bei Metropol Tours",
      body: [
        "Wir vermieten Busse ausschließlich mit Fahrer. Das bedeutet: Sie mieten eine vollständige Beförderungsleistung inklusive Versicherung, Fahrpersonal, Kraftstoff und Maut. Rechtlich ist das eine Personenbeförderung nach dem Personenbeförderungsgesetz – Sie brauchen keine eigene Konzession und keine Fahrerlaubnis der Klasse D.",
        "Der Mietzeitraum beginnt mit der Bereitstellung am vereinbarten Abholort und endet mit der Rückkehr. Wartezeiten am Zielort sind eingerechnet, solange sie im Angebot vereinbart wurden. Verlängerungen vor Ort sind möglich, sofern die Lenkzeiten des Fahrers es zulassen.",
      ],
      blocks: [
        { h3: "Stornierung", text: "Bis 30 Tage vor Fahrtantritt in der Regel kostenfrei, danach gestaffelt. Die genauen Fristen stehen in Ihrem Angebot." },
        { h3: "Zahlung", text: "Firmen, Schulen und Vereine zahlen auf Rechnung. Bei Mehrtagesfahrten erheben wir eine Anzahlung." },
      ],
    },
    {
      h2: "Fuhrpark und Ausstattung im Detail",
      body: [
        "Unsere Fahrzeuge sind zwischen Kleinbus und Doppelstockbus gestaffelt. Alle Reisebusse verfügen über Klimaanlage, verstellbare Sitze, Sicherheitsgurte, USB-Anschlüsse und WLAN. Bord-WC und Bordküche sind in der Fernklasse Standard, im Midibus je nach Fahrzeug verfügbar.",
        "Für besondere Anforderungen – etwa Rollstuhlplätze, Anhänger für Fahrräder oder erhöhten Gepäckbedarf bei Skifreizeiten – geben Sie das bitte bei der Anfrage an. Diese Fahrzeuge sind begrenzt verfügbar und sollten früh reserviert werden.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Transfers, Delegationen, kurze Strecken." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Ausflüge, Shuttles, innerstädtische Einsätze." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Standardfahrzeug für Gruppen- und Vereinsfahrten." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Komfortklasse für Mehrtagesreisen in Europa." },
  ],
  occasions: [
    { title: "Regelmäßige Firmenfahrten", text: "Werksverkehr, Schichttransport und Standortpendel im Rahmenvertrag." },
    { title: "Veranstaltungen", text: "Shuttleverkehr im Pendelbetrieb mit mehreren Fahrzeugen." },
    { title: "Bildungsträger", text: "Exkursionen und Praxistage mit Sammelrechnung." },
    { title: "Kommunen & Behörden", text: "Ausschreibungsfähige Angebote mit Nachweisen zu Wartung und Versicherung." },
  ],
  process: [
    { title: "1. Bedarf melden", text: "Einmalfahrt oder wiederkehrender Bedarf – beides möglich." },
    { title: "2. Angebot mit Konditionen", text: "Festpreis, Leistungsumfang, Stornofristen und Zahlungsziel schriftlich." },
    { title: "3. Beauftragung", text: "Freigabe per E-Mail genügt, Auftragsbestätigung folgt umgehend." },
    { title: "4. Durchführung & Rechnung", text: "Fahrt wie vereinbart, Rechnung mit Ihrer Kostenstelle." },
  ],
  area: {
    intro: "Bereitstellung ab Hannover, Einsätze bundesweit und europaweit. Häufig bedienen wir:",
    cities: ["Hannover", "Hildesheim", "Celle", "Peine", "Nienburg", "Hameln", "Neustadt am Rübenberge", "Springe", "Barsinghausen", "Gehrden"],
  },
  advantages: [
    "Vermietung immer inklusive Fahrer und Versicherung",
    "Schriftliche Konditionen vor der Buchung",
    "Rahmenverträge für Firmenkunden",
    "Dokumentierte Wartung und Prüfungen",
    "Ersatzfahrzeugkonzept über Partnernetz",
    "Sammelrechnung und Kostenstellen möglich",
  ],
  faqs: [
    { q: "Vermieten Sie Busse zur Selbstfahrt?", a: "Nein. Alle Fahrzeuge werden ausschließlich mit unserem eigenen Fahrpersonal vermietet." },
    { q: "Bis wann kann ich kostenfrei stornieren?", a: "In der Regel bis 30 Tage vor Fahrtantritt. Die für Ihre Buchung gültige Frist steht im Angebot." },
    { q: "Sind Ihre Fahrzeuge versichert?", a: "Ja, mit gesetzlicher Haftpflicht in erhöhter Deckung sowie Insassenunfallversicherung. Nachweise stellen wir auf Anfrage bereit." },
    { q: "Können wir einen Rahmenvertrag abschließen?", a: "Ja, ab etwa zehn Fahrten pro Jahr lohnt sich das. Sie erhalten feste Konditionen und einen persönlichen Ansprechpartner." },
    { q: "Sind rollstuhlgerechte Fahrzeuge verfügbar?", a: "Für bestimmte Termine ja, die Kapazität ist aber begrenzt. Bitte fragen Sie mit möglichst viel Vorlauf an." },
  ],
  links: [
    { label: "Bus mieten Hannover", path: "/bus-mieten-hannover", text: "Der schnelle Weg zum Mietbus mit Festpreis." },
    { label: "Reisebus mieten Hannover", path: "/reisebus-mieten-hannover", text: "Komfortbusse für Mehrtagesfahrten." },
    { label: "Busunternehmen Hannover", path: "/busunternehmen-hannover", text: "Über unseren Betrieb und unsere Fahrer." },
    { label: "Shuttle-Service", path: "/shuttle-service", text: "Pendelverkehr bei Events und Firmenfeiern." },
    { label: "Bus Charter", path: "/bus-charter", text: "Charterlösungen für Veranstalter." },
  ],
  ctaTitle: "Konditionen für Ihre Fahrt anfragen",
  ctaText: "Nennen Sie uns Ihren Bedarf – Sie erhalten ein Angebot inklusive aller Konditionen.",
};

export const busMietenBremen: LandingContent = {
  slug: "bus-mieten-bremen",
  seoTitle: "Bus mieten Bremen – Gruppenbus mit Fahrer",
  seoDescription:
    "Bus mieten in Bremen: Kleinbus, Midibus oder Reisebus mit Fahrer – für Ausflüge, Firmenfahrten und Transfers. Festpreis anfragen und schnell Antwort erhalten.",
  h1: "Bus mieten in Bremen",
  heroKicker: "Abholung in ganz Bremen und umzu",
  heroText:
    "Von der Überseestadt bis nach Vegesack: Wir stellen Ihnen in Bremen einen Bus mit Fahrer bereit – für Tagesausflüge an die Nordsee, Firmenfahrten oder den Transfer zum Weserstadion.",
  heroImage: "group",
  heroAlt: "Gruppe steigt in Bremen in einen Reisebus von Metropol Tours ein",
  heroFacts: ["Nordsee in unter zwei Stunden", "Kleinbus bis Doppeldecker", "Festpreis inklusive Fahrer"],
  locality: "Bremen",
  why: [
    { title: "Kurze Wege an die Küste", text: "Bremerhaven, Cuxhaven und die Nordseebäder sind ab Bremen bequeme Tagesziele – wir kalkulieren solche Fahrten oft günstiger als vergleichbare Anbieter aus dem Binnenland." },
    { title: "Erfahrung mit der Innenstadt", text: "Halten am Hauptbahnhof, an der Bürgerweide oder in der Neustadt braucht Ortskenntnis. Unsere Fahrer kennen die zulässigen Haltemöglichkeiten." },
    { title: "Feste Ansprechperson", text: "Von der Anfrage bis zur Rechnung betreut Sie dieselbe Person in unserer Disposition." },
    { title: "Auch für Bremerhaven", text: "Wir bedienen den gesamten Nordwesten – von Delmenhorst über Oldenburg bis Bremerhaven." },
  ],
  sections: [
    {
      h2: "Bus mieten in Bremen: typische Einsätze",
      body: [
        "Bremen hat eine dichte Veranstaltungskultur: Freimarkt, Werder-Heimspiele, Messen auf der Bürgerweide und Firmenevents in der Überseestadt. Für all diese Anlässe ist ein gemieteter Bus meist die entspannteste Lösung, weil die Parksituation in Innenstadtnähe angespannt ist und die Gruppe geschlossen ankommt.",
        "Der zweite große Block sind Ausflüge Richtung Küste. Bremerhaven mit Klimahaus und Auswandererhaus ist in gut einer Stunde erreichbar, Cuxhaven in rund zwei Stunden. Solche Fahrten planen wir gerne mit Zwischenstopp, damit die Gruppe unterwegs Pause machen kann.",
      ],
      blocks: [
        { h3: "Beliebte Abholorte in Bremen", text: "Hauptbahnhof, Bürgerweide, Überseestadt, Universität Bremen, Airport Bremen, Vegesack sowie Schulen und Firmen in Findorff, Schwachhausen und der Neustadt." },
        { h3: "Beliebte Ziele ab Bremen", text: "Bremerhaven, Cuxhaven, Hamburg, Ostfriesland, Lüneburger Heide, Oldenburg, Hannover, Amsterdam." },
      ],
    },
    {
      h2: "Preise für Mietbusse ab Bremen",
      body: [
        "Für eine Halbtagsfahrt innerhalb Bremens fällt deutlich weniger an als für eine Tagesfahrt an die Küste, weil Fahrerstunden und Kilometer die wichtigsten Kostenfaktoren sind. Wir kalkulieren immer als Festpreis: Sie wissen vor der Buchung, was die Fahrt kostet.",
        "Wenn Sie flexibel sind, lohnt sich ein Blick auf den Wochentag. Dienstag bis Donnerstag ist die Fahrzeugauslastung geringer, entsprechend günstiger fallen die Angebote aus.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Ideal für Transfers zum Airport Bremen und kleine Gruppen." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Wendig für die Bremer Innenstadt und Ausflüge ins Umland." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Für Vereins-, Klassen- und Firmenfahrten an die Küste." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Für mehrtägige Fahrten mit viel Gepäck." },
  ],
  occasions: [
    { title: "Werder-Heimspiele", text: "Gemeinsame Anfahrt zum Weserstadion ohne Parkplatzsuche." },
    { title: "Ausflug an die Nordsee", text: "Bremerhaven, Cuxhaven oder Ostfriesland als Tagesziel." },
    { title: "Firmenveranstaltungen", text: "Transfers in der Überseestadt, Messebesuche und Betriebsausflüge." },
    { title: "Familienfeiern", text: "Hochzeiten und Jubiläen mit Gästetransfer zwischen Location und Hotels." },
  ],
  process: [
    { title: "1. Anfrage", text: "Datum, Abholort in Bremen, Ziel und Personenzahl." },
    { title: "2. Angebot", text: "Festpreis inklusive Fahrer, Kilometern und Maut per E-Mail." },
    { title: "3. Buchung", text: "Freigabe genügt, Auftragsbestätigung folgt sofort." },
    { title: "4. Fahrt", text: "Fahrerkontakt vorab, pünktliche Abholung am vereinbarten Ort." },
  ],
  area: {
    intro: "Wir holen Sie in Bremen und im gesamten Nordwesten ab:",
    cities: ["Bremen-Mitte", "Überseestadt", "Vegesack", "Findorff", "Delmenhorst", "Bremerhaven", "Oldenburg", "Achim", "Verden", "Osterholz-Scharmbeck"],
  },
  advantages: [
    "Festpreis inklusive Fahrer und Maut",
    "Nordseeziele in ein bis zwei Stunden erreichbar",
    "Abholung an jeder befahrbaren Adresse in Bremen",
    "Fahrzeuge von 8 bis 79 Plätzen",
    "Günstigere Preise unter der Woche",
    "Rechnung für Firmen, Schulen und Vereine",
  ],
  faqs: [
    { q: "Holen Sie auch in Bremerhaven oder Delmenhorst ab?", a: "Ja, der gesamte Nordwesten gehört zu unserem Einsatzgebiet. Die Anfahrt ist im Festpreis enthalten." },
    { q: "Wie lange dauert eine Fahrt von Bremen an die Nordsee?", a: "Nach Bremerhaven rund eine Stunde, nach Cuxhaven etwa zwei Stunden, nach Ostfriesland je nach Ziel zwei bis zweieinhalb Stunden." },
    { q: "Kann der Bus während des Ausflugs vor Ort bleiben?", a: "Ja. Standzeiten planen wir ein, solange sie mit den Lenk- und Ruhezeiten des Fahrers vereinbar sind." },
    { q: "Gibt es Rabatte für Vereine aus Bremen?", a: "Bei wiederkehrenden Fahrten arbeiten wir mit Staffelpreisen. Sprechen Sie uns auf eine Jahresvereinbarung an." },
    { q: "Wie kurzfristig kann ich buchen?", a: "Kurzfristige Anfragen sind oft möglich. Für Termine rund um den Freimarkt oder Heimspiele empfehlen wir mehrere Wochen Vorlauf." },
  ],
  links: [
    { label: "Reisebus mieten Bremen", path: "/reisebus-mieten-bremen", text: "Für Mehrtagesfahrten und lange Strecken ab Bremen." },
    { label: "Busvermietung Bremen", path: "/busvermietung-bremen", text: "Konditionen, Fuhrpark und Buchungsablauf." },
    { label: "Flughafentransfer", path: "/flughafentransfer", text: "Gruppentransfer zum Airport Bremen oder Hamburg." },
    { label: "Ausflugsfahrten", path: "/ausflugsfahrten", text: "Ausflugsziele und Tagesfahrten im Überblick." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Alle Standorte und Leistungen der Busvermietung." },
  ],
  ctaTitle: "Bus in Bremen anfragen",
  ctaText: "Abholort, Datum und Personenzahl genügen – wir melden uns mit einem Festpreis.",
};

export const reisebusMietenBremen: LandingContent = {
  slug: "reisebus-mieten-bremen",
  seoTitle: "Reisebus mieten Bremen – Komfortbusse für Gruppen",
  seoDescription:
    "Reisebus mieten in Bremen für Vereinsreisen, Klassenfahrten und Mehrtagestouren. Komfortbusse mit WC, WLAN und Bordküche inklusive Fahrer. Angebot anfragen.",
  h1: "Reisebus mieten in Bremen",
  heroKicker: "Mehrtagesfahrten ab der Hansestadt",
  heroText:
    "Für Reisen, die länger dauern als ein Tag: Unsere Komfortbusse ab Bremen bringen Ihre Gruppe entspannt an die Ostsee, nach Berlin, Amsterdam oder in die Alpen.",
  heroImage: "journey",
  heroAlt: "Reisebus von Metropol Tours auf einer Mehrtagesfahrt in Europa",
  heroFacts: ["Komfortbestuhlung", "Gepäckraum für 7 Tage", "Fahrerteam auf Langstrecke"],
  locality: "Bremen",
  why: [
    { title: "Anschluss an die Nord-Süd-Achsen", text: "Über die A1 und A27 sind Hamburg, Osnabrück, das Ruhrgebiet und die Niederlande ohne Umweg erreichbar – das spart Fahrzeit und Kosten." },
    { title: "Komfort für lange Etappen", text: "Verstellbare Sitze, Klimaanlage, Bord-WC und Kaffeemaschine gehören bei unseren Fernbussen zur Standardausstattung." },
    { title: "Planung mit realistischen Zeiten", text: "Wir kalkulieren Pausen und Verkehr ein. Ankunftszeiten in unserem Fahrplan sind belastbar, keine Wunschwerte." },
    { title: "Erfahrung mit Gruppenreisen", text: "Vereine, Schulen und Chöre aus Bremen fahren regelmäßig mit uns – inklusive Instrumenten, Trikots oder Sportgeräten." },
  ],
  sections: [
    {
      h2: "Mehrtagesreisen ab Bremen richtig planen",
      body: [
        "Bei einer Reise über mehrere Tage ist der Bus mehr als ein Transportmittel: Er ist Ihr Basisfahrzeug vor Ort. Deshalb klären wir vorab, welche Ausflüge am Zielort geplant sind, ob der Bus am Hotel parken kann und wie die Lenkzeiten des Fahrers zum Programm passen.",
        "Für Ziele in Skandinavien planen wir Fährverbindungen ab Puttgarden oder Rostock ein, für Alpenziele die Mautstrecken in Österreich. Beide Kostenblöcke sind Teil des Festpreises, damit Ihre Kalkulation stabil bleibt.",
      ],
      blocks: [
        { h3: "Beliebte Mehrtagesziele ab Bremen", text: "Berlin, Ostsee, Amsterdam, Sylt, Dresden, Prag, Südtirol, Gardasee, Paris." },
        { h3: "Was Gruppen häufig unterschätzen", text: "Gepäckvolumen bei Skifreizeiten, Parkgebühren in Innenstädten und die Zeit, die ein Ein- und Ausstieg mit 50 Personen tatsächlich braucht." },
      ],
    },
    {
      h2: "Reisebus statt Bahn: wann sich das rechnet",
      body: [
        "Ab rund 25 Mitreisenden ist der Reisebus in den meisten Fällen günstiger als Gruppentickets im Fernverkehr – und deutlich flexibler, weil Sie Abfahrtszeit, Zwischenstopps und Zielorte selbst bestimmen.",
        "Dazu kommt der praktische Vorteil: keine Umstiege, kein Gepäckschleppen, keine getrennten Sitzplätze. Gerade bei Schul- und Seniorengruppen aus Bremen ist das der ausschlaggebende Punkt.",
      ],
    },
  ],
  fleet: [
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Komfortklasse mit WC, Bordküche und großem Gepäckraum." },
    { name: "Komfort-Reisebus", seats: "48–53 Sitze", text: "Reduzierte Bestuhlung für mehr Beinfreiheit." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Für kleinere Reisegruppen und Ziele mit enger Zufahrt." },
    { name: "Doppelstockbus", seats: "bis 79 Sitze", text: "Auf Anfrage für sehr große Reisegruppen." },
  ],
  occasions: [
    { title: "Vereinsreisen", text: "Jahresfahrt, Turnier oder Trainingslager mit Ausrüstungstransport." },
    { title: "Klassen- und Studienfahrten", text: "Mehrtägige Fahrten mit Programm, Bus bleibt vor Ort." },
    { title: "Chor- und Musikreisen", text: "Sicherer Transport von Instrumenten und Technik." },
    { title: "Senioren- und Kirchengruppen", text: "Ruhige Etappen mit vielen Pausen und Einstiegshilfe." },
  ],
  process: [
    { title: "1. Reiseziel nennen", text: "Ziel, Zeitraum, Personenzahl und geplantes Programm." },
    { title: "2. Etappenplanung", text: "Wir stimmen Route, Pausen und Ankunftszeiten mit Ihnen ab." },
    { title: "3. Festpreisangebot", text: "Inklusive Maut, Fähre, Fahrerkosten und Übernachtung des Fahrers." },
    { title: "4. Reise", text: "Fahrerkontakt vorab, Disposition während der Reise erreichbar." },
  ],
  area: {
    intro: "Startpunkt Bremen, Zusteige auf der Strecke möglich. Typische Reiserichtungen:",
    cities: ["Berlin", "Ostsee", "Hamburg", "Amsterdam", "Ruhrgebiet", "Harz", "Sylt", "Prag", "Südtirol", "Paris"],
  },
  advantages: [
    "Komfortbusse mit WC und Bordküche",
    "Bus steht am Zielort zur Verfügung",
    "Fähr- und Mautkosten im Festpreis",
    "Fahrerteam bei langen Etappen",
    "Zusteige entlang der Route kostenfrei",
    "Erfahrung mit Sport- und Musikgepäck",
  ],
  faqs: [
    { q: "Wie viele Kilometer schafft der Bus an einem Tag?", a: "Realistisch sind rund 600 bis 700 Kilometer mit einem Fahrer inklusive Pausen. Darüber hinaus planen wir ein Fahrerteam ein." },
    { q: "Können wir eigenes Catering mitnehmen?", a: "Ja. Kühlmöglichkeiten sind im Fernbus vorhanden; bitte verzichten Sie auf Glasflaschen." },
    { q: "Wie viel Gepäck passt in den Bus?", a: "Bei einem Fernreisebus rechnen Sie mit etwa einem großen Koffer plus Handgepäck pro Person. Für mehr Volumen planen wir einen Anhänger ein." },
    { q: "Ist eine Anzahlung nötig?", a: "Bei Mehrtagesreisen erheben wir üblicherweise eine Anzahlung; der Restbetrag wird nach der Reise per Rechnung fällig." },
    { q: "Was passiert bei Krankheit des Fahrers?", a: "Wir stellen Ersatz aus dem eigenen Fahrerpool. Die Reise wird dadurch nicht abgesagt." },
  ],
  links: [
    { label: "Bus mieten Bremen", path: "/bus-mieten-bremen", text: "Tagesfahrten und Transfers ab Bremen." },
    { label: "Busvermietung Bremen", path: "/busvermietung-bremen", text: "Konditionen und Fuhrpark im Detail." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Komplette Gruppenreisen mit Hotel und Programm." },
    { label: "Schulfahrten", path: "/schulfahrten", text: "Klassenfahrten sicher und günstig organisieren." },
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Wie Lenkzeiten und Fahrerplanung funktionieren." },
  ],
  ctaTitle: "Reisebus ab Bremen anfragen",
  ctaText: "Nennen Sie Ziel und Zeitraum – wir planen die Etappen und schicken Ihnen ein Festpreisangebot.",
};

export const busvermietungBremen: LandingContent = {
  slug: "busvermietung-bremen",
  seoTitle: "Busvermietung Bremen – Preise, Flotte, Konditionen",
  seoDescription:
    "Busvermietung Bremen: Fuhrpark, Ausstattung, Stornofristen und Festpreise transparent erklärt. Bus mit Fahrer für Gruppen jetzt unverbindlich anfragen.",
  h1: "Busvermietung in Bremen",
  heroKicker: "Transparente Konditionen im Nordwesten",
  heroText:
    "Was kostet ein Bus, was ist enthalten, wie lange kann ich stornieren? Diese Seite beantwortet die praktischen Fragen zur Busvermietung in Bremen – ohne Kleingedrucktes.",
  heroImage: "heroBus",
  heroAlt: "Reisebusse von Metropol Tours in Bremen bereit zur Abfahrt",
  heroFacts: ["Festpreis statt Kilometerabrechnung", "Storno gestaffelt und schriftlich", "Zahlungsziel für Firmenkunden"],
  locality: "Bremen",
  why: [
    { title: "Ein Preis, alle Leistungen", text: "Fahrer, Kraftstoff, Maut, Versicherung und Reinigung stecken im Angebot. Es gibt keine Kilometerpauschale, die nachträglich abgerechnet wird." },
    { title: "Verbindliche Fristen", text: "Stornofristen und Zahlungsziele stehen im Angebot – Sie müssen nicht in den AGB suchen." },
    { title: "Regionale Verfügbarkeit", text: "Weil wir im Nordwesten regelmäßig fahren, können wir auch kurzfristige Anfragen aus Bremen oft bedienen." },
    { title: "Für Firmen und Institutionen", text: "Sammelrechnung, Kostenstellen und Rahmenverträge sind selbstverständlich möglich." },
  ],
  sections: [
    {
      h2: "Konditionen der Busvermietung in Bremen",
      body: [
        "Wir vermieten ausschließlich mit Fahrer. Sie buchen also eine Beförderungsleistung und keine reine Fahrzeugmiete – das ist für Sie einfacher, weil Versicherung, Konzession, Lenkzeitenkontrolle und Wartung vollständig bei uns liegen.",
        "Der Mietzeitraum startet am vereinbarten Abholort in Bremen und endet mit der Rückkehr. Wartezeiten am Zielort sind eingeplant. Kommt es vor Ort zu Programmänderungen, prüfen wir kurzfristig, ob die Lenkzeit des Fahrers die Verlängerung zulässt.",
      ],
      blocks: [
        { h3: "Stornofristen", text: "Bis 30 Tage vor Fahrt in der Regel kostenfrei, danach gestaffelt nach Zeitpunkt. Ihre konkreten Fristen stehen im Angebot." },
        { h3: "Zahlungsmodalitäten", text: "Firmen, Schulen, Vereine und Kommunen erhalten Rechnung mit Zahlungsziel; bei Mehrtagesfahrten fällt eine Anzahlung an." },
      ],
    },
    {
      h2: "Welche Fahrzeuge stehen in Bremen zur Verfügung?",
      body: [
        "Unsere Flotte reicht vom 8-Sitzer bis zum Doppelstockbus mit 79 Plätzen. Für die Bremer Innenstadt und Ziele mit enger Zufahrt empfehlen wir Midibusse; für Küstenausflüge und Mehrtagesreisen den klassischen Reisebus oder die Fernklasse.",
        "Sonderausstattungen wie Rollstuhlplätze, Fahrradanhänger oder erhöhter Gepäckraum sind verfügbar, aber begrenzt. Melden Sie solche Anforderungen bitte früh an, damit wir das passende Fahrzeug reservieren können.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Transfers zum Airport Bremen, kleine Delegationen." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Innerstädtische Einsätze und Ausflüge ins Umland." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Standard für Gruppen- und Vereinsfahrten." },
    { name: "Doppelstockbus", seats: "bis 79 Sitze", text: "Auf Anfrage für Großveranstaltungen." },
  ],
  occasions: [
    { title: "Messen & Events", text: "Shuttle zur Bürgerweide oder in die Überseestadt im Pendelbetrieb." },
    { title: "Werksverkehr", text: "Regelmäßige Schicht- und Standorttransporte im Rahmenvertrag." },
    { title: "Schulen & Hochschulen", text: "Exkursionen und Praxistage mit Sammelrechnung." },
    { title: "Vereine", text: "Auswärtsfahrten mit Platz für Ausrüstung und Fangruppen." },
  ],
  process: [
    { title: "1. Bedarf schildern", text: "Einzelfahrt oder wiederkehrender Bedarf, mit oder ohne Standzeit." },
    { title: "2. Angebot inkl. Konditionen", text: "Festpreis, Leistungen und Fristen schriftlich und nachvollziehbar." },
    { title: "3. Auftrag erteilen", text: "Kurze Freigabe per E-Mail genügt." },
    { title: "4. Fahrt & Rechnung", text: "Durchführung wie vereinbart, Rechnung mit Ihrer Kostenstelle." },
  ],
  area: {
    intro: "Bereitstellung ab Bremen, Einsätze im gesamten Nordwesten und darüber hinaus:",
    cities: ["Bremen", "Bremerhaven", "Delmenhorst", "Oldenburg", "Weyhe", "Stuhr", "Achim", "Syke", "Verden", "Osterholz-Scharmbeck"],
  },
  advantages: [
    "Vermietung immer mit eigenem Fahrpersonal",
    "Festpreis ohne Nachberechnung",
    "Schriftliche Storno- und Zahlungsbedingungen",
    "Rahmenverträge für wiederkehrende Fahrten",
    "Fahrzeuge von 8 bis 79 Plätzen",
    "Kurzfristige Verfügbarkeit im Nordwesten",
  ],
  faqs: [
    { q: "Kann ich einen Bus ohne Fahrer mieten?", a: "Nein, wir vermieten grundsätzlich mit Fahrer. Das schließt Versicherung, Wartung und Lenkzeitenkontrolle ein." },
    { q: "Gilt der Preis auch bei Stau oder Umleitung?", a: "Ja, der Festpreis bleibt bestehen. Nur bei erheblichen Programmänderungen vor Ort sprechen wir zusätzliche Stunden ab." },
    { q: "Erhalten wir eine Rechnung mit ausgewiesener Umsatzsteuer?", a: "Ja. Die Rechnung enthält alle steuerlich notwendigen Angaben und kann auf Ihre Kostenstelle ausgestellt werden." },
    { q: "Wie früh sollte ich in der Saison anfragen?", a: "Für Mai bis September und rund um Bremer Großveranstaltungen empfehlen wir vier bis acht Wochen Vorlauf." },
    { q: "Sind Nachtfahrten möglich?", a: "Ja, im Rahmen der gesetzlichen Lenk- und Ruhezeiten. Bei sehr späten Rückfahrten planen wir gegebenenfalls einen zweiten Fahrer ein." },
  ],
  links: [
    { label: "Bus mieten Bremen", path: "/bus-mieten-bremen", text: "Schnellster Weg zum Angebot für Bremen." },
    { label: "Reisebus mieten Bremen", path: "/reisebus-mieten-bremen", text: "Komfortbusse für Mehrtagesfahrten." },
    { label: "Shuttle-Service", path: "/shuttle-service", text: "Pendelverkehr für Events und Firmen." },
    { label: "Bus Charter", path: "/bus-charter", text: "Charterlösungen für Veranstalter und Agenturen." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Übersicht über alle Standorte und Leistungen." },
  ],
  ctaTitle: "Angebot für Bremen erhalten",
  ctaText: "Schildern Sie Ihren Bedarf – Sie bekommen Festpreis und Konditionen schriftlich.",
};

export const busMietenHamburg: LandingContent = {
  slug: "bus-mieten-hamburg",
  seoTitle: "Bus mieten Hamburg – Reisebus mit Fahrer",
  seoDescription:
    "Bus mieten in Hamburg: Kleinbus, Midibus oder Reisebus mit Fahrer für Ausflüge, Firmenfahrten, Hafenrundfahrten und Transfers. Festpreis anfragen – Antwort meist am selben Werktag.",
  h1: "Bus mieten in Hamburg",
  heroKicker: "Abholung in ganz Hamburg und im Umland",
  heroText:
    "Von der HafenCity bis Harburg, vom Flughafen Fuhlsbüttel bis zur Elbphilharmonie: Wir stellen Ihnen in Hamburg einen Bus mit Fahrer bereit – für Tagesausflüge an die Küste, Firmenfahrten, Messebesuche und Gruppentransfers.",
  heroImage: "premiumBus",
  heroAlt: "Reisebus von Metropol Tours an der Elbe in Hamburg",
  heroFacts: ["Ostsee und Nordsee als Tagesziel", "Kleinbus bis Fernreisebus", "Festpreis inklusive Fahrer"],
  locality: "Hamburg",
  why: [
    {
      title: "Ortskenntnis im Hamburger Verkehr",
      text: "Elbtunnel, Köhlbrandbrücke und die Zufahrten zu den Messehallen sind zu Stoßzeiten unberechenbar. Wir kalkulieren Fahrzeiten anhand realer Erfahrungswerte, nicht nach Routenplaner.",
    },
    {
      title: "Haltemöglichkeiten, die funktionieren",
      text: "In der Innenstadt darf ein Reisebus längst nicht überall halten. Wir stimmen Ein- und Ausstiege vorab ab – etwa an den Landungsbrücken, am ZOB oder am Hotel.",
    },
    {
      title: "Küste in kurzer Zeit",
      text: "Lübeck, Timmendorfer Strand, Cuxhaven und die Lüneburger Heide sind ab Hamburg bequeme Tagesziele – ideal für Betriebsausflüge und Vereinsfahrten.",
    },
    {
      title: "Feste Ansprechperson",
      text: "Von der Anfrage bis zur Rechnung betreut Sie dieselbe Person aus unserer Disposition. Kein Portal, kein Weiterverkauf Ihrer Anfrage.",
    },
  ],
  sections: [
    {
      h2: "Bus mieten in Hamburg: typische Einsätze",
      body: [
        "Hamburg ist Messe-, Kongress- und Kreuzfahrtstadt zugleich. Entsprechend unterschiedlich fallen die Anfragen aus: Shuttleverkehr zwischen Hotel und Messegelände, Transfers vom Cruise Center Steinwerder zum Flughafen, Betriebsausflüge in die Heide oder Klassenfahrten mit Programm im Hafen.",
        "Weil Parkraum in Innenstadtnähe knapp und teuer ist, lohnt sich ein gemieteter Bus schon ab etwa 20 Personen. Die Gruppe kommt geschlossen an, das Gepäck bleibt im Fahrzeug und Sie sparen sich die Parkplatzsuche in St. Pauli oder rund um die Alster.",
      ],
      blocks: [
        {
          h3: "Beliebte Abholorte in Hamburg",
          text: "Hauptbahnhof und ZOB, Landungsbrücken, HafenCity und Elbphilharmonie, Messegelände und CCH, Flughafen Hamburg, Cruise Center Altona und Steinwerder sowie Schulen, Hotels und Firmenstandorte in Altona, Eimsbüttel, Wandsbek, Bergedorf und Harburg.",
        },
        {
          h3: "Beliebte Ziele ab Hamburg",
          text: "Lübeck und Travemünde, Timmendorfer Strand, Sylt-Anschluss über Niebüll, Cuxhaven, Lüneburger Heide, Bremen, Hannover, Berlin sowie Kopenhagen und Amsterdam für Mehrtagesfahrten.",
        },
      ],
    },
    {
      h2: "Preise für Mietbusse ab Hamburg",
      body: [
        "Die wichtigsten Kostenfaktoren sind Einsatzdauer, gefahrene Kilometer und Fahrzeuggröße. Eine Halbtagsfahrt innerhalb Hamburgs liegt deshalb deutlich unter einer Tagesfahrt an die Ostsee. Sie erhalten von uns immer einen Festpreis inklusive Fahrer, Maut und gesetzlicher Pausen.",
        "Unter der Woche – vor allem Dienstag bis Donnerstag – ist die Auslastung geringer und die Angebote fallen günstiger aus. Rund um Hafengeburtstag, Kreuzfahrttage und große Messen empfehlen wir mehrere Wochen Vorlauf.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Für Transfers zum Flughafen Hamburg und kleine Gruppen mit Gepäck." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Wendig genug für enge Straßen in Altona, Ottensen und der Innenstadt." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Der Klassiker für Vereins-, Klassen- und Firmenfahrten mit WC und WLAN." },
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Für Mehrtagesfahrten Richtung Skandinavien, Berlin oder Amsterdam." },
  ],
  occasions: [
    { title: "Messe & Kongress", text: "Pendelverkehr zwischen Hotels, Messegelände und CCH – auch im getakteten Shuttlebetrieb." },
    { title: "Kreuzfahrt-Transfers", text: "Abholung am Cruise Center und Weiterfahrt zum Flughafen, Bahnhof oder Hotel." },
    { title: "Betriebsausflug & Firmenevent", text: "Fahrten an die Ostsee, in die Heide oder zum Teamevent im Umland inklusive später Rückfahrt." },
    { title: "Klassen- und Studienfahrten", text: "Hafenrundfahrt, Miniatur Wunderland und Speicherstadt mit Bus als Basisfahrzeug." },
  ],
  process: [
    { title: "1. Anfrage", text: "Datum, Abholort in Hamburg, Ziel und Personenzahl genügen." },
    { title: "2. Angebot", text: "Festpreis inklusive Fahrer, Kilometern und Maut per E-Mail." },
    { title: "3. Buchung", text: "Ihre Freigabe genügt, die Auftragsbestätigung folgt sofort." },
    { title: "4. Fahrt", text: "Fahrerkontakt vorab, pünktliche Abholung am vereinbarten Ort." },
  ],
  area: {
    intro: "Wir holen Sie in Hamburg und im gesamten Umland ab:",
    cities: [
      "Hamburg-Mitte",
      "Altona",
      "HafenCity",
      "Eimsbüttel",
      "Wandsbek",
      "Harburg",
      "Bergedorf",
      "Norderstedt",
      "Pinneberg",
      "Lüneburg",
    ],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Ostsee und Nordsee in ein bis zwei Stunden erreichbar",
    "Abholung an jeder befahrbaren Adresse in Hamburg",
    "Fahrzeuge von 8 bis 79 Plätzen",
    "Günstigere Konditionen unter der Woche",
    "Rechnung für Firmen, Schulen und Vereine",
  ],
  faqs: [
    { q: "Holen Sie auch in Norderstedt, Pinneberg oder Lüneburg ab?", a: "Ja, das gesamte Hamburger Umland gehört zu unserem Einsatzgebiet. Die Anfahrt ist im Festpreis enthalten." },
    { q: "Darf der Bus in der Hamburger Innenstadt halten?", a: "An vielen Stellen ja, aber nicht überall. Wir prüfen die Adresse vorab und schlagen bei Bedarf eine zulässige Halteposition in Laufweite vor." },
    { q: "Wie lange dauert eine Fahrt von Hamburg an die Ostsee?", a: "Nach Lübeck rund eine Stunde, nach Timmendorfer Strand etwa eineinhalb Stunden, nach Cuxhaven rund zwei Stunden – jeweils ohne Berufsverkehr." },
    { q: "Können Sie einen Transfer vom Kreuzfahrtterminal übernehmen?", a: "Ja. Wir fahren die Cruise Center in Altona, Steinwerder und der HafenCity an und planen Puffer für verspätete Ausschiffungen ein." },
    { q: "Wie kurzfristig kann ich einen Bus in Hamburg mieten?", a: "Kurzfristige Anfragen sind oft möglich. Für Messetermine, den Hafengeburtstag und Ferienzeiten empfehlen wir mehrere Wochen Vorlauf." },
  ],
  links: [
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Ausstattung, Ablauf und Konditionen im Überblick." },
    { label: "Flughafentransfer", path: "/flughafentransfer", text: "Gruppentransfer zum Flughafen Hamburg." },
    { label: "Bus mieten Bremen", path: "/bus-mieten-bremen", text: "Unser zweiter Standort im Nordwesten." },
    { label: "Ausflugsfahrten", path: "/ausflugsfahrten", text: "Tagesziele ab Hamburg und Norddeutschland." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Alle Standorte und Leistungen der Busvermietung." },
  ],
ctaTitle: "Bus in Hamburg anfragen",
  ctaText: "Abholort, Datum und Personenzahl genügen – wir melden uns mit einem Festpreis.",
};

export const reisebusMietenHamburg: LandingContent = {
  slug: "reisebus-mieten-hamburg",
  seoTitle: "Reisebus mieten Hamburg – Komfortbusse für Gruppen",
  seoDescription:
    "Reisebus mieten in Hamburg für Vereinsreisen, Klassenfahrten und Mehrtagestouren. Komfortbusse mit WC, WLAN und Bordküche inklusive Fahrer. Angebot anfragen.",
  h1: "Reisebus mieten in Hamburg",
  heroKicker: "Mehrtagesfahrten ab der Hansestadt",
  heroText:
    "Für Reisen, die länger dauern als ein Tag: Unsere Komfortbusse ab Hamburg bringen Ihre Gruppe entspannt an die Ostsee, nach Berlin, Skandinavien oder in die Alpen.",
  heroImage: "journey",
  heroAlt: "Reisebus von Metropol Tours auf einer Mehrtagesfahrt ab Hamburg",
  heroFacts: ["Komfortbestuhlung", "Gepäckraum für 7 Tage", "Fahrerteam auf Langstrecke"],
  locality: "Hamburg",
  why: [
    { title: "Anschluss an die Nord-Süd-Achsen", text: "Über die A7, A1 und A24 sind Kiel, Berlin, Hannover, Bremen und Dänemark ohne Umwege erreichbar – das spart Fahrzeit und Kosten." },
    { title: "Komfort für lange Etappen", text: "Verstellbare Sitze, Klimaanlage, Bord-WC und Kaffeemaschine gehören bei unseren Fernbussen zur Standardausstattung." },
    { title: "Planung mit realistischen Zeiten", text: "Elbtunnel, Hamburger Elbbrücken und Stauzeiten rechnen wir real ein. Ankunftszeiten in unserem Fahrplan sind belastbar." },
    { title: "Erfahrung mit Gruppenreisen", text: "Vereine, Schulen und Chöre aus Hamburg fahren regelmäßig mit uns – inklusive Instrumenten, Trikots oder Sportgeräten." },
  ],
  sections: [
    {
      h2: "Mehrtagesreisen ab Hamburg richtig planen",
      body: [
        "Bei einer Reise über mehrere Tage ist der Bus mehr als ein Transportmittel: Er ist Ihr Basisfahrzeug vor Ort. Deshalb klären wir vorab, welche Ausflüge am Zielort geplant sind, ob der Bus am Hotel parken kann und wie die Lenkzeiten des Fahrers zum Programm passen.",
        "Für Ziele in Skandinavien planen wir Fährverbindungen ab Puttgarden, Rostock oder Kiel ein, für Alpenziele die Mautstrecken in Österreich. Beide Kostenblöcke sind Teil des Festpreises, damit Ihre Kalkulation stabil bleibt.",
      ],
      blocks: [
        { h3: "Beliebte Mehrtagesziele ab Hamburg", text: "Berlin, Ostsee, Kopenhagen, Amsterdam, Dresden, Prag, Sylt, Gardasee, Südtirol, Paris." },
        { h3: "Was Gruppen häufig unterschätzen", text: "Gepäckvolumen bei Skifreizeiten, Parkgebühren in Innenstädten und die Zeit, die ein Ein- und Ausstieg mit 50 Personen tatsächlich braucht." },
      ],
    },
    {
      h2: "Reisebus statt Bahn: wann sich das rechnet",
      body: [
        "Ab rund 25 Mitreisenden ist der Reisebus in den meisten Fällen günstiger als Gruppentickets im Fernverkehr – und deutlich flexibler, weil Sie Abfahrtszeit, Zwischenstopps und Zielorte selbst bestimmen.",
        "Dazu kommt der praktische Vorteil: keine Umstiege, kein Gepäckschleppen, keine getrennten Sitzplätze. Gerade bei Schul- und Seniorengruppen aus Hamburg ist das der ausschlaggebende Punkt.",
      ],
    },
  ],
  fleet: [
    { name: "Fernreisebus", seats: "50–59 Sitze", text: "Komfortklasse mit WC, Bordküche und großem Gepäckraum." },
    { name: "Komfort-Reisebus", seats: "48–53 Sitze", text: "Reduzierte Bestuhlung für mehr Beinfreiheit." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Für kleinere Reisegruppen und Ziele mit enger Zufahrt." },
    { name: "Doppelstockbus", seats: "bis 79 Sitze", text: "Auf Anfrage für sehr große Reisegruppen." },
  ],
  occasions: [
    { title: "Vereinsreisen", text: "Jahresfahrt, Turnier oder Trainingslager mit Ausrüstungstransport." },
    { title: "Klassen- und Studienfahrten", text: "Mehrtägige Fahrten mit Programm, Bus bleibt vor Ort." },
    { title: "Chor- und Musikreisen", text: "Sicherer Transport von Instrumenten und Technik." },
    { title: "Senioren- und Kirchengruppen", text: "Ruhige Etappen mit vielen Pausen und Einstiegshilfe." },
  ],
  process: [
    { title: "1. Reiseziel nennen", text: "Ziel, Zeitraum, Personenzahl und geplantes Programm." },
    { title: "2. Etappenplanung", text: "Wir stimmen Route, Pausen und Ankunftszeiten mit Ihnen ab." },
    { title: "3. Festpreisangebot", text: "Inklusive Maut, Fähre, Fahrerkosten und Übernachtung des Fahrers." },
    { title: "4. Reise", text: "Fahrerkontakt vorab, Disposition während der Reise erreichbar." },
  ],
  area: {
    intro: "Startpunkt Hamburg, Zusteige auf der Strecke möglich. Typische Reiserichtungen:",
    cities: ["Berlin", "Ostsee", "Lübeck", "Kopenhagen", "Hannover", "Bremen", "Sylt", "Prag", "Südtirol", "Amsterdam"],
  },
  advantages: [
    "Komfortbusse mit WC und Bordküche",
    "Bus steht am Zielort zur Verfügung",
    "Fähr- und Mautkosten im Festpreis",
    "Fahrerteam bei langen Etappen",
    "Zusteige entlang der Route kostenfrei",
    "Erfahrung mit Sport- und Musikgepäck",
  ],
  faqs: [
    { q: "Wie viele Kilometer schafft der Bus an einem Tag?", a: "Realistisch sind rund 600 bis 700 Kilometer mit einem Fahrer inklusive Pausen. Darüber hinaus planen wir ein Fahrerteam ein." },
    { q: "Können wir eigenes Catering mitnehmen?", a: "Ja. Kühlmöglichkeiten sind im Fernbus vorhanden; bitte verzichten Sie auf Glasflaschen." },
    { q: "Wie viel Gepäck passt in den Bus?", a: "Bei einem Fernreisebus rechnen Sie mit etwa einem großen Koffer plus Handgepäck pro Person. Für mehr Volumen planen wir einen Anhänger ein." },
    { q: "Ist eine Anzahlung nötig?", a: "Bei Mehrtagesreisen erheben wir üblicherweise eine Anzahlung; der Restbetrag wird nach der Reise per Rechnung fällig." },
    { q: "Was passiert bei Krankheit des Fahrers?", a: "Wir stellen Ersatz aus dem eigenen Fahrerpool. Die Reise wird dadurch nicht abgesagt." },
  ],
  links: [
    { label: "Bus mieten Hamburg", path: "/bus-mieten-hamburg", text: "Tagesfahrten und Transfers ab Hamburg." },
    { label: "Busvermietung Hamburg", path: "/busvermietung-hamburg", text: "Konditionen und Fuhrpark im Detail." },
    { label: "Gruppenreisen", path: "/gruppenreisen", text: "Komplette Gruppenreisen mit Hotel und Programm." },
    { label: "Schulfahrten", path: "/schulfahrten", text: "Klassenfahrten sicher und günstig organisieren." },
    { label: "Reisebus mit Fahrer", path: "/reisebus-mit-fahrer", text: "Wie Lenkzeiten und Fahrerplanung funktionieren." },
  ],
  ctaTitle: "Reisebus ab Hamburg anfragen",
  ctaText: "Nennen Sie Ziel und Zeitraum – wir planen die Etappen und schicken Ihnen ein Festpreisangebot.",
};

export const busvermietungHamburg: LandingContent = {
  slug: "busvermietung-hamburg",
  seoTitle: "Busvermietung Hamburg – Preise, Flotte, Konditionen",
  seoDescription:
    "Busvermietung Hamburg: Fuhrpark, Ausstattung, Stornofristen und Festpreise transparent erklärt. Bus mit Fahrer für Gruppen jetzt unverbindlich anfragen.",
  h1: "Busvermietung in Hamburg",
  heroKicker: "Transparente Konditionen im Norden",
  heroText:
    "Was kostet ein Bus, was ist enthalten, wie lange kann ich stornieren? Diese Seite beantwortet die praktischen Fragen zur Busvermietung in Hamburg – ohne Kleingedrucktes.",
  heroImage: "heroBus",
  heroAlt: "Reisebusse von Metropol Tours in Hamburg bereit zur Abfahrt",
  heroFacts: ["Festpreis statt Kilometerabrechnung", "Storno gestaffelt und schriftlich", "Zahlungsziel für Firmenkunden"],
  locality: "Hamburg",
  why: [
    { title: "Ein Preis, alle Leistungen", text: "Fahrer, Kraftstoff, Maut, Versicherung und Reinigung stecken im Angebot. Es gibt keine Kilometerpauschale, die nachträglich abgerechnet wird." },
    { title: "Verbindliche Fristen", text: "Stornofristen und Zahlungsziele stehen im Angebot – Sie müssen nicht in den AGB suchen." },
    { title: "Regionale Verfügbarkeit", text: "Weil wir in Hamburg und im Umland regelmäßig fahren, können wir auch kurzfristige Anfragen aus der Region oft bedienen." },
    { title: "Für Firmen und Institutionen", text: "Sammelrechnung, Kostenstellen und Rahmenverträge sind selbstverständlich möglich." },
  ],
  sections: [
    {
      h2: "Konditionen der Busvermietung in Hamburg",
      body: [
        "Wir vermieten ausschließlich mit Fahrer. Sie buchen also eine Beförderungsleistung und keine reine Fahrzeugmiete – das ist für Sie einfacher, weil Versicherung, Konzession, Lenkzeitenkontrolle und Wartung vollständig bei uns liegen.",
        "Der Mietzeitraum startet am vereinbarten Abholort in Hamburg und endet mit der Rückkehr. Wartezeiten am Zielort sind eingeplant. Kommt es vor Ort zu Programmänderungen, prüfen wir kurzfristig, ob die Lenkzeit des Fahrers die Verlängerung zulässt.",
      ],
      blocks: [
        { h3: "Stornofristen", text: "Bis 30 Tage vor Fahrt in der Regel kostenfrei, danach gestaffelt nach Zeitpunkt. Ihre konkreten Fristen stehen im Angebot." },
        { h3: "Zahlungsmodalitäten", text: "Firmen, Schulen, Vereine und Kommunen erhalten Rechnung mit Zahlungsziel; bei Mehrtagesfahrten fällt eine Anzahlung an." },
      ],
    },
    {
      h2: "Welche Fahrzeuge stehen in Hamburg zur Verfügung?",
      body: [
        "Unsere Flotte reicht vom 8-Sitzer bis zum Doppelstockbus mit 79 Plätzen. Für die Hamburger Innenstadt und Ziele mit enger Zufahrt empfehlen wir Midibusse; für Küstenausflüge und Mehrtagesreisen den klassischen Reisebus oder die Fernklasse.",
        "Sonderausstattungen wie Rollstuhlplätze, Fahrradanhänger oder erhöhter Gepäckraum sind verfügbar, aber begrenzt. Melden Sie solche Anforderungen bitte früh an, damit wir das passende Fahrzeug reservieren können.",
      ],
    },
  ],
  fleet: [
    { name: "Kleinbus", seats: "8–19 Sitze", text: "Transfers zum Flughafen Hamburg, kleine Delegationen." },
    { name: "Midibus", seats: "20–35 Sitze", text: "Innerstädtische Einsätze und Ausflüge ins Umland." },
    { name: "Reisebus", seats: "48–57 Sitze", text: "Standard für Gruppen- und Vereinsfahrten." },
    { name: "Doppelstockbus", seats: "bis 79 Sitze", text: "Auf Anfrage für Großveranstaltungen." },
  ],
  occasions: [
    { title: "Messen & Events", text: "Shuttle zu den Messehallen und zum CCH im Pendelbetrieb." },
    { title: "Werksverkehr", text: "Regelmäßige Schicht- und Standorttransporte im Rahmenvertrag." },
    { title: "Schulen & Hochschulen", text: "Exkursionen und Praxistage mit Sammelrechnung." },
    { title: "Vereine", text: "Auswärtsfahrten mit Platz für Ausrüstung und Fangruppen." },
  ],
  process: [
    { title: "1. Bedarf schildern", text: "Einzelfahrt oder wiederkehrender Bedarf, mit oder ohne Standzeit." },
    { title: "2. Angebot inkl. Konditionen", text: "Festpreis, Leistungen und Fristen schriftlich und nachvollziehbar." },
    { title: "3. Auftrag erteilen", text: "Kurze Freigabe per E-Mail genügt." },
    { title: "4. Fahrt & Rechnung", text: "Durchführung wie vereinbart, Rechnung mit Ihrer Kostenstelle." },
  ],
  area: {
    intro: "Bereitstellung ab Hamburg, Einsätze im gesamten Norden und darüber hinaus:",
    cities: ["Hamburg", "Norderstedt", "Ahrensburg", "Reinbek", "Pinneberg", "Wedel", "Lüneburg", "Stade", "Buxtehude", "Lübeck"],
  },
  advantages: [
    "Vermietung immer mit eigenem Fahrpersonal",
    "Festpreis ohne Nachberechnung",
    "Schriftliche Storno- und Zahlungsbedingungen",
    "Rahmenverträge für wiederkehrende Fahrten",
    "Fahrzeuge von 8 bis 79 Plätzen",
    "Kurzfristige Verfügbarkeit im Norden",
  ],
  faqs: [
    { q: "Kann ich einen Bus ohne Fahrer mieten?", a: "Nein, wir vermieten grundsätzlich mit Fahrer. Das schließt Versicherung, Wartung und Lenkzeitenkontrolle ein." },
    { q: "Gilt der Preis auch bei Stau im Elbtunnel?", a: "Ja, der Festpreis bleibt bestehen. Nur bei erheblichen Programmänderungen vor Ort sprechen wir zusätzliche Stunden ab." },
    { q: "Erhalten wir eine Rechnung mit ausgewiesener Umsatzsteuer?", a: "Ja. Die Rechnung enthält alle steuerlich notwendigen Angaben und kann auf Ihre Kostenstelle ausgestellt werden." },
    { q: "Wie früh sollte ich in der Saison anfragen?", a: "Für Mai bis September und rund um den Hafengeburtstag empfehlen wir vier bis acht Wochen Vorlauf." },
    { q: "Sind Nachtfahrten möglich?", a: "Ja, im Rahmen der gesetzlichen Lenk- und Ruhezeiten. Bei sehr späten Rückfahrten planen wir gegebenenfalls einen zweiten Fahrer ein." },
  ],
  links: [
    { label: "Bus mieten Hamburg", path: "/bus-mieten-hamburg", text: "Schnellster Weg zum Angebot für Hamburg." },
    { label: "Reisebus mieten Hamburg", path: "/reisebus-mieten-hamburg", text: "Komfortbusse für Mehrtagesfahrten." },
    { label: "Shuttle-Service", path: "/shuttle-service", text: "Pendelverkehr für Events und Firmen." },
    { label: "Bus Charter", path: "/bus-charter", text: "Charterlösungen für Veranstalter und Agenturen." },
    { label: "Bus mieten", path: "/bus-mieten", text: "Übersicht über alle Standorte und Leistungen." },
  ],
  ctaTitle: "Angebot für Hamburg erhalten",
  ctaText: "Schildern Sie Ihren Bedarf – Sie bekommen Festpreis und Konditionen schriftlich.",
};
