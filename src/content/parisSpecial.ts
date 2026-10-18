export const parisSpecial = {
  name: "Silvester Night in Paris",
  departureDate: "2026-12-30",
  returnDate: "2027-01-01",
  dateLabel: "30.12.2026 – 01.01.2027",
  destination: "Paris, Frankreich",
  path: "/reisen/silvester-paris",
} as const;

export const parisInquiryUrl = `mailto:kundenservice@metours.de?subject=${encodeURIComponent(`Anfrage: ${parisSpecial.name} | ${parisSpecial.dateLabel}`)}&body=${encodeURIComponent(`Guten Tag METROPOL TOURS,\n\nich interessiere mich für ${parisSpecial.name} vom ${parisSpecial.dateLabel}.\n\nBitte senden Sie mir Informationen zu Preis, Zustiegsorten und enthaltenen Leistungen.\n\nAnzahl der Reisenden:\nGewünschter Zustiegsort:\nName:\nTelefon (optional):\n\nMit freundlichen Grüßen`)}`;