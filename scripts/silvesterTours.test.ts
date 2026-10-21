import { expect, test } from "bun:test";
import { selectSilvesterTours, type SilvesterTour } from "../src/lib/silvesterTours";

const tour: SilvesterTour = {
  id: "tour", destination: "Silvester Night Amsterdam", location: "Amsterdam, Niederlande", country: "Niederlande", slug: "silvester-amsterdam",
  image_url: null, hero_image_url: null, is_active: true, publish_status: "published", seo_noindex: false,
  tour_dates: [{ departure_date: "2026-12-30", return_date: "2027-01-01", price_basic: 69, is_active: true, status: "available" }],
};
test("only published active Silvester tours with upcoming active non-cancelled dates appear", () => {
  const result = selectSilvesterTours([tour, { ...tour, publish_status: "draft" }, { ...tour, is_active: false }, { ...tour, slug: "sommer", destination: "Sommer" }, { ...tour, tour_dates: [{ ...tour.tour_dates[0], departure_date: "2026-01-01" }] }, { ...tour, tour_dates: [{ ...tour.tour_dates[0], status: "cancelled" }] }, { ...tour, tour_dates: [{ ...tour.tour_dates[0], is_active: false }] }], "2026-10-21");
  expect(result).toHaveLength(1);
  expect(result[0]?.price).toBe(69);
});
test("zero and missing prices never become a displayed zero euro offer", () => {
  expect(selectSilvesterTours([{ ...tour, tour_dates: [{ ...tour.tour_dates[0], price_basic: 0 }] }], "2026-10-21")[0]?.price).toBeNull();
  expect(selectSilvesterTours([{ ...tour, tour_dates: [{ ...tour.tour_dates[0], price_basic: null }] }], "2026-10-21")[0]?.price).toBeNull();
});