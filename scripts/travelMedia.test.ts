import { test, expect } from "bun:test";
import { collectTravelImages, imageFilename, fetchImage } from "../src/lib/travelMedia";

test("inventory retains travel image roles without inventing missing images", () => {
  const images = collectTravelImages([{ id: "paris", destination: "Paris", image_url: "/paris.jpg", hero_image_url: "/paris.jpg", gallery_images: ["/gallery.png"], og_image_url: null }], "Pauschalreisen", value => value);
  expect(images.length).toBe(2);
  expect(images[0].usages).toEqual(["Kartenbild", "Titelbild"]);
  expect(images[1].usages).toEqual(["Galerie 1"]);
  expect(collectTravelImages([{ id: "empty", destination: "Empty", image_url: null, hero_image_url: null, gallery_images: null }], "Kurzurlaube", value => value)).toEqual([]);
});

test("archive filenames are unique and use the actual image type", () => {
  const image = { id: "1", url: "https://example.test/picture", name: "München / Paris", group: "Kurzurlaube", usages: ["Titelbild"] };
  expect(imageFilename(image, 0, "image/png")).toBe("001-Munchen-Paris-Titelbild.png");
  expect(imageFilename(image, 1, "image/jpeg")).toBe("002-Munchen-Paris-Titelbild.jpg");
});

test("downloads reject non-image responses and return real image bytes", async () => {
  await expect(fetchImage("data:text/html,not-an-image")).rejects.toThrow("keine Bilddatei");
  const blob = await fetchImage("data:image/png;base64,iVBORw0KGgo=");
  expect(blob.size).toBe(8);
  expect(blob.type).toBe("image/png");
});