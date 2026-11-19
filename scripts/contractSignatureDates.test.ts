import { expect, test } from "bun:test";
import { contractPlaceDate, describePartySignature } from "../src/lib/contracts/signatureDates";

test("a chosen signature date appears even when the contract is created on another day", () => {
  expect(describePartySignature({ place: "Hannover", plannedDate: "2026-03-01" }).dateLine).toBe("Hannover, den 01.03.2026");
  expect(describePartySignature({ place: "Hannover", plannedDate: "2027-01-15" }).dateLine).toBe("Hannover, den 15.01.2027");
});

test("without a chosen date the line stays blank instead of falling back to today", () => {
  const { dateLine } = describePartySignature({ place: "Hannover", plannedDate: null });
  expect(dateLine).toBe("Hannover, den ____________");
  expect(contractPlaceDate("Hannover", null, null)).toBe("Hannover, den ____________");
});

test("contract date line uses the contract date, then the creation date", () => {
  expect(contractPlaceDate("Hannover", "2026-02-10", "2026-11-19")).toBe("Hannover, den 10.02.2026");
  expect(contractPlaceDate("Hannover", null, "2026-11-19")).toBe("Hannover, den 19.11.2026");
});

test("a past planned date is never shown as the actual electronic signature", () => {
  const lines = describePartySignature({ place: "Hannover", plannedDate: "2026-03-01", signedAt: "2026-11-19T13:58:00Z" });
  expect(lines.dateLine).toBe("Hannover, vorgesehenes Datum: 01.03.2026");
  expect(lines.eSignLine).toBe("Elektronisch unterschrieben am 19.11.2026 um 14:58 Uhr");
});

test("matching planned date and real signature day show a normal date line plus the real time", () => {
  const lines = describePartySignature({ place: "Hannover", plannedDate: "2026-11-19", signedAt: "2026-11-19T13:58:00Z" });
  expect(lines.dateLine).toBe("Hannover, den 19.11.2026");
  expect(lines.eSignLine).toBe("Elektronisch unterschrieben am 19.11.2026 um 14:58 Uhr");
});
