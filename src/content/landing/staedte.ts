import type { LandingContent } from "./types";

/**
 * Stadtseiten „Busunternehmen in {Stadt}" – Stufe 1 (12 Städte).
 * Jede Seite trägt individuell geschriebene, stadtbezogene Inhalte:
 * eigene Zustiege, eigene Ziele, eigene FAQ. Keine Textbausteine mit
 * ausgetauschtem Stadtnamen. LocalBusiness-Schema wird bewusst NICHT
 * gesetzt – Metropol Tours hat dort keinen physischen Standort.
 */

const sharedFleet: LandingContent["fleet"] = [
  { name: "Kleinbus", seats: "8–19 Sitze", text: "Für Transfers, Delegationen und kleine Gruppen mit direkter Abholung." },
  { name: "Midibus", seats: "20–35 Sitze", text: "Wendig in der Stadt, klimatisiert – ideal für Tagesfahrten und Shuttles." },
  { name: "Reisebus", seats: "48–57 Sitze", text: "Der Klassiker für Gruppen: Klimaanlage, WC, WLAN und großer Kofferraum." },
  { name: "Fernreisebus", seats: "50–59 Sitze", text: "Komfortklasse mit Bordküche und verstellbaren Sitzen für Mehrtagesreisen." },
];

const sharedProcess: LandingContent["process"] = [
  { title: "1. Anfrage senden", text: "Datum, Start, Ziel und Personenzahl genügen für ein erstes Angebot." },
  { title: "2. Festpreis erhalten", text: "Sie bekommen ein verbindliches Angebot inklusive Fahrer, Kilometern und Maut." },
  { title: "3. Details abstimmen", text: "Zustiege, Zwischenstopps und Ausstattungswünsche klären wir gemeinsam." },
  { title: "4. Entspannt fahren", text: "Fahrerkontakt vorab, pünktliche Abholung, feste Ansprechperson während der Fahrt." },
];

const serviceLinks = (city: string): LandingContent["links"] => [
  { label: "Bus mieten", path: "/bus-mieten", text: `Preise, Fahrzeuggrößen und Ablauf für Mietfahrten ab ${city}.` },
  { label: "Gruppenreisen", path: "/gruppenreisen", text: `Mehrtägige Busreisen für Gruppen ab ${city} in ganz Europa.` },
  { label: "Schulfahrten", path: "/schulfahrten", text: `Klassenfahrten und Schulausflüge mit erfahrenen Fahrern ab ${city}.` },
  { label: "Vereinsfahrten", path: "/vereinsfahrten", text: `Auswärtsfahrten und Vereinsausflüge ab ${city} zum Festpreis.` },
  { label: "Flughafentransfer", path: "/flughafentransfer", text: `Gruppentransfers zum Flughafen und zurück – auch nachts.` },
  { label: "Bus-Charter", path: "/bus-charter", text: "Individuelle Charterfahrten nach Strecke, Dauer und Gruppengröße." },
];

export const busunternehmenBerlin: LandingContent = {
  slug: "busunternehmen-berlin",
  seoTitle: "Busunternehmen Berlin | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Berlin mieten: Gruppenreisen, Klassenfahrten, Shuttles und Flughafentransfers zum BER. Festpreisangebot von Metropol Tours anfordern.",
  h1: "Busunternehmen in Berlin",
  heroKicker: "Busfahrten ab Berlin · deutschlandweit & europaweit",
  heroText:
    "Ob Klassenfahrt von einer Schule in Neukölln, Messeshuttle zum CityCube oder Vereinsausflug an die Ostsee: Wir stellen moderne Reisebusse mit Fahrer für Ihre Gruppe in Berlin – mit Festpreis und persönlicher Disposition.",
  heroImage: "metropolHero",
  heroAlt: "Reisebus von Metropol Tours auf Fahrt ab Berlin",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Zustiege in ganz Berlin", "Antwort meist am selben Werktag"],
  why: [
    {
      title: "Berlin ist Großstadtlogistik",
      text: "Busspuren, Halteverbote, Baustellen: In Berlin entscheidet die Abfahrtszeit, ob eine Fahrt entspannt beginnt. Wir planen Zustiege so, dass Ihre Gruppe nicht durch die Stadt läuft – und der Bus nicht im Stau steht.",
    },
    {
      title: "Erfahrung mit Schulen und Vereinen",
      text: "Klassenfahrten ins Museum, Auswärtsfahrten zum Spiel, Abschlussfahrten nach Prag oder Amsterdam: Wir wissen, welche Genehmigungen, Halteplätze und Fahrzeiten in Berlin funktionieren.",
    },
    {
      title: "Fahrerteam auf Langstrecke",
      text: "Für Ziele wie Paris, Wien oder die Adria fahren wir ab Berlin im Fahrerteam. Lenk- und Ruhezeiten werden eingehalten, ohne dass Ihre Gruppe unnötig Zeit verliert.",
    },
    {
      title: "Ein Ansprechpartner",
      text: "Von der Anfrage bis zur Rückkehr sprechen Sie mit derselben Disposition. Kein Portal, kein Weiterverkauf Ihrer Fahrt.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Berlin: Zustiege, die funktionieren",
      body: [
        "Berlin ist groß – ein Zustieg in Spandau ist für eine Gruppe aus Köpenick keine Lösung. Deshalb stimmen wir den Abfahrtsort mit Ihnen ab: direkt an der Schule, am Vereinsheim, am Hotel oder an einem der etablierten Bushaltepunkte der Stadt.",
        "Über die Stadtautobahn und die Autobahnen A9, A10, A11 und A13 sind Dresden, Leipzig, Hamburg, München und die polnische Grenze direkt erreichbar. Für Fernreisen planen wir die Route so, dass Ihre Gruppe früh aus dem Stadtverkehr heraus ist.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Berlin",
          text: "ZOB am Funkturm, Hauptbahnhof (Europaplatz), Messe Berlin/CityCube, Flughafen BER sowie Abholungen direkt an Schulen, Hotels und Firmenstandorten in allen Bezirken.",
        },
        {
          h3: "Typische Ziele ab Berlin",
          text: "Ostsee, Dresden, Leipzig, Hamburg, Prag, Warschau, Amsterdam und die Adria. Für Tagesfahrten eignet sich alles im Radius von rund 250 Kilometern – vom Spreewald bis zur Müritz.",
        },
      ],
    },
    {
      h2: "Klassenfahrten, Vereine und Firmen ab Berlin",
      body: [
        "Berliner Schulen buchen uns für Tagesfahrten genauso wie für mehrtägige Studienfahrten. Lehrkräfte erhalten vorab alle Unterlagen: Fahrzeugdaten, Fahrerkontakt und einen klaren Ablauf für den Abfahrtstag.",
        "Für Unternehmen organisieren wir Shuttles zwischen Standorten, Transfers zu Veranstaltungen und Betriebsausflüge – auch im Pendelbetrieb mit mehreren Fahrzeugen.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Klassen- & Studienfahrten", text: "Vom Museumstag bis zur mehrtägigen Fahrt nach Prag oder Amsterdam." },
    { title: "Messe & Kongress", text: "Shuttles zu Messe Berlin, CityCube und Veranstaltungsorten in der ganzen Stadt." },
    { title: "Vereinsfahrten", text: "Auswärtsfahrten, Trainingslager und Vereinsausflüge mit Platz für Ausrüstung." },
    { title: "Flughafentransfer BER", text: "Gruppentransfers zum und vom BER – abgestimmt auf Ihre Flugzeiten, auch nachts." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "In Berlin holen wir Gruppen in allen Bezirken ab – vom Zentrum bis in die Außenbezirke. Häufig angefragt werden Fahrten aus:",
    cities: ["Berlin-Mitte", "Charlottenburg", "Spandau", "Neukölln", "Köpenick", "Pankow", "Zehlendorf", "Potsdam", "Bernau", "Königs Wusterhausen"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Zustiege in allen Berliner Bezirken",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Fahrerteam bei Langstrecken",
    "Erfahrung mit Schulträgern und Behörden",
    "Rechnung auf Schul-, Firmen- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wie kann ich in Berlin einen Reisebus mieten?", a: "Senden Sie uns Datum, Abfahrtsort, Ziel und Personenzahl über das Anfrageformular oder per E-Mail. Sie erhalten in der Regel am selben Werktag ein Festpreisangebot." },
    { q: "Wo kann der Bus in Berlin halten?", a: "An etablierten Bushaltepunkten wie dem ZOB am Funkturm oder direkt an Ihrer Schule, Ihrem Hotel oder Firmenstandort – sofern die Zufahrt für einen Reisebus geeignet ist. Wir prüfen die Adresse vorab." },
    { q: "Bieten Sie Transfers zum Flughafen BER an?", a: "Ja. Wir stimmen Abholzeit und Puffer auf Ihren Flug ab und fahren auch frühmorgens oder nachts." },
    { q: "Kann ich eine Klassenfahrt ab Berlin buchen?", a: "Ja, von der Tagesfahrt bis zur mehrtägigen Studienfahrt. Schulen erhalten alle Unterlagen für die Genehmigung beim Schulträger." },
    { q: "Wie früh sollte ich buchen?", a: "Für Tagesfahrten genügen oft wenige Wochen. Für Ferienzeiten, Messen und mehrtägige Reisen empfehlen wir zwei bis drei Monate Vorlauf." },
    { q: "Was kostet ein Reisebus ab Berlin?", a: "Der Preis richtet sich nach Strecke, Einsatzdauer und Fahrzeuggröße. Sie erhalten immer einen verbindlichen Festpreis – ohne nachträgliche Zusatzkosten." },
  ],
  links: serviceLinks("Berlin"),
  ctaTitle: "Bus in Berlin anfragen",
  ctaText: "Senden Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenMuenchen: LandingContent = {
  slug: "busunternehmen-muenchen",
  seoTitle: "Busunternehmen München | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in München mieten: Gruppenreisen, Vereinsfahrten, Messeshuttles und Transfers zum Flughafen MUC. Festpreis von Metropol Tours anfordern.",
  h1: "Busunternehmen in München",
  heroKicker: "Busfahrten ab München · in die Alpen & nach Europa",
  heroText:
    "München ist das Tor zu den Alpen: Von der Klassenfahrt an den Chiemsee über die Vereinsreise nach Südtirol bis zum Messeshuttle – wir stellen Reisebusse mit Fahrer für Ihre Gruppe ab München, mit Festpreis und persönlicher Betreuung.",
  heroImage: "premiumBus",
  heroAlt: "Fernreisebus von Metropol Tours unterwegs ab München",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Zustiege in ganz München", "Alpen- und Europatouren im Fahrerteam"],
  why: [
    {
      title: "Alpenrouten brauchen Erfahrung",
      text: "Serpentinen, Tunnelmaut, Vignetten in Österreich und der Schweiz: Für Fahrten Richtung Südtirol, Salzburg oder Gardasee planen wir Route, Maut und Lenkzeiten im Voraus – inklusive aller Gebühren im Festpreis.",
    },
    {
      title: "Messe- und Eventlogistik",
      text: "Oktoberfest, Messe München, Kongresse: Zu Stoßzeiten ist München voll. Wir organisieren Shuttles und Gruppenanreisen mit festen Zeitfenstern, damit Ihre Gruppe pünktlich ankommt.",
    },
    {
      title: "Fahrer mit Ortskenntnis",
      text: "Unsere Fahrer kennen die Zufahrten zu Hotels, Vereinsheimen und Schulen – auch in engen Altstadtlagen und im Umland.",
    },
    {
      title: "Persönliche Disposition",
      text: "Ihre Anfrage landet bei Menschen, nicht bei einem Portal. Sie sprechen mit derselben Person, die später auch den Fahrer einteilt.",
    },
  ],
  sections: [
    {
      h2: "Ab München in die Alpen und nach Europa",
      body: [
        "Über die A8, A9 und A95 erreichen wir ab München die Alpen, Salzburg, Innsbruck und Südtirol ohne Umwege. Für Italien- und Kroatienreisen kalkulieren wir Tunnel- und Brennermaut sowie die österreichische Vignette direkt in Ihr Angebot ein.",
        "München selbst ist für Reisebusse anspruchsvoll: Umweltzone, enge Altstadt, begrenzte Busparkplätze. Wir wählen Zustiege, die für Ihre Gruppe bequem und für den Bus erlaubt sind – und kümmern uns um die Details.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in München",
          text: "ZOB am Hackerbrücke, Hauptbahnhof, Ostbahnhof, Messe München Riem, Flughafen München (MUC) sowie direkte Abholungen an Schulen, Hotels und Firmen in allen Stadtvierteln.",
        },
        {
          h3: "Typische Ziele ab München",
          text: "Chiemsee, Neuschwanstein, Salzburg, Innsbruck, Südtirol, Gardasee, Prag und Wien. Tagesfahrten sind in den gesamten Alpenvorland-Radius gut machbar.",
        },
      ],
    },
    {
      h2: "Für Schulen, Vereine und Unternehmen in München",
      body: [
        "Bayerische Schulen buchen uns für Skilager, Studienfahrten und Wandertage. Wir liefern vorab alle Nachweise, die Schulträger und Elternvertretungen erwarten – Fahrzeugdaten, Versicherung und Fahrerkontakt.",
        "Für Unternehmen organisieren wir Transfers zwischen Standorten, Shuttlebetrieb zu Veranstaltungen und mehrtägige Incentive-Reisen – mit mehreren Fahrzeugen, wenn die Gruppe groß ist.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Skilager & Wandertage", text: "Klassenfahrten in die bayerischen Alpen mit Platz für Skier und Ausrüstung." },
    { title: "Messe & Event", text: "Shuttles zur Messe München, zu Kongressen und zum Oktoberfest." },
    { title: "Vereinsreisen", text: "Auswärtsfahrten und mehrtägige Vereinsreisen nach Österreich und Italien." },
    { title: "Flughafentransfer MUC", text: "Gruppentransfers zum Flughafen München – abgestimmt auf Ihre Flugzeiten." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab München fahren wir in ganz Bayern und darüber hinaus. Häufig angefragt werden Zustiege aus der Stadt und dem Umland:",
    cities: ["München", "Freising", "Erding", "Dachau", "Fürstenfeldbruck", "Starnberg", "Garching", "Unterhaching", "Rosenheim", "Augsburg"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Vignetten",
    "Erfahrung auf Alpen- und Südtirolrouten",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Fahrerteam bei Fernreisen",
    "Unterlagen für Schulträger vorab",
    "Rechnung auf Schul-, Firmen- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wie miete ich in München einen Reisebus?", a: "Schicken Sie uns Datum, Abfahrtsort, Ziel und Personenzahl über das Anfrageformular. Sie erhalten meist am selben Werktag ein Festpreisangebot." },
    { q: "Fahren Sie auch nach Südtirol oder Österreich?", a: "Ja, regelmäßig. Maut, Brenner-Gebühren und Vignetten sind in Ihrem Festpreis bereits enthalten – es kommen keine Kosten dazu." },
    { q: "Ist ein Transfer zum Flughafen München möglich?", a: "Ja. Wir holen Ihre Gruppe zu Hause, an der Schule oder am Hotel ab und stimmen die Abholzeit mit Puffer auf Ihren Flug ab." },
    { q: "Können wir ein Skilager mit Ausrüstung buchen?", a: "Ja. Unsere Reisebusse haben große Kofferräume; für sehr viel Ausrüstung planen wir bei Bedarf einen Anhänger oder ein zweites Fahrzeug ein." },
    { q: "Wo steigt die Gruppe in München zu?", a: "Zum Beispiel am ZOB Hackerbrücke, am Hauptbahnhof oder direkt an Ihrer Einrichtung. Wir prüfen die Zufahrt vor der Bestätigung." },
  ],
  links: serviceLinks("München"),
  ctaTitle: "Bus in München anfragen",
  ctaText: "Datum, Strecke und Personenzahl genügen – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenKoeln: LandingContent = {
  slug: "busunternehmen-koeln",
  seoTitle: "Busunternehmen Köln | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Köln mieten: Karnevalsfahrten, Klassenfahrten, Messeshuttles zur Koelnmesse und Gruppenreisen. Festpreis von Metropol Tours anfordern.",
  h1: "Busunternehmen in Köln",
  heroKicker: "Busfahrten ab Köln · Rheinland, Benelux & Europa",
  heroText:
    "Von der Karnevalsfahrt über die Klassenfahrt an die Mosel bis zum Messeshuttle zur Koelnmesse: Wir stellen moderne Reisebusse mit Fahrer für Gruppen in Köln und dem Rheinland – mit verbindlichem Festpreis.",
  heroImage: "heroBus",
  heroAlt: "Reisebus von Metropol Tours bei einer Gruppenfahrt ab Köln",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Zustiege in Köln & Rheinland", "Benelux-Strecken im Alltag"],
  why: [
    {
      title: "Rheinland-Routen im Schlaf",
      text: "A1, A3, A4: Von Köln aus erreichen wir die Eifel, die Mosel, Aachen, das Ruhrgebiet und die Benelux-Staaten ohne Umwege. Belgien- und Niederlandefahrten sind für uns Alltag.",
    },
    {
      title: "Karneval & Großevents",
      text: "Wenn eine Million Menschen feiern, ist Buslogistik Erfahrungssache. Wir planen Zustiege und Abfahrtszeiten so, dass Ihre Gruppe auch an den tollen Tagen entspannt reist.",
    },
    {
      title: "Messekompetenz",
      text: "Koelnmesse ist einer der größten Messeplätze Europas. Wir organisieren Shuttles zwischen Hotels, Messe und Innenstadt – auch im Pendelbetrieb mit mehreren Bussen.",
    },
    {
      title: "Verbindlicher Festpreis",
      text: "Fahrer, Kilometer, Maut und gesetzliche Pausen sind im Angebot enthalten. Keine Nachberechnung nach der Fahrt.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Köln – von der Eifel bis Amsterdam",
      body: [
        "Köln liegt ideal: In zwei Stunden ist Ihre Gruppe in Amsterdam oder Brüssel, in einer Stunde an der Mosel oder in der Eifel. Diese Lage macht die Stadt zu einem der besten Ausgangspunkte für Tagesfahrten und Kurzreisen im Westen.",
        "In der Stadt selbst kennen wir die Haltepunkte: Die Zufahrt zu Hotels am Rhein, die Busspuren rund um den Dom und die besten Ausweichrouten, wenn der Ring wieder einmal dicht ist.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Köln",
          text: "Busbahnhof am Flughafen Köln/Bonn, Messe Deutz, Hauptbahnhof (Breslauer Platz), LANXESS arena sowie direkte Abholungen an Schulen, Vereinsheimen und Firmen in allen Veedeln.",
        },
        {
          h3: "Typische Ziele ab Köln",
          text: "Eifel, Mosel, Aachen, Amsterdam, Brüssel, Paris, Phantasialand und das Ruhrgebiet. Mehrtägig fahren wir Richtung Alpen, Adria und Normandie.",
        },
      ],
    },
    {
      h2: "Karnevalsfahrten, Schulen und Firmen im Rheinland",
      body: [
        "Karnevalsvereine gehören zu unseren treuesten Gruppen: Sitzungsfahrten, Umzüge und mehrtägige Reisen der KG planen wir Jahr für Jahr – oft mit denselben Fahrern, die die Gruppe inzwischen kennt.",
        "Für Schulen und Unternehmen im Rheinland organisieren wir alles von der Tagesfahrt bis zur mehrtägigen Studien- oder Incentive-Reise, inklusive aller Unterlagen für Träger und Verwaltung.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Karneval & Vereinsleben", text: "Sitzungen, Umzüge und Vereinsreisen – mit Platz für Garderobe und Instrumente." },
    { title: "Messe Köln", text: "Hotel-Shuttles und Gruppenanreisen zur Koelnmesse, auch pendelnd." },
    { title: "Klassenfahrten", text: "Eifel, Mosel oder Amsterdam: Tages- und Studienfahrten ab Kölner Schulen." },
    { title: "Flughafentransfer CGN", text: "Gruppentransfers zum Flughafen Köln/Bonn und nach Düsseldorf – auch nachts." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Köln fahren wir durchs gesamte Rheinland und in die Benelux-Staaten. Häufig angefragt werden Zustiege aus:",
    cities: ["Köln", "Leverkusen", "Bergisch Gladbach", "Hürth", "Frechen", "Brühl", "Bonn", "Siegburg", "Troisdorf", "Neuss"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Benelux-Erfahrung: Amsterdam & Brüssel im Alltag",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Messe-Shuttles auch im Pendelbetrieb",
    "Feste Fahrer für Stammgruppen möglich",
    "Rechnung auf Vereins-, Schul- oder Firmenadresse",
  ],
  faqs: [
    { q: "Wie miete ich in Köln einen Bus?", a: "Über das Anfrageformular oder per E-Mail: Datum, Abfahrtsort, Ziel und Personenzahl genügen. Das Festpreisangebot kommt meist am selben Werktag." },
    { q: "Fahren Sie auch zum Karneval?", a: "Ja – Sitzungsfahrten und Umzüge gehören zu unseren häufigsten Anfragen aus dem Rheinland. In der Session empfehlen wir frühzeitiges Buchen." },
    { q: "Bieten Sie Shuttles zur Koelnmesse an?", a: "Ja, zwischen Hotels, Messegelände und Innenstadt – für große Gruppen auch im Pendelbetrieb mit mehreren Fahrzeugen." },
    { q: "Ist Amsterdam als Tagesfahrt machbar?", a: "Ja. Von Köln aus ist Amsterdam eine klassische Tagesfahrt. Wir planen Lenkzeiten und Halte so, dass genug Zeit vor Ort bleibt." },
    { q: "Wo kann der Bus in Köln zusteigen lassen?", a: "Zum Beispiel an der Messe Deutz, am Busbahnhof Flughafen oder direkt an Ihrer Einrichtung, sofern die Zufahrt busgeeignet ist. Wir prüfen das vorab." },
  ],
  links: serviceLinks("Köln"),
  ctaTitle: "Bus in Köln anfragen",
  ctaText: "Senden Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenFrankfurt: LandingContent = {
  slug: "busunternehmen-frankfurt",
  seoTitle: "Busunternehmen Frankfurt | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Frankfurt am Main mieten: Messeshuttles, Flughafentransfers FRA, Firmenfahrten und Gruppenreisen. Festpreis von Metropol Tours.",
  h1: "Busunternehmen in Frankfurt am Main",
  heroKicker: "Busfahrten ab Frankfurt · Messe, Airport & Rhein-Main",
  heroText:
    "In der Messe- und Finanzmetropole zählt Pünktlichkeit: Ob Messeshuttle, Gruppentransfer zum Flughafen FRA oder Firmenausflug in den Taunus – wir stellen Reisebusse mit Fahrer für Ihre Gruppe in Frankfurt, mit Festpreis und persönlicher Disposition.",
  heroImage: "business",
  heroAlt: "Reisebus von Metropol Tours auf Firmenfahrt ab Frankfurt",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Messe- & Airport-Logistik", "Antwort meist am selben Werktag"],
  why: [
    {
      title: "Messe Frankfurt im Fokus",
      text: "Buchmesse, IAA-Nachfolger, Ambiente: Zu den großen Messen ist Frankfurt voll. Wir organisieren Hotel-Shuttles und Gruppenanreisen mit festen Zeitfenstern – auch kurzfristig in der Messesaison.",
    },
    {
      title: "Airport FRA: Europas Drehkreuz",
      text: "Gruppentransfers zum Flughafen Frankfurt gehören zu unseren Standardfahrten aus der Region. Abholzeit mit Puffer, Gepäckraum für Langstreckenreisegepäck, auch nachts und frühmorgens.",
    },
    {
      title: "Business-tauglich",
      text: "Firmenkunden bekommen Angebot, Rechnung und Ansprechpartner in der Form, die Einkauf und Buchhaltung erwarten – inklusive Rahmenvereinbarungen für wiederkehrende Fahrten.",
    },
    {
      title: "Rhein-Main vernetzt",
      text: "Wiesbaden, Mainz, Darmstadt, Offenbach: Wir holen Gruppen an mehreren Punkten der Region ab und fahren als einen Zubringer ein.",
    },
  ],
  sections: [
    {
      h2: "Buslogistik für Messestadt und Finanzplatz",
      body: [
        "Frankfurt ist kompakt, aber anspruchsvoll: Das Bankenviertel hat kaum Halteflächen, das Messegelände eigene Zufahrtsregeln. Wir wählen Haltepunkte, die funktionieren – und stimmen sie mit Hotels und Veranstaltern ab.",
        "Über A3, A5 und A66 erreichen wir ab Frankfurt den Taunus, das Rheingau, Heidelberg, Würzburg und das Ruhrgebiet. Für Fernreisen planen wir Fahrerteams, damit auch weite Ziele ohne Nachtfahrt der Gruppe erreichbar sind.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Frankfurt",
          text: "Messe Frankfurt (Torhaus/Galleria), Hauptbahnhof (Fernbus-Halteplätze), Flughafen FRA Terminal 1/2 sowie Hotels und Firmensitze in Bankenviertel, Sachsenhausen und dem gesamten Rhein-Main-Gebiet.",
        },
        {
          h3: "Typische Ziele ab Frankfurt",
          text: "Rheingau, Heidelberg, Rothenburg, Strasbourg, Luxemburg, Paris und das Ruhrgebiet. Mehrtägig: Alpen, Adria, Amsterdam und Prag.",
        },
      ],
    },
    {
      h2: "Firmenfahrten und Eventlogistik am Main",
      body: [
        "Für Unternehmen aus Banken, Beratung und Industrie fahren wir Betriebsausflüge, Teamevents und Delegationsfahrten – diskret, pünktlich und mit Fahrzeugen, die einem Geschäftstermin angemessen sind.",
        "Schulen und Vereine aus der Region buchen uns für Klassenfahrten, Auswärtsfahrten und Chor- oder Orchestertouren mit Platz für Instrumente und Ausrüstung.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Messe & Kongress", text: "Shuttles zwischen Hotels, Messe und Innenstadt zu allen großen Fachmessen." },
    { title: "Firmenevents", text: "Betriebsausflüge, Incentives und Delegationsfahrten mit Business-Anspruch." },
    { title: "Flughafentransfer FRA", text: "Gruppentransfers zu allen Terminals – abgestimmt auf Ihre Flugzeiten, rund um die Uhr." },
    { title: "Klassenfahrten", text: "Tagesfahrten in Taunus und Odenwald bis zu Studienfahrten nach Paris oder Prag." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Frankfurt fahren wir in der gesamten Rhein-Main-Region und darüber hinaus. Häufig angefragt werden Zustiege aus:",
    cities: ["Frankfurt", "Offenbach", "Wiesbaden", "Mainz", "Darmstadt", "Hanau", "Bad Homburg", "Rüsselsheim", "Aschaffenburg", "Gießen"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Messe- und Airport-Erfahrung",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Rahmenverträge für Firmenkunden möglich",
    "Fahrerteam bei Fernreisen",
    "Rechnung auf Firmen-, Schul- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wie buche ich einen Messeshuttle in Frankfurt?", a: "Nennen Sie uns Hotel, Messe, Termine und Personenzahl – wir erstellen einen Shuttleplan mit festen Abfahrtszeiten und einem Festpreis." },
    { q: "Fahren Sie nachts zum Flughafen FRA?", a: "Ja. Transfers zum Flughafen sind zu jeder Uhrzeit möglich; wir planen die Abholzeit mit ausreichend Puffer für Check-in und Sicherheitskontrolle." },
    { q: "Können wir eine Gruppe an mehreren Orten einsammeln?", a: "Ja. Zubringer mit mehreren Zustiegen in der Rhein-Main-Region sind möglich – wir planen die Route so, dass die Gesamtfahrzeit für alle passt." },
    { q: "Gibt es Konditionen für wiederkehrende Firmenfahrten?", a: "Ja. Für regelmäßige Fahrten vereinbaren wir Rahmenkonditionen und eine zentrale Abrechnung." },
    { q: "Wo kann der Bus in der Frankfurter Innenstadt halten?", a: "Im Bankenviertel sind Halteflächen begrenzt; wir wählen erlaubte Haltepunkte in Hotelnähe und stimmen sie mit Ihnen und dem Hotel ab." },
  ],
  links: serviceLinks("Frankfurt"),
  ctaTitle: "Bus in Frankfurt anfragen",
  ctaText: "Datum, Strecke und Personenzahl genügen – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenStuttgart: LandingContent = {
  slug: "busunternehmen-stuttgart",
  seoTitle: "Busunternehmen Stuttgart | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Stuttgart mieten: Firmenfahrten, Klassenfahrten, Transfers zum Flughafen STR und Gruppenreisen. Festpreis von Metropol Tours anfordern.",
  h1: "Busunternehmen in Stuttgart",
  heroKicker: "Busfahrten ab Stuttgart · Schwäbische Alb & Europa",
  heroText:
    "Von der Firmenfahrt ins Remstal über die Klassenfahrt auf die Schwäbische Alb bis zur Vereinsreise zum Bodensee: Wir stellen Reisebusse mit Fahrer für Gruppen in Stuttgart und Baden-Württemberg – mit verbindlichem Festpreis.",
  heroImage: "journey",
  heroAlt: "Reisebus von Metropol Tours unterwegs ab Stuttgart",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Zustiege in Stadt & Region", "Alpenrouten über die Schweiz möglich"],
  why: [
    {
      title: "Kessel-Erfahrung",
      text: "Stuttgarts Topografie ist für Busse anspruchsvoll: Steigungen, enge Kurven, Baustellen. Unsere Fahrer kennen die busgeeigneten Zufahrten – und welche Straßen man mit 13,5 Metern besser meidet.",
    },
    {
      title: "Industrieregion mit Anspruch",
      text: "Automobil, Maschinenbau, Mittelstand: Firmenkunden aus der Region erwarten pünktliche Fahrzeuge und saubere Abrechnung. Genau so arbeiten wir – vom Werkshuttle bis zur Incentive-Reise.",
    },
    {
      title: "Bodensee, Alpen, Elsass",
      text: "Über A8 und A81 erreichen wir ab Stuttgart den Bodensee, die Schweiz, das Elsass und die Alpen. Grenzgebühren und Vignetten kalkulieren wir direkt in Ihr Angebot ein.",
    },
    {
      title: "Verlässliche Disposition",
      text: "Sie sprechen mit derselben Person von der Anfrage bis zur Durchführung. Kein Portal, kein Weiterverkauf.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Stuttgart – zwischen Alb und Bodensee",
      body: [
        "Stuttgart liegt verkehrsgünstig zwischen Schwarzwald, Schwäbischer Alb und Bodensee. Tagesfahrten in die Region sind ebenso unser Alltag wie mehrtägige Reisen nach Italien, Österreich oder Frankreich.",
        "In der Stadt selbst planen wir Zustiege realistisch: Der Stuttgarter Kessel erlaubt nicht überall Halte, und Baustellen ändern sich wöchentlich. Wir prüfen jeden Zustieg vor der Bestätigung.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Stuttgart",
          text: "Flughafen Stuttgart (STR), Messe Stuttgart, Hauptbahnhof-Umfeld sowie direkte Abholungen an Schulen, Firmen und Vereinsheimen in Stuttgart und den umliegenden Landkreisen.",
        },
        {
          h3: "Typische Ziele ab Stuttgart",
          text: "Bodensee, Schwarzwald, Schwäbische Alb, Strasbourg, Europa-Park Rust, Zürich, München und Südtirol. Mehrtägig: Gardasee, Adria und Paris.",
        },
      ],
    },
    {
      h2: "Für Firmen, Schulen und Vereine in Baden-Württemberg",
      body: [
        "Viele unserer Stammkunden in der Region sind Industrieunternehmen: Werksführungen, Teamevents und Messetransfers laufen bei uns mit festen Ansprechpartnern und Rahmenkonditionen.",
        "Schulen buchen uns für Wandertage, Skilager und Studienfahrten; Vereine für Auswärtsfahrten und mehrtägige Touren. Instrumente, Sportgeräte und Sondergepäck planen wir von Anfang an mit ein.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Firmen & Industrie", text: "Werkstransfers, Betriebsausflüge und Incentives mit Business-Standard." },
    { title: "Messe Stuttgart", text: "Gruppenanreisen und Shuttles zum Messegelände am Flughafen." },
    { title: "Klassenfahrten", text: "Alb, Bodensee oder Europa-Park: Tages- und Studienfahrten für Schulen." },
    { title: "Flughafentransfer STR", text: "Gruppentransfers zum Flughafen Stuttgart – abgestimmt auf Ihre Flugzeiten." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Stuttgart fahren wir durch ganz Baden-Württemberg und in die Nachbarländer. Häufig angefragt werden Zustiege aus:",
    cities: ["Stuttgart", "Ludwigsburg", "Esslingen", "Böblingen", "Sindelfingen", "Waiblingen", "Göppingen", "Reutlingen", "Tübingen", "Heilbronn"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Vignetten",
    "Erfahrung mit Industrie- und Firmenkunden",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Grenzrouten Schweiz/Frankreich im Alltag",
    "Unterlagen für Schulträger vorab",
    "Rechnung auf Firmen-, Schul- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wie miete ich in Stuttgart einen Reisebus?", a: "Über das Anfrageformular oder per E-Mail: Datum, Abfahrtsort, Ziel und Personenzahl genügen. Das Festpreisangebot folgt meist am selben Werktag." },
    { q: "Fahren Sie Gruppen zum Europa-Park Rust?", a: "Ja, das ist eine unserer häufigsten Tagesfahrten ab Stuttgart – für Schulen, Vereine und Firmen gleichermaßen." },
    { q: "Ist eine Fahrt in die Schweiz möglich?", a: "Ja. Wir kalkulieren die Schweizer Vignette und eventuelle Gebühren direkt in Ihr Angebot ein – es kommen keine Kosten dazu." },
    { q: "Kann der Bus auch steile oder enge Straßen fahren?", a: "Unsere Fahrer kennen die busgeeigneten Routen im Stuttgarter Raum. Wir prüfen jeden Zustieg vorab und schlagen bei Bedarf einen besser erreichbaren Haltepunkt vor." },
    { q: "Gibt es Konditionen für regelmäßige Werkstransfers?", a: "Ja. Für wiederkehrende Firmenfahrten vereinbaren wir Rahmenkonditionen und eine zentrale monatliche Abrechnung." },
  ],
  links: serviceLinks("Stuttgart"),
  ctaTitle: "Bus in Stuttgart anfragen",
  ctaText: "Senden Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenDuesseldorf: LandingContent = {
  slug: "busunternehmen-duesseldorf",
  seoTitle: "Busunternehmen Düsseldorf | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Düsseldorf mieten: Messeshuttles, Japan- und Firmenfahrten, Klassenfahrten und Transfers zum DUS. Festpreis von Metropol Tours.",
  h1: "Busunternehmen in Düsseldorf",
  heroKicker: "Busfahrten ab Düsseldorf · Rhein, Ruhr & Benelux",
  heroText:
    "Modestadt, Messestadt, Tor zu den Niederlanden: Ob Messeshuttle zur drupa-Nachfolgemesse, Klassenfahrt ans Niederrhein-Umland oder Vereinsreise nach Amsterdam – wir stellen Reisebusse mit Fahrer für Gruppen in Düsseldorf, mit Festpreis.",
  heroImage: "busReal",
  heroAlt: "Reisebus von Metropol Tours auf Fahrt ab Düsseldorf",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Messe- & Airport-Nähe", "Benelux-Fahrten im Alltag"],
  why: [
    {
      title: "Messe Düsseldorf im Blick",
      text: "boot, K, MEDICA: Die großen Fachmessen ziehen Gruppen aus ganz Europa in die Stadt. Wir organisieren Hotel-Shuttles und Gruppenanreisen mit festen Zeitfenstern – auch kurzfristig in der Saison.",
    },
    {
      title: "Benelux vor der Tür",
      text: "Von Düsseldorf ist Venlo in unter einer Stunde erreicht, Amsterdam in gut zwei. Niederlande-Fahrten gehören hier zu unseren häufigsten Buchungen – für Shopping-Gruppen wie für Vereine.",
    },
    {
      title: "Rhein-Ruhr vernetzt",
      text: "Duisburg, Essen, Neuss, Mönchengladbach: Wir sammeln Gruppen an mehreren Punkten der Region ein und fahren als einen Zubringer – ideal für Firmen mit mehreren Standorten.",
    },
    {
      title: "Festpreis statt Schätzung",
      text: "Fahrer, Kilometer, Maut und Pausen sind im Angebot enthalten. Was wir bestätigen, gilt – auch nach der Fahrt.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Düsseldorf – vom Rhein nach Amsterdam",
      body: [
        "Düsseldorf verbindet Rhein und Ruhr: Über A3, A52 und A57 erreichen wir das Ruhrgebiet, den Niederrhein und die Niederlande ohne Umwege. Diese Lage macht die Stadt zum idealen Ausgangspunkt für Tagesfahrten im Westen.",
        "In der Stadt kennen wir die Haltepunkte: von der Altstadt über das Medienhafen-Viertel bis zum Messegelände. Für Gruppen mit Hotel am Rhein wählen wir Zufahrten, die für Busse erlaubt und für Gäste bequem sind.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Düsseldorf",
          text: "Messe Düsseldorf, Flughafen DUS, Hauptbahnhof (Fernbus-Haltepunkte), Medienhafen sowie direkte Abholungen an Hotels, Schulen und Firmen in allen Stadtteilen.",
        },
        {
          h3: "Typische Ziele ab Düsseldorf",
          text: "Amsterdam, Rotterdam, Brüssel, Maastricht, Niederrhein, Eifel und das Ruhrgebiet. Mehrtägig: Paris, Normandie, Alpen und Adria.",
        },
      ],
    },
    {
      h2: "Messen, Firmen und Vereine am Rhein",
      body: [
        "Internationale Fachbesuchergruppen gehören in Düsseldorf zum Messealltag: Wir fahren Delegationen zwischen Airport, Hotels und Messegelände – mit Fahrern, die Englisch sprechen und den Ablauf kennen.",
        "Vereine und Schulen aus der Region buchen uns für Auswärtsfahrten, Klassenfahrten und Ausflüge ans Meer. Für Karnevalsfahrten im Rheinland empfehlen wir frühzeitiges Buchen.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Messe Düsseldorf", text: "Shuttles zwischen Airport, Hotels und Messegelände zu allen Fachmessen." },
    { title: "Benelux-Touren", text: "Amsterdam, Rotterdam und Brüssel als Tages- oder Mehrtagesfahrt." },
    { title: "Firmenfahrten", text: "Betriebsausflüge, Delegationen und Transfers für Unternehmen am Rhein." },
    { title: "Flughafentransfer DUS", text: "Gruppentransfers zum Flughafen Düsseldorf – rund um die Uhr, mit Flugpuffer." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Düsseldorf fahren wir durchs Rheinland, ins Ruhrgebiet und in die Benelux-Staaten. Häufig angefragt werden Zustiege aus:",
    cities: ["Düsseldorf", "Neuss", "Ratingen", "Duisburg", "Mönchengladbach", "Krefeld", "Meerbusch", "Erkrath", "Mettmann", "Wuppertal"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Messe-Shuttles mit festen Zeitfenstern",
    "Benelux-Routen im Alltag",
    "Englischsprachige Fahrer für Delegationen",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Rechnung auf Firmen-, Schul- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wie buche ich einen Messeshuttle in Düsseldorf?", a: "Nennen Sie uns Messe, Hotel, Termine und Personenzahl. Wir erstellen einen Shuttleplan mit festen Abfahrtszeiten und verbindlichem Festpreis." },
    { q: "Fahren Sie internationale Gruppen vom Flughafen DUS?", a: "Ja, regelmäßig. Für internationale Delegationen stellen wir auf Wunsch englischsprachige Fahrer und kümmern uns um die Abstimmung mit den Hotels." },
    { q: "Ist Amsterdam als Tagesfahrt realistisch?", a: "Ja. Von Düsseldorf aus ist Amsterdam eine klassische Tagesfahrt mit genügend Aufenthaltszeit vor Ort – wir planen Lenkzeiten entsprechend." },
    { q: "Können wir mit mehreren Zustiegen im Rhein-Ruhr-Gebiet fahren?", a: "Ja. Zubringerrouten mit Zustiegen in Duisburg, Neuss oder Mönchengladbach planen wir so, dass die Gesamtfahrzeit für alle Gruppenmitglieder passt." },
    { q: "Was kostet ein Bus ab Düsseldorf?", a: "Das hängt von Strecke, Dauer und Fahrzeuggröße ab. Sie erhalten immer einen verbindlichen Festpreis – ohne nachträgliche Zusatzkosten." },
  ],
  links: serviceLinks("Düsseldorf"),
  ctaTitle: "Bus in Düsseldorf anfragen",
  ctaText: "Datum, Strecke und Personenzahl genügen – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenLeipzig: LandingContent = {
  slug: "busunternehmen-leipzig",
  seoTitle: "Busunternehmen Leipzig | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Leipzig mieten: Messeshuttles, Klassenfahrten, Vereinsfahrten und Gruppenreisen nach Prag & Dresden. Festpreis von Metropol Tours.",
  h1: "Busunternehmen in Leipzig",
  heroKicker: "Busfahrten ab Leipzig · Mitteldeutschland & Prag",
  heroText:
    "Messestadt, Musikstadt, Tor nach Böhmen: Ob Kongress-Shuttle zur Leipziger Messe, Chorreise nach Prag oder Klassenfahrt ins Erzgebirge – wir stellen Reisebusse mit Fahrer für Gruppen in Leipzig, mit verbindlichem Festpreis.",
  heroImage: "group",
  heroAlt: "Reisebus von Metropol Tours auf Gruppenfahrt ab Leipzig",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Prag in Tagesreichweite", "Antwort meist am selben Werktag"],
  why: [
    {
      title: "Prag ist nah",
      text: "Von Leipzig sind es nur gut zweieinhalb Stunden nach Prag. Studienfahrten, Chortouren und Städtereisen nach Böhmen gehören hier zu unseren häufigsten Buchungen – inklusive aller tschechischen Mautgebühren im Festpreis.",
    },
    {
      title: "Musik- und Chortourismus",
      text: "Thomanerchor, Gewandhaus, Bachfest: Leipzigs Musiktradition zieht Chöre und Orchester aus ganz Europa an. Wir fahren Ensembles mit Instrumenten – vom Cello-Transport bis zum Kontrabass.",
    },
    {
      title: "Messe & Kongress",
      text: "Leipziger Messe und Congress Center: Wir organisieren Shuttles und Gruppenanreisen für Veranstalter und Besuchergruppen – auch pendelnd mit mehreren Fahrzeugen.",
    },
    {
      title: "Mitteldeutschland vernetzt",
      text: "Halle, Chemnitz, Dessau, Magdeburg: Wir sammeln Gruppen an mehreren Punkten der Region ein und fahren als einen Zubringer.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Leipzig – zwischen Messe und Musik",
      body: [
        "Leipzig liegt am Kreuz von A9, A14 und A38: Dresden, Berlin, Erfurt und Prag sind alle in gut zwei Stunden erreichbar. Für Tagesfahrten bieten sich Erzgebirge, Sächsische Schweiz und das Harzvorland an.",
        "In der Stadt kennen wir die Haltepunkte rund um den Ring, das Völkerschlachtdenkmal und die Messe. Für Kongresshotels stimmen wir Zufahrten direkt mit den Häusern ab.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Leipzig",
          text: "Leipziger Messe, Hauptbahnhof (Fernbus-Haltepunkte), Congress Center, Völkerschlachtdenkmal sowie direkte Abholungen an Schulen, Hotels und Firmen.",
        },
        {
          h3: "Typische Ziele ab Leipzig",
          text: "Prag, Dresden, Berlin, Weimar, Erfurt, Sächsische Schweiz und der Harz. Mehrtägig: Wien, Krakau, Amsterdam und die Alpen.",
        },
      ],
    },
    {
      h2: "Chöre, Schulen und Vereine in Mitteldeutschland",
      body: [
        "Für Chöre und Orchester planen wir Fahrten mit besonderem Augenmerk auf Instrumente: Kofferraumkapazität, Verladung und Zeiten für Aufbau und Probe stimmen wir vorab mit der Ensembleleitung ab.",
        "Schulen aus Leipzig und Umgebung buchen uns für Klassenfahrten ins Erzgebirge, Studienfahrten nach Prag und Wandertage. Alle Unterlagen für Schulträger stellen wir vorab bereit.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Chor- & Orchesterreisen", text: "Touren für Ensembles mit Instrumententransport und Probenplanung." },
    { title: "Messe Leipzig", text: "Shuttles und Gruppenanreisen zu Messe und Congress Center." },
    { title: "Klassenfahrten", text: "Erzgebirge, Sächsische Schweiz oder Prag: Tages- und Studienfahrten." },
    { title: "Städtereisen", text: "Prag, Dresden, Berlin und Weimar als Tages- oder Kurzreise." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Leipzig fahren wir durch Mitteldeutschland und nach Böhmen. Häufig angefragt werden Zustiege aus:",
    cities: ["Leipzig", "Halle (Saale)", "Chemnitz", "Dessau-Roßlau", "Merseburg", "Bitterfeld", "Delitzsch", "Torgau", "Grimma", "Wurzen"],
  },
  advantages: [
    "Festpreis inklusive Fahrer und Tschechien-Maut",
    "Erfahrung mit Chören und Orchestern",
    "Prag-Routen im Alltag",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Unterlagen für Schulträger vorab",
    "Rechnung auf Schul-, Vereins- oder Firmenadresse",
  ],
  faqs: [
    { q: "Wie miete ich in Leipzig einen Reisebus?", a: "Über das Anfrageformular oder per E-Mail: Datum, Abfahrtsort, Ziel und Personenzahl genügen. Das Angebot folgt meist am selben Werktag." },
    { q: "Fahren Sie Chöre mit Instrumenten?", a: "Ja, regelmäßig. Wir planen die Kofferraumkapazität nach Ihrer Instrumentenliste und stimmen Lade- und Probenzeiten mit der Ensembleleitung ab." },
    { q: "Ist Prag als Tagesfahrt möglich?", a: "Ja. Von Leipzig ist Prag in gut zweieinhalb Stunden erreichbar – genug Zeit für eine ausgiebige Stadtbesichtigung. Die tschechische Maut ist im Festpreis enthalten." },
    { q: "Bieten Sie Shuttles zur Leipziger Messe an?", a: "Ja, für Veranstalter und Besuchergruppen – für große Gruppen auch im Pendelbetrieb mit mehreren Fahrzeugen." },
    { q: "Können wir aus Halle oder Chemnitz zusteigen?", a: "Ja. Zubringerrouten mit mehreren Zustiegen in Mitteldeutschland sind möglich – wir planen die Route so, dass die Gesamtfahrzeit für alle passt." },
  ],
  links: serviceLinks("Leipzig"),
  ctaTitle: "Bus in Leipzig anfragen",
  ctaText: "Senden Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenDresden: LandingContent = {
  slug: "busunternehmen-dresden",
  seoTitle: "Busunternehmen Dresden | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Dresden mieten: Städtereisen, Klassenfahrten in die Sächsische Schweiz, Prag-Touren und Gruppenreisen. Festpreis von Metropol Tours.",
  h1: "Busunternehmen in Dresden",
  heroKicker: "Busfahrten ab Dresden · Elbflorenz, Böhmen & Europa",
  heroText:
    "Zwischen Elbe, Erzgebirge und der tschechischen Grenze: Ob Klassenfahrt in die Sächsische Schweiz, Chorreise zur Frauenkirche oder Städtetour nach Prag – wir stellen Reisebusse mit Fahrer für Gruppen in Dresden, mit Festpreis.",
  heroImage: "metropolHero",
  heroAlt: "Reisebus von Metropol Tours unterwegs ab Dresden",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Sächsische Schweiz im Alltag", "Prag ab 2 Stunden"],
  why: [
    {
      title: "Böhmen vor der Haustür",
      text: "Prag liegt von Dresden aus näher als Berlin. Tschechien-Fahrten – von der Tagestour bis zur mehrtägigen Studienreise – gehören hier zu unserem Kerngeschäft, inklusive aller Mautgebühren im Festpreis.",
    },
    {
      title: "Kultourismus mit Anspruch",
      text: "Semperoper, Zwinger, Frauenkirche: Kulturreisegruppen erwarten präzise Zeitpläne zwischen Anfahrt, Führung und Hotel. Wir planen mit Puffern, damit kein Konzertbeginn verpasst wird.",
    },
    {
      title: "Sächsische Schweiz im Detail",
      text: "Kurort Rathen, Bastei, Königstein: Die engen Straßen der Region sind nicht überall busgeeignet. Wir kennen die erlaubten Zufahrten und die besten Haltepunkte für Wandergruppen.",
    },
    {
      title: "Persönliche Betreuung",
      text: "Von der Anfrage bis zur Rückfahrt haben Sie eine feste Ansprechperson – keine Plattform, kein Weiterverkauf.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Dresden – Kultur, Elbe und Erzgebirge",
      body: [
        "Dresden ist eine der beliebtesten Reisebus-Destinationen Deutschlands – und ein idealer Ausgangspunkt: Sächsische Schweiz, Meißen, Moritzburg und das Erzgebirge liegen in Tagesreichweite, Prag und Berlin in gut zwei Stunden.",
        "In der Altstadt gelten strikte Zufahrtsregeln. Wir kennen die offiziellen Bushaltepunkte und stimmen Zustiege so, dass Ihre Gruppe kurze Wege hat – zum Beispiel für Konzertbesuche am Abend.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Dresden",
          text: "Bushaltepunkte an der Altstadt, Hauptbahnhof, Flughafen Dresden (DRS) sowie direkte Abholungen an Hotels, Schulen und Vereinsheimen in allen Stadtteilen.",
        },
        {
          h3: "Typische Ziele ab Dresden",
          text: "Prag, Sächsische Schweiz, Meißen, Erzgebirge, Berlin, Leipzig und Görlitz. Mehrtägig: Wien, Krakau und die Adria.",
        },
      ],
    },
    {
      h2: "Kulturgruppen, Schulen und Wanderfreunde",
      body: [
        "Kulturreisegruppen buchen uns für mehrtägige Programme mit Opernbesuch, Schlossführungen und Tagesausflügen. Wir stimmen Fahrzeiten mit Ihrem Reiseleiter ab und bleiben während der gesamten Reise erreichbar.",
        "Wandergruppen und Schulen schätzen unsere Ortskenntnis in der Sächsischen Schweiz: Wir wissen, welche Kurorte Busse anfahren dürfen – und wo besser zu- und ausgestiegen wird.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Kulturreisen", text: "Mehrtägige Programme mit Oper, Museen und Schlössern – präzise getaktet." },
    { title: "Prag-Touren", text: "Tagesfahrten und Studienreisen nach Böhmen, Maut inklusive." },
    { title: "Wandergruppen", text: "Sächsische Schweiz und Erzgebirge mit busgeeigneten Haltepunkten." },
    { title: "Klassenfahrten", text: "Von der Tagesfahrt nach Meißen bis zur Studienfahrt nach Krakau." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Dresden fahren wir durch Sachsen und nach Tschechien. Häufig angefragt werden Zustiege aus:",
    cities: ["Dresden", "Radebeul", "Meißen", "Pirna", "Freital", "Radeberg", "Kamenz", "Bautzen", "Görlitz", "Chemnitz"],
  },
  advantages: [
    "Festpreis inklusive Fahrer und Tschechien-Maut",
    "Ortskenntnis Sächsische Schweiz",
    "Erfahrung mit Kultur- und Musikgruppen",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Prag in Tagesreichweite",
    "Rechnung auf Schul-, Vereins- oder Firmenadresse",
  ],
  faqs: [
    { q: "Wie miete ich in Dresden einen Bus?", a: "Über das Anfrageformular oder per E-Mail: Datum, Abfahrtsort, Ziel und Personenzahl genügen. Sie erhalten meist am selben Werktag ein Festpreisangebot." },
    { q: "Wo kann der Bus in der Dresdner Altstadt halten?", a: "Die Altstadt hat strikte Zufahrtsregeln mit offiziellen Bushaltepunkten. Wir wählen den Haltepunkt mit dem kürzesten Fußweg zu Ihrem Programm." },
    { q: "Ist Prag als Tagesfahrt machbar?", a: "Ja. Von Dresden sind es nur etwa zwei Stunden nach Prag – die tschechische Maut ist in Ihrem Festpreis bereits enthalten." },
    { q: "Können Wandergruppen in der Sächsischen Schweiz abgeholt werden?", a: "Ja. Wir kennen die busgeeigneten Zufahrten in Rathen, an der Bastei und in den Kurorten und planen Haltepunkte entsprechend." },
    { q: "Fahren Sie auch abendliche Konzertbesuche?", a: "Ja. Wir stimmen die Rückfahrtszeit auf das Veranstaltungsende ab und warten mit dem Bus in Haltepunktnähe." },
  ],
  links: serviceLinks("Dresden"),
  ctaTitle: "Bus in Dresden anfragen",
  ctaText: "Datum, Strecke und Personenzahl genügen – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenNuernberg: LandingContent = {
  slug: "busunternehmen-nuernberg",
  seoTitle: "Busunternehmen Nürnberg | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Nürnberg mieten: Messeshuttles, Klassenfahrten nach Franken, Vereinsfahrten und Gruppenreisen. Festpreis von Metropol Tours anfordern.",
  h1: "Busunternehmen in Nürnberg",
  heroKicker: "Busfahrten ab Nürnberg · Franken, Bayern & Europa",
  heroText:
    "Fränkische Schweiz, Reichsstadt Rothenburg, Messe Nürnberg: Ob Klassenfahrt, Vereinsausflug oder Firmenshuttle – wir stellen Reisebusse mit Fahrer für Gruppen in Nürnberg und ganz Franken, mit verbindlichem Festpreis.",
  heroImage: "premiumBus",
  heroAlt: "Reisebus von Metropol Tours auf Fahrt ab Nürnberg",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Ganz Franken als Einsatzgebiet", "Antwort meist am selben Werktag"],
  why: [
    {
      title: "Franken im Fokus",
      text: "Fränkische Schweiz, Fichtelgebirge, Maindreieck: Die Region um Nürnberg ist ideales Terrain für Tagesfahrten – und wir kennen die busgeeigneten Zufahrten auch in kleinen Orten.",
    },
    {
      title: "Messe Nürnberg",
      text: "Spielwarenmesse, BioFach, IWA: Die NürnbergMesse zieht Fachgruppen aus aller Welt an. Wir organisieren Hotel-Shuttles und Gruppenanreisen mit festen Zeitfenstern.",
    },
    {
      title: "Drei-Autobahnen-Kreuz",
      text: "A3, A6, A9: Von Nürnberg aus erreichen wir München, Frankfurt, Prag und Leipzig in gut zwei Stunden. Ideal für Gruppen, die aus mehreren Richtungen zusteigen.",
    },
    {
      title: "Verbindlicher Festpreis",
      text: "Fahrer, Kilometer, Maut und Pausen sind im Angebot enthalten – ohne Nachberechnung.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Nürnberg – durch ganz Franken",
      body: [
        "Nürnberg, Fürth und Erlangen bilden das Zentrum einer Region, die für Gruppenfahrten wie gemacht ist: Fachwerkstädte, Biergartenkultur, Wandergebiete und mit Rothenburg ob der Tauber eine der meistbesuchten Altstädte Deutschlands.",
        "In der Stadt kennen wir die Haltepunkte rund um Altstadt, Messe und Hauptbahnhof. Für Gruppen mit Programm in der Kaiserburg oder im Germanischen Nationalmuseum wählen wir Zustiege mit kurzen Wegen.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Nürnberg",
          text: "NürnbergMesse, Hauptbahnhof (Fernbus-Haltepunkte), Flughafen Nürnberg (NUE) sowie direkte Abholungen an Schulen, Hotels und Firmen in Nürnberg, Fürth und Erlangen.",
        },
        {
          h3: "Typische Ziele ab Nürnberg",
          text: "Rothenburg, Fränkische Schweiz, Bamberg, Würzburg, München, Prag und Regensburg. Mehrtägig: Alpen, Adria und Wien.",
        },
      ],
    },
    {
      h2: "Für Schulen, Vereine und die Messewirtschaft",
      body: [
        "Fränkische Schulen buchen uns für Wandertage in der Fränkischen Schweiz ebenso wie für Studienfahrten nach Prag oder München. Alle Unterlagen für Schulträger liefern wir vorab.",
        "Für Veranstalter und Aussteller der NürnbergMesse fahren wir Shuttles zwischen Flughafen, Hotels und Messegelände – auf Wunsch mit englischsprachigen Fahrern.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Messe Nürnberg", text: "Shuttles zwischen Flughafen NUE, Hotels und Messegelände." },
    { title: "Fränkische Schweiz", text: "Tagesfahrten für Wandergruppen, Schulen und Vereine." },
    { title: "Weihnachtsmarkt-Fahrten", text: "Christkindlesmarkt und Adventsprogramme für Gruppen." },
    { title: "Klassenfahrten", text: "Von Bamberg bis Prag: Tages- und Studienfahrten für fränkische Schulen." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Nürnberg fahren wir durch ganz Franken und darüber hinaus. Häufig angefragt werden Zustiege aus:",
    cities: ["Nürnberg", "Fürth", "Erlangen", "Schwabach", "Bamberg", "Bayreuth", "Ansbach", "Forchheim", "Neumarkt", "Roth"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Ortskenntnis in ganz Franken",
    "Messe-Shuttles mit festen Zeitfenstern",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Englischsprachige Fahrer auf Wunsch",
    "Rechnung auf Schul-, Vereins- oder Firmenadresse",
  ],
  faqs: [
    { q: "Wie miete ich in Nürnberg einen Reisebus?", a: "Über das Anfrageformular oder per E-Mail: Datum, Abfahrtsort, Ziel und Personenzahl genügen. Das Angebot folgt meist am selben Werktag." },
    { q: "Fahren Sie Gruppen zum Christkindlesmarkt?", a: "Ja, Adventsfahrten nach Nürnberg gehören im Dezember zu unseren häufigsten Buchungen. Wir empfehlen eine frühzeitige Anfrage ab dem Spätsommer." },
    { q: "Bieten Sie Messeshuttles an?", a: "Ja, zwischen Flughafen, Hotels und NürnbergMesse – mit festen Abfahrtszeiten und auf Wunsch englischsprachigen Fahrern." },
    { q: "Ist die Fränkische Schweiz mit dem Bus erreichbar?", a: "Ja. Wir kennen die busgeeigneten Zufahrten zu den beliebten Wanderzielen und wählen Haltepunkte mit kurzen Wegen." },
    { q: "Können wir aus Fürth oder Erlangen zusteigen?", a: "Ja. Zubringer mit Zustiegen in Nürnberg, Fürth und Erlangen sind möglich – wir planen die Route so, dass sie für alle passt." },
  ],
  links: serviceLinks("Nürnberg"),
  ctaTitle: "Bus in Nürnberg anfragen",
  ctaText: "Senden Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenDortmund: LandingContent = {
  slug: "busunternehmen-dortmund",
  seoTitle: "Busunternehmen Dortmund | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Dortmund mieten: Fanfahrten, Vereinsfahrten, Klassenfahrten und Gruppenreisen im Ruhrgebiet. Festpreis von Metropol Tours anfordern.",
  h1: "Busunternehmen in Dortmund",
  heroKicker: "Busfahrten ab Dortmund · Ruhrgebiet & darüber hinaus",
  heroText:
    "Fußballstadt, Messestadt, Herz des Ruhrgebiets: Ob Fanfahrt zum Auswärtsspiel, Klassenfahrt ins Sauerland oder Firmenausflug an die Küste – wir stellen Reisebusse mit Fahrer für Gruppen in Dortmund, mit Festpreis.",
  heroImage: "heroBus",
  heroAlt: "Reisebus von Metropol Tours auf Fanfahrt ab Dortmund",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Fanfahrten mit Erfahrung", "Ganzes Ruhrgebiet als Einsatzgebiet"],
  why: [
    {
      title: "Fanfahrten sind unser Handwerk",
      text: "Auswärtsfahrten mit Fanclubs gehören in Dortmund zum Wochenende. Wir wissen, wie Fanfahrten ablaufen: feste Treffpunkte, klare Zeiten, Fahrer mit Erfahrung im Umgang mit Fankultur – und Gepäckraum für Banner und Ausrüstung.",
    },
    {
      title: "Ruhrgebiet vernetzt",
      text: "Bochum, Essen, Gelsenkirchen, Hagen: Das Revier ist ein Ballungsraum. Wir sammeln Gruppen an mehreren Punkten ein – ideal für Fanclubs und Firmen mit Mitgliedern in mehreren Städten.",
    },
    {
      title: "Sauerland und Münsterland nah",
      text: "Winterberg, Möhnesee, Münster: Für Tagesfahrten liegt einiges vor der Tür. Mehrtägig fahren wir ans Meer, in die Eifel oder nach Holland.",
    },
    {
      title: "Festpreis ohne Überraschungen",
      text: "Fahrer, Kilometer, Maut und Pausen sind im Angebot enthalten. Was wir bestätigen, gilt.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Dortmund – durchs Revier und weit darüber hinaus",
      body: [
        "Dortmund liegt am Kreuz von A1, A2 und A45: In alle Himmelsrichtungen geht es direkt raus aus der Stadt. Für Fanclubs ist das die Ausgangslage für Auswärtsfahrten in alle Bundesliga-Stadien – für Familien und Vereine der Startpunkt ans Meer oder ins Gebirge.",
        "In der Stadt kennen wir die Abläufe an Spieltagen rund um den Signal Iduna Park und die Messe Westfalenhallen. Für Gruppen, die ein Heimspiel besuchen, planen wir Anfahrt und Abholung so, dass nichts dem Stadionerlebnis im Weg steht.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Dortmund",
          text: "Westfalenhallen, Hauptbahnhof, Signal Iduna Park (Gästebereich), Flughafen Dortmund (DTM) sowie feste Treffpunkte für Fanclubs in allen Stadtteilen.",
        },
        {
          h3: "Typische Ziele ab Dortmund",
          text: "Alle Bundesliga-Städte, Sauerland, Münsterland, Nordsee, Holland, Eifel und das Rheintal. Mehrtägig: Paris, Amsterdam und die Alpen.",
        },
      ],
    },
    {
      h2: "Fanclubs, Vereine und Firmen im Revier",
      body: [
        "Fanclubs schätzen unsere Verlässlichkeit: Der Bus steht, wenn das Spiel aus ist – auch nach Verlängerung. Feste Fahrer für Stammclubs sind auf Wunsch möglich.",
        "Unternehmen aus Logistik, Versicherung und Handel buchen uns für Betriebsausflüge und Messetransfers; Schulen für Klassenfahrten ins Sauerland oder ans Meer.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Fanfahrten", text: "Auswärtsfahrten in alle Stadien – mit Platz für Banner und Trommeln." },
    { title: "Vereinsfahrten", text: "Trainingslager, Turniere und Vereinsausflüge im Revier und darüber hinaus." },
    { title: "Messe Westfalenhallen", text: "Gruppenanreisen und Shuttles zu Messen und Konzerten." },
    { title: "Klassenfahrten", text: "Sauerland, Nordsee oder Holland: Tages- und Studienfahrten ab Dortmunder Schulen." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Dortmund fahren wir durchs gesamte Ruhrgebiet und in alle Richtungen. Häufig angefragt werden Zustiege aus:",
    cities: ["Dortmund", "Bochum", "Hagen", "Hamm", "Unna", "Castrop-Rauxel", "Lünen", "Herne", "Witten", "Schwerte"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Erfahrung mit Fanclubs und Spieltagslogistik",
    "Zubringer im gesamten Ruhrgebiet",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Feste Fahrer für Stammgruppen möglich",
    "Rechnung auf Vereins-, Schul- oder Firmenadresse",
  ],
  faqs: [
    { q: "Wie buche ich eine Fanfahrt ab Dortmund?", a: "Nennen Sie uns Spieltag, Treffpunkt und Personenzahl. Wir bestätigen einen Festpreis – Abfahrt und Rückfahrt stimmen wir auf Anpfiff und Spielende ab, inklusive Puffer für Verlängerung." },
    { q: "Wartet der Bus nach dem Spiel?", a: "Ja. Der Fahrer wartet am vereinbarten Treffpunkt, bis die Gruppe vollständig ist – auch bei Nachspielzeit oder Verlängerung." },
    { q: "Können wir Mitglieder in mehreren Ruhrgebiets-Städten einsammeln?", a: "Ja. Zubringer über Bochum, Hagen oder Unna sind möglich – wir planen die Route so, dass die Gesamtfahrzeit für alle passt." },
    { q: "Fahren Sie auch Klassenfahrten?", a: "Ja. Ins Sauerland, ans Meer oder nach Holland – mit allen Unterlagen, die Schulträger vorab benötigen." },
    { q: "Was kostet eine Fanfahrt?", a: "Das richtet sich nach Ziel und Gruppengröße. Sie erhalten immer einen verbindlichen Festpreis, den der Club intern umlegen kann." },
  ],
  links: serviceLinks("Dortmund"),
  ctaTitle: "Bus in Dortmund anfragen",
  ctaText: "Datum, Ziel und Personenzahl genügen – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenEssen: LandingContent = {
  slug: "busunternehmen-essen",
  seoTitle: "Busunternehmen Essen | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Essen mieten: Firmenfahrten, Klassenfahrten, Messeshuttles und Gruppenreisen im Ruhrgebiet. Festpreis von Metropol Tours anfordern.",
  h1: "Busunternehmen in Essen",
  heroKicker: "Busfahrten ab Essen · Ruhrgebiet, Rhein & Benelux",
  heroText:
    "Zeche Zollverein, Baldeneysee, Messe Essen: Ob Firmenausflug, Klassenfahrt oder Vereinsreise – wir stellen Reisebusse mit Fahrer für Gruppen in Essen und dem zentralen Ruhrgebiet, mit verbindlichem Festpreis.",
  heroImage: "business",
  heroAlt: "Reisebus von Metropol Tours auf Firmenfahrt ab Essen",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Firmenkunden mit Rahmenverträgen", "Benelux in Tagesreichweite"],
  why: [
    {
      title: "Industriekultur als Ziel und Startpunkt",
      text: "Zeche Zollverein, Ruhr Museum, Villa Hügel: Gruppen aus ganz Deutschland kommen nach Essen – und Gruppen aus Essen fahren mit uns in die andere Richtung. Wir kennen beide Seiten.",
    },
    {
      title: "Konzernstadt mit Anspruch",
      text: "Essen ist Sitz großer Konzerne und Versicherungen. Firmenkunden bekommen bei uns Angebot, Abrechnung und Ansprechpartner in der Form, die Einkauf und Verwaltung erwarten.",
    },
    {
      title: "Zentral im Revier",
      text: "A40, A52, A3: Von Essen aus erreichen wir jede Ruhrgebiets-Stadt in unter einer Stunde – und die Niederlande in knapp zwei. Ideal für Zubringer mit mehreren Zustiegen.",
    },
    {
      title: "Persönliche Disposition",
      text: "Von der Anfrage bis zur Fahrt sprechen Sie mit derselben Person – keine Plattform, kein Weiterverkauf.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Essen – vom Baldeneysee nach Amsterdam",
      body: [
        "Essen verbindet Ruhr und Rhein: Tagesfahrten führen an den Baldeneysee, ins Münsterland oder an den Niederrhein – Städtereisen nach Düsseldorf, Köln oder Maastricht sind in Tagesreichweite.",
        "In der Stadt kennen wir die Haltepunkte rund um Zollverein, Messe und Hauptbahnhof. Für Gruppenprogramme mit Führung und Essen planen wir Haltepunkte mit kurzen Fußwegen.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Essen",
          text: "Zeche Zollverein, Messe Essen, Hauptbahnhof (Fernbus-Haltepunkte) sowie direkte Abholungen an Firmen, Schulen und Vereinsheimen in allen Stadtteilen.",
        },
        {
          h3: "Typische Ziele ab Essen",
          text: "Düsseldorf, Köln, Amsterdam, Maastricht, Münsterland, Eifel und Nordsee. Mehrtägig: Paris, Normandie und die Alpen.",
        },
      ],
    },
    {
      h2: "Firmen, Schulen und Vereine im Herzen des Reviers",
      body: [
        "Für Unternehmen aus Energie, Versicherung und Handel fahren wir Betriebsausflüge, Teamevents und Delegationsfahrten – auf Wunsch mit Rahmenvertrag und zentraler Monatsabrechnung.",
        "Schulen und Vereine aus Essen und dem Umland buchen uns für Klassenfahrten, Turnierfahrten und mehrtägige Touren – mit allen Unterlagen, die Träger und Eltern erwarten.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Firmenfahrten", text: "Betriebsausflüge, Teamevents und Transfers für Ruhrgebiets-Unternehmen." },
    { title: "Industriekultur-Touren", text: "Zollverein, Ruhr Museum und Co. – für Gruppen aus Essen und als Ziel." },
    { title: "Messe Essen", text: "Shuttles und Gruppenanreisen zu Messen und Kongressen." },
    { title: "Klassenfahrten", text: "Münsterland, Nordsee oder Holland: Tages- und Studienfahrten ab Essen." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Essen fahren wir durchs gesamte Ruhrgebiet und in die Benelux-Staaten. Häufig angefragt werden Zustiege aus:",
    cities: ["Essen", "Mülheim an der Ruhr", "Oberhausen", "Bottrop", "Gelsenkirchen", "Gladbeck", "Hattingen", "Velbert", "Heiligenhaus", "Bochum"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Rahmenverträge für Firmenkunden",
    "Zubringer im gesamten Ruhrgebiet",
    "Benelux-Routen in Tagesreichweite",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Rechnung auf Firmen-, Schul- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wie miete ich in Essen einen Reisebus?", a: "Über das Anfrageformular oder per E-Mail: Datum, Abfahrtsort, Ziel und Personenzahl genügen. Das Festpreisangebot folgt meist am selben Werktag." },
    { q: "Organisieren Sie Führungen zur Zeche Zollverein?", a: "Wir übernehmen die Beförderung zu Zollverein und anderen Industriekultur-Standorten und stimmen die Zeiten mit Ihren gebuchten Führungen ab." },
    { q: "Gibt es Konditionen für regelmäßige Firmenfahrten?", a: "Ja. Für wiederkehrende Fahrten vereinbaren wir Rahmenkonditionen und eine zentrale monatliche Abrechnung." },
    { q: "Können wir aus mehreren Ruhrgebiets-Städten zusteigen?", a: "Ja. Zubringer über Mülheim, Oberhausen oder Gelsenkirchen planen wir so, dass die Gesamtfahrzeit für alle Gruppenmitglieder passt." },
    { q: "Ist Amsterdam als Tagesfahrt realistisch?", a: "Ja. Von Essen aus ist Amsterdam in gut zweieinhalb Stunden erreichbar – eine klassische Tagesfahrt mit ausreichend Aufenthaltszeit." },
  ],
  links: serviceLinks("Essen"),
  ctaTitle: "Bus in Essen anfragen",
  ctaText: "Datum, Strecke und Personenzahl genügen – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const busunternehmenBraunschweig: LandingContent = {
  slug: "busunternehmen-braunschweig",
  seoTitle: "Busunternehmen Braunschweig | Reisebus mieten | Metropol Tours",
  seoDescription:
    "Reisebus mit Fahrer in Braunschweig mieten: Klassenfahrten, Vereinsfahrten, Firmenfahrten und Gruppenreisen in den Harz. Festpreis von Metropol Tours.",
  h1: "Busunternehmen in Braunschweig",
  heroKicker: "Busfahrten ab Braunschweig · Harz, Heide & Europa",
  heroText:
    "Zwischen Harz und Heide: Ob Klassenfahrt auf den Brocken, Vereinsausflug an die Nordsee oder Firmenfahrt nach Berlin – wir stellen Reisebusse mit Fahrer für Gruppen in Braunschweig und Süd-Niedersachsen, mit Festpreis.",
  heroImage: "journey",
  heroAlt: "Reisebus von Metropol Tours unterwegs ab Braunschweig",
  heroFacts: ["Festpreis inklusive Fahrer & Maut", "Harz-Routen im Alltag", "Sitz in Hannover – kurze Wege"],
  why: [
    {
      title: "Der Harz vor der Tür",
      text: "Goslar, Wernigerode, Brocken: Von Braunschweig ist der Harz in unter einer Stunde erreicht. Tagesfahrten ins Gebirge gehören hier zu unseren häufigsten Buchungen – wir kennen die busgeeigneten Zufahrten.",
    },
    {
      title: "Nachbarschaft zu unserem Sitz",
      text: "Unser Unternehmenssitz in Hannover ist keine Stunde entfernt. Disposition und Fahrer kennen Braunschweig, Wolfenbüttel und Salzgitter aus dem Alltag – keine Anfahrtspauschalen, keine fremden Subunternehmer.",
    },
    {
      title: "Forschungsstadt mit Format",
      text: "TU, Forschungsinstitute, Automobilzulieferer: Braunschweigs Institutionen brauchen verlässliche Gruppenlogistik für Kongresse, Exkursionen und Delegationen. Dafür arbeiten wir mit festen Ansprechpartnern.",
    },
    {
      title: "A2-Anschluss in alle Richtungen",
      text: "Über die A2 sind Berlin, Hannover und das Ruhrgebiet direkt erreichbar; die A39 führt nach Wolfsburg und Richtung Küste. Ideal für Gruppen aus der ganzen Region.",
    },
  ],
  sections: [
    {
      h2: "Busfahrten ab Braunschweig – Harz, Heide und Nordsee",
      body: [
        "Braunschweig liegt ideal zwischen den beliebtesten Ausflugszielen Niedersachsens: Der Harz im Süden, die Lüneburger Heide im Norden, die Nordsee in gut zweieinhalb Stunden. Für mehrtägige Reisen fahren wir von hier aus nach Berlin, Amsterdam oder an die Ostsee.",
        "In der Stadt kennen wir die Haltepunkte rund um Schloss-Arkaden, Hauptbahnhof und Stadion. Für Gruppen aus dem Umland planen wir Zubringer über Wolfenbüttel, Peine oder Salzgitter.",
      ],
      blocks: [
        {
          h3: "Beliebte Startpunkte in Braunschweig",
          text: "Hauptbahnhof, Schloss-Arkaden-Umfeld, Eintracht-Stadion sowie direkte Abholungen an Schulen, Firmen und Vereinsheimen in Stadt und Landkreis.",
        },
        {
          h3: "Typische Ziele ab Braunschweig",
          text: "Harz (Goslar, Wernigerode, Brocken), Lüneburger Heide, Nordsee, Berlin, Hamburg und Hannover. Mehrtägig: Amsterdam, Prag und die Ostsee.",
        },
      ],
    },
    {
      h2: "Für Schulen, Institute und Vereine in Süd-Niedersachsen",
      body: [
        "Braunschweiger Schulen buchen uns für Wandertage im Harz ebenso wie für Studienfahrten nach Berlin oder Amsterdam. Alle Unterlagen für Schulträger liefern wir vorab – inklusive Fahrzeugdaten und Fahrerkontakt.",
        "Für Forschungseinrichtungen und Unternehmen fahren wir Kongress-Shuttles, Exkursionen und Delegationsfahrten – mit der Verlässlichkeit, die akademische und geschäftliche Zeitpläne brauchen.",
      ],
    },
  ],
  fleet: sharedFleet,
  occasions: [
    { title: "Harz-Tagesfahrten", text: "Goslar, Wernigerode und Brocken – in unter einer Stunde erreichbar." },
    { title: "Kongresse & Exkursionen", text: "Gruppenlogistik für Institute, Hochschulen und Unternehmen." },
    { title: "Vereinsfahrten", text: "Auswärtsfahrten und Vereinsausflüge in ganz Norddeutschland." },
    { title: "Nordsee-Wochenenden", text: "Kurzreisen an die Küste für Gruppen aus Stadt und Landkreis." },
  ],
  process: sharedProcess,
  area: {
    intro:
      "Ab Braunschweig fahren wir durch Süd-Niedersachsen, in den Harz und darüber hinaus. Häufig angefragt werden Zustiege aus:",
    cities: ["Braunschweig", "Wolfenbüttel", "Salzgitter", "Peine", "Wolfsburg", "Gifhorn", "Helmstedt", "Goslar", "Bad Harzburg", "Hildesheim"],
  },
  advantages: [
    "Festpreis inklusive Fahrer, Maut und Kilometern",
    "Unternehmenssitz in Hannover – keine Anfahrtspauschale",
    "Harz-Routen im Alltag",
    "Moderne Busse mit Klimaanlage, WC und WLAN",
    "Unterlagen für Schulträger vorab",
    "Rechnung auf Schul-, Firmen- oder Vereinsadresse",
  ],
  faqs: [
    { q: "Wie miete ich in Braunschweig einen Bus?", a: "Über das Anfrageformular oder per E-Mail: Datum, Abfahrtsort, Ziel und Personenzahl genügen. Das Angebot folgt meist am selben Werktag." },
    { q: "Gibt es Anfahrtspauschalen, weil Ihr Sitz in Hannover ist?", a: "Nein. Braunschweig gehört zu unserem Kerneinsatzgebiet – Ihr Festpreis enthält die Anfahrt bereits." },
    { q: "Fahren Sie regelmäßig in den Harz?", a: "Ja. Goslar, Wernigerode und der Brocken gehören zu unseren häufigsten Tageszielen ab Braunschweig – wir kennen die busgeeigneten Zufahrten." },
    { q: "Können wir aus Wolfenbüttel oder Salzgitter zusteigen?", a: "Ja. Zubringer mit Zustiegen im Umland sind möglich – wir planen die Route so, dass sie für alle Gruppenmitglieder passt." },
    { q: "Fahren Sie auch Kongresse und Exkursionen für Institute?", a: "Ja, regelmäßig. Für Hochschulen und Forschungseinrichtungen arbeiten wir mit festen Ansprechpartnern und präzisen Zeitplänen." },
  ],
  links: serviceLinks("Braunschweig"),
  ctaTitle: "Bus in Braunschweig anfragen",
  ctaText: "Senden Sie uns Datum, Strecke und Personenzahl – Sie erhalten ein verbindliches Festpreisangebot.",
};

export const staedtePages: LandingContent[] = [
  busunternehmenBerlin,
  busunternehmenMuenchen,
  busunternehmenKoeln,
  busunternehmenFrankfurt,
  busunternehmenStuttgart,
  busunternehmenDuesseldorf,
  busunternehmenLeipzig,
  busunternehmenDresden,
  busunternehmenNuernberg,
  busunternehmenDortmund,
  busunternehmenEssen,
  busunternehmenBraunschweig,
];
