import { describe, expect, test } from "bun:test";
import { parisInquiryUrl, parisSpecial } from "./parisSpecial";

describe("Confirmed Paris special travel dates", () => {
  test("departs on 30 December 2026", () => {
    expect(parisSpecial.departureDate).toBe("2026-12-30");
  });
  test("returns on 1 January 2027", () => {
    expect(parisSpecial.returnDate).toBe("2027-01-01");
  });
  test("inquiry carries both confirmed dates", () => {
    const body = new URL(parisInquiryUrl).searchParams.get("body");
    expect(body).toContain("30.12.2026 – 01.01.2027");
  });
});