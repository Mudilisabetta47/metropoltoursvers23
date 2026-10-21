import { test, expect } from "bun:test";
import { tourServiceIndicators } from "../src/lib/tourServiceIndicators";

test("Silvester includes both bus journeys", () => {
  expect(tourServiceIndicators(["Hin- und Rückfahrt mit dem Reisebus"]).roundTrip).toBe(true);
  expect(tourServiceIndicators(["Hin- und Rückfahrt mit dem Reisebus"]).bus).toBe(true);
});
test("Silvester does not include hotel", () => {
  expect(tourServiceIndicators(["Hin- und Rückfahrt mit dem Reisebus"]).hotel).toBe(false);
  expect(tourServiceIndicators(["Hotel selbst organisieren"]).hotel).toBe(false);
});
test("Silvester does not include breakfast", () => {
  expect(tourServiceIndicators(["Hin- und Rückfahrt mit dem Reisebus"]).breakfast).toBe(false);
  expect(tourServiceIndicators(["Frühstück nicht enthalten"]).breakfast).toBe(false);
});