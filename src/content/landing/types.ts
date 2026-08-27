/**
 * Datenmodell für die SEO-Landingpages (Busvermietung / Personenbeförderung).
 * Jede Seite liefert eigenständige, redaktionell geschriebene Inhalte –
 * bewusst keine Textbausteine mit ausgetauschtem Stadtnamen.
 */

export interface LandingSection {
  h2: string;
  /** Absätze als Fließtext. */
  body: string[];
  /** Optionale H3-Blöcke innerhalb der Sektion. */
  blocks?: { h3: string; text: string }[];
}

export interface LandingCard {
  title: string;
  text: string;
}

export interface LandingLink {
  label: string;
  path: string;
  text: string;
}

export type LandingImageKey =
  | "busReal"
  | "premiumBus"
  | "business"
  | "group"
  | "heroBus"
  | "metropolHero"
  | "journey";

export interface LandingContent {
  /** Pfad ohne führenden Slash, z. B. "bus-mieten-hannover". */
  slug: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  heroKicker: string;
  heroText: string;
  heroImage: LandingImageKey;
  heroAlt: string;
  /** Kurze Fakten unter dem Hero. */
  heroFacts: string[];
  /** "Warum Metropol Tours?" – individuell pro Seite. */
  why: LandingCard[];
  /** Redaktioneller Haupttext (H2-Sektionen). */
  sections: LandingSection[];
  /** Welche Busse? */
  fleet: { name: string; seats: string; text: string }[];
  /** Für welche Anlässe? */
  occasions: LandingCard[];
  /** Ablauf der Anfrage. */
  process: { title: string; text: string }[];
  /** Einsatzgebiet. */
  area: { intro: string; cities: string[] };
  /** Vorteile (Bulletliste). */
  advantages: string[];
  /** FAQ mit echten Kundenfragen. */
  faqs: { q: string; a: string }[];
  /** Interne Verlinkung. */
  links: LandingLink[];
  /** Ort für LocalBusiness-Schema, falls Standortseite. */
  locality?: "Hannover" | "Bremen" | "Hamburg";
  ctaTitle: string;
  ctaText: string;
}
