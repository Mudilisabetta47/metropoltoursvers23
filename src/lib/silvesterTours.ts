export interface SilvesterDate {
  departure_date: string;
  return_date: string;
  price_basic: number | null;
  is_active: boolean;
  status: string;
}

export interface SilvesterTour {
  id: string;
  destination: string;
  location: string;
  country: string;
  slug: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  publish_status: string;
  seo_noindex: boolean | null;
  tour_dates: SilvesterDate[];
}

export function selectSilvesterTours(tours: SilvesterTour[], today: string) {
  return tours.filter(tour => tour.is_active && tour.publish_status === "published" && /silvester/i.test(`${tour.slug} ${tour.destination}`))
    .map(tour => {
      const dates = tour.tour_dates.filter(date => date.is_active && date.departure_date >= today && date.status !== "cancelled")
        .sort((a, b) => a.departure_date.localeCompare(b.departure_date));
      const prices = dates.map(date => Number(date.price_basic)).filter(price => Number.isFinite(price) && price > 0);
      return { ...tour, dates, price: prices.length ? Math.min(...prices) : null };
    }).filter(tour => tour.dates.length > 0)
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
}

export const silvesterFaq = [
  { q: "Welche Silvester-Busreisen bietet METROPOL TOURS an?", a: "Hier finden Sie unsere veröffentlichten Silvesterreisen mit kommenden Reiseterminen. Auf der jeweiligen Reiseseite stehen das vollständige Programm, die Tarife und die Buchungsmöglichkeiten." },
  { q: "Wo finde ich Zustiegsorte und Abfahrtszeiten?", a: "Die für Ihre Reise hinterlegten Zustiegsorte und Abfahrtszeiten finden Sie auf der jeweiligen Reiseseite. Wählen Sie dort Ihren passenden Zustieg, bevor Sie buchen." },
  { q: "Was ist im Reisepreis enthalten?", a: "Enthalten ist ausschließlich die Hin- und Rückfahrt mit dem Reisebus. Hotel und Frühstück sind nicht enthalten und müssen von Ihnen selbst organisiert und bezahlt werden." },
  { q: "Können wir als Freundesgruppe zusammen buchen?", a: "Wählen Sie auf der Reiseseite die Anzahl Ihrer Mitreisenden. Für eine individuelle Gruppenreise kontaktieren Sie uns über die Gruppenanfrage oder per E-Mail an kundenservice@metours.de." },
  { q: "Wie bezahle ich meine Silvesterreise?", a: "Nach der Reiseauswahl bezahlen Sie über die sichere Mollie-Zahlungsseite. Dort werden die für Ihre Buchung verfügbaren Zahlungsarten angezeigt." },
];