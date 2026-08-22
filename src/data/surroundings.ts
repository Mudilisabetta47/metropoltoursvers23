// Kuratierte Umgebungsdaten (Booking-Style) für unsere Hauptziele.
// Entfernungen sind geprüfte Richtwerte ab Stadtzentrum bzw. Hotelbereich.

export interface CuratedPoi {
  name: string;
  kind?: string;
  distance: string;
}

export interface CuratedSurroundings {
  attractions: CuratedPoi[];
  food: CuratedPoi[];
  nature: CuratedPoi[];
  transit: CuratedPoi[];
  airports: CuratedPoi[];
}

const DATA: Record<string, CuratedSurroundings> = {
  nizza: {
    attractions: [
      { name: "Promenade des Anglais", distance: "300 m" },
      { name: "Altstadt (Vieux Nice)", distance: "700 m" },
      { name: "Cours Saleya – Blumenmarkt", distance: "850 m" },
      { name: "Place Masséna", distance: "600 m" },
      { name: "Colline du Château (Schlossberg)", distance: "1,3 km" },
      { name: "Hafen Lympia", distance: "2,0 km" },
      { name: "Musée Matisse", distance: "3,5 km" },
      { name: "Russisch-Orthodoxe Kathedrale", distance: "1,9 km" },
    ],
    food: [
      { name: "Chez Pipo (Socca)", kind: "Regionale Küche", distance: "1,8 km" },
      { name: "La Favola", kind: "Italienisch", distance: "800 m" },
      { name: "Le Safari", kind: "Französisch", distance: "900 m" },
      { name: "Fenocchio", kind: "Eisdiele", distance: "750 m" },
      { name: "Café de Turin", kind: "Meeresfrüchte", distance: "1,5 km" },
    ],
    nature: [
      { name: "Strand Plage Beau Rivage", distance: "550 m" },
      { name: "Jardin Albert 1er", distance: "500 m" },
      { name: "Parc de la Colline du Château", distance: "1,3 km" },
      { name: "Mont Boron Naturpark", distance: "4,5 km" },
    ],
    transit: [
      { name: "Tramhaltestelle Masséna", kind: "Tram", distance: "600 m" },
      { name: "Bahnhof Nice-Ville", kind: "Bahnhof", distance: "1,6 km" },
      { name: "Busbahnhof Nice Vauban", kind: "Bus", distance: "2,2 km" },
    ],
    airports: [
      { name: "Flughafen Nizza Côte d'Azur (NCE)", distance: "6,5 km" },
      { name: "Flughafen Cannes-Mandelieu", distance: "30 km" },
    ],
  },
  paris: {
    attractions: [
      { name: "Eiffelturm", distance: "2,5 km" },
      { name: "Louvre", distance: "1,8 km" },
      { name: "Notre-Dame", distance: "2,0 km" },
      { name: "Sacré-Cœur / Montmartre", distance: "3,4 km" },
      { name: "Champs-Élysées & Arc de Triomphe", distance: "3,0 km" },
    ],
    food: [
      { name: "Café de Flore", kind: "Café", distance: "1,7 km" },
      { name: "Bouillon Chartier", kind: "Französisch", distance: "1,2 km" },
      { name: "Angelina", kind: "Patisserie", distance: "1,5 km" },
    ],
    nature: [
      { name: "Jardin des Tuileries", distance: "1,6 km" },
      { name: "Jardin du Luxembourg", distance: "2,3 km" },
      { name: "Seine-Uferpromenade", distance: "1,0 km" },
    ],
    transit: [
      { name: "Metro Châtelet", kind: "Metro", distance: "800 m" },
      { name: "Gare du Nord", kind: "Bahnhof", distance: "2,6 km" },
    ],
    airports: [
      { name: "Paris Charles de Gaulle (CDG)", distance: "25 km" },
      { name: "Paris Orly (ORY)", distance: "18 km" },
    ],
  },
  prag: {
    attractions: [
      { name: "Karlsbrücke", distance: "700 m" },
      { name: "Altstädter Ring & Astronomische Uhr", distance: "450 m" },
      { name: "Prager Burg", distance: "1,9 km" },
      { name: "Wenzelsplatz", distance: "900 m" },
      { name: "Jüdisches Viertel Josefov", distance: "800 m" },
    ],
    food: [
      { name: "U Fleků", kind: "Brauhaus", distance: "1,4 km" },
      { name: "Lokál Dlouhá", kind: "Tschechisch", distance: "600 m" },
      { name: "Café Louvre", kind: "Café", distance: "1,1 km" },
    ],
    nature: [
      { name: "Petřín-Hügel", distance: "2,1 km" },
      { name: "Letná-Park", distance: "1,7 km" },
      { name: "Moldau-Promenade", distance: "500 m" },
    ],
    transit: [
      { name: "Metro Staroměstská", kind: "Metro", distance: "600 m" },
      { name: "Hauptbahnhof Praha hlavní nádraží", kind: "Bahnhof", distance: "1,5 km" },
    ],
    airports: [{ name: "Flughafen Prag Václav Havel (PRG)", distance: "17 km" }],
  },
  novalja: {
    attractions: [
      { name: "Zrće Beach", distance: "2,0 km" },
      { name: "Altstadt Novalja", distance: "400 m" },
      { name: "Antiker Wasserkanal (Talijanova buža)", distance: "500 m" },
      { name: "Stadt Pag & Salinen", distance: "20 km" },
    ],
    food: [
      { name: "Konoba Nono", kind: "Kroatisch", distance: "600 m" },
      { name: "Restaurant Boškinac", kind: "Fine Dining", distance: "3,5 km" },
      { name: "Pizzeria Bocca", kind: "Pizzeria", distance: "450 m" },
    ],
    nature: [
      { name: "Strand Straško", distance: "1,3 km" },
      { name: "Bucht Caska", distance: "4,0 km" },
      { name: "Mondlandschaft Pag", distance: "9,0 km" },
    ],
    transit: [
      { name: "Busbahnhof Novalja", kind: "Bus", distance: "350 m" },
      { name: "Fährhafen Žigljen", kind: "Fähre", distance: "9,5 km" },
    ],
    airports: [
      { name: "Flughafen Zadar (ZAD)", distance: "80 km" },
      { name: "Flughafen Rijeka (RJK)", distance: "95 km" },
    ],
  },
  sanremo: {
    attractions: [
      { name: "Casinò di Sanremo", distance: "500 m" },
      { name: "Altstadt La Pigna", distance: "900 m" },
      { name: "Russische Kirche", distance: "450 m" },
      { name: "Hafen Portosole", distance: "1,2 km" },
    ],
    food: [
      { name: "Ristorante Vittorio", kind: "Meeresfrüchte", distance: "1,4 km" },
      { name: "Bar Gelateria Anzani", kind: "Eisdiele", distance: "600 m" },
    ],
    nature: [
      { name: "Strandpromenade Lungomare", distance: "400 m" },
      { name: "Radweg Pista Ciclabile", distance: "700 m" },
      { name: "Parco di Villa Ormond", distance: "1,1 km" },
    ],
    transit: [{ name: "Bahnhof Sanremo", kind: "Bahnhof", distance: "800 m" }],
    airports: [
      { name: "Flughafen Nizza (NCE)", distance: "60 km" },
      { name: "Flughafen Genua (GOA)", distance: "140 km" },
    ],
  },
  kopenhagen: {
    attractions: [
      { name: "Nyhavn", distance: "1,0 km" },
      { name: "Tivoli-Gärten", distance: "600 m" },
      { name: "Die kleine Meerjungfrau", distance: "3,0 km" },
      { name: "Schloss Amalienborg", distance: "1,8 km" },
    ],
    food: [
      { name: "Torvehallerne Markthalle", kind: "Street Food", distance: "1,3 km" },
      { name: "Reffen Street Food", kind: "Street Food", distance: "3,5 km" },
    ],
    nature: [
      { name: "Königsgarten (Kongens Have)", distance: "1,5 km" },
      { name: "Hafenbad Islands Brygge", distance: "1,9 km" },
    ],
    transit: [
      { name: "Hauptbahnhof København H", kind: "Bahnhof", distance: "700 m" },
      { name: "Metro Kongens Nytorv", kind: "Metro", distance: "1,1 km" },
    ],
    airports: [{ name: "Flughafen Kopenhagen (CPH)", distance: "9 km" }],
  },
  "lloret de mar": {
    attractions: [
      { name: "Strand Platja de Lloret", distance: "250 m" },
      { name: "Jardins de Santa Clotilde", distance: "1,8 km" },
      { name: "Castell d'en Plaja", distance: "1,2 km" },
      { name: "Wasserpark Water World", distance: "2,5 km" },
    ],
    food: [
      { name: "Restaurant Mar i Vent", kind: "Mediterran", distance: "500 m" },
      { name: "Tapas-Meile Carrer de la Vila", kind: "Tapas", distance: "400 m" },
    ],
    nature: [
      { name: "Bucht Cala Banys", distance: "1,0 km" },
      { name: "Strand Fenals", distance: "1,7 km" },
      { name: "Küstenwanderweg Camí de Ronda", distance: "800 m" },
    ],
    transit: [{ name: "Busbahnhof Lloret de Mar", kind: "Bus", distance: "600 m" }],
    airports: [
      { name: "Flughafen Girona (GRO)", distance: "35 km" },
      { name: "Flughafen Barcelona (BCN)", distance: "85 km" },
    ],
  },
  istanbul: {
    attractions: [
      { name: "Hagia Sophia", distance: "1,2 km" },
      { name: "Blaue Moschee", distance: "1,4 km" },
      { name: "Topkapi-Palast", distance: "1,6 km" },
      { name: "Großer Basar", distance: "1,0 km" },
      { name: "Galataturm", distance: "3,0 km" },
    ],
    food: [
      { name: "Hamdi Restaurant", kind: "Türkisch", distance: "1,5 km" },
      { name: "Ägyptischer Gewürzbasar", kind: "Markt", distance: "1,3 km" },
    ],
    nature: [
      { name: "Gülhane-Park", distance: "1,5 km" },
      { name: "Bosporus-Promenade", distance: "2,0 km" },
    ],
    transit: [
      { name: "Tram Sultanahmet", kind: "Tram", distance: "900 m" },
      { name: "Fähranleger Eminönü", kind: "Fähre", distance: "1,4 km" },
    ],
    airports: [
      { name: "Flughafen Istanbul (IST)", distance: "45 km" },
      { name: "Sabiha Gökçen (SAW)", distance: "50 km" },
    ],
  },
  amsterdam: {
    attractions: [
      { name: "Anne-Frank-Haus", distance: "1,5 km" },
      { name: "Rijksmuseum", distance: "2,2 km" },
      { name: "Van-Gogh-Museum", distance: "2,4 km" },
      { name: "Dam-Platz", distance: "800 m" },
    ],
    food: [
      { name: "Foodhallen", kind: "Street Food", distance: "2,6 km" },
      { name: "Pancakes Amsterdam", kind: "Café", distance: "900 m" },
    ],
    nature: [
      { name: "Vondelpark", distance: "2,5 km" },
      { name: "Grachtengürtel", distance: "600 m" },
    ],
    transit: [
      { name: "Bahnhof Amsterdam Centraal", kind: "Bahnhof", distance: "1,0 km" },
      { name: "Tramhaltestelle Dam", kind: "Tram", distance: "800 m" },
    ],
    airports: [{ name: "Flughafen Amsterdam Schiphol (AMS)", distance: "17 km" }],
  },
};

const ALIASES: Record<string, string> = {
  nice: "nizza",
  "cote d'azur": "nizza",
  "côte d'azur": "nizza",
  praha: "prag",
  prague: "prag",
  copenhagen: "kopenhagen",
  "san remo": "sanremo",
  lloret: "lloret de mar",
  istanbul: "istanbul",
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/** Findet kuratierte Umgebungsdaten anhand von Ziel/Ort/Land-Texten. */
export const findCuratedSurroundings = (
  ...parts: (string | null | undefined)[]
): CuratedSurroundings | null => {
  const haystack = norm(parts.filter(Boolean).join(" | "));
  if (!haystack) return null;

  for (const [alias, target] of Object.entries(ALIASES)) {
    if (haystack.includes(norm(alias)) && DATA[target]) return DATA[target];
  }
  for (const key of Object.keys(DATA)) {
    if (haystack.includes(norm(key))) return DATA[key];
  }
  return null;
};

export default DATA;
