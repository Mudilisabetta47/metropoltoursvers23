export interface TravelMediaSource {
  id: string;
  destination: string;
  image_url: string | null;
  hero_image_url: string | null;
  gallery_images: string[] | null;
  og_image_url?: string | null;
}

export interface TravelImage {
  id: string;
  url: string;
  name: string;
  group: string;
  usages: string[];
}

export function collectTravelImages(sources: TravelMediaSource[], group: string, resolve: (value: string) => string | null): TravelImage[] {
  return sources.flatMap(source => {
    const images = new Map<string, TravelImage>();
    const add = (value: string | null | undefined, usage: string) => {
      if (!value) return;
      const url = resolve(value);
      if (!url) return;
      const existing = images.get(url);
      if (existing) existing.usages.push(usage);
      else images.set(url, { id: `${group}:${source.id}:${url}`, url, name: source.destination, group, usages: [usage] });
    };
    add(source.image_url, "Kartenbild");
    add(source.hero_image_url, "Titelbild");
    add(source.og_image_url, "Social-Media-Bild");
    source.gallery_images?.forEach((url, i) => add(url, `Galerie ${i + 1}`));
    return [...images.values()];
  });
}

export function imageFilename(image: TravelImage, index: number, mime: string): string {
  const name = `${image.name}-${image.usages.join("-")}`.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 120);
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg", "image/avif": "avif", "image/gif": "gif" };
  return `${String(index + 1).padStart(3, "0")}-${name}.${extensions[mime.split(";")[0]] || "img"}`;
}

export async function fetchImage(url: string): Promise<Blob> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error("Bild konnte nicht geladen werden.");
  const blob = await response.blob();
  if (!blob.size || !blob.type.startsWith("image/")) throw new Error("Die Adresse liefert keine Bilddatei.");
  return blob;
}

export async function deliverMedia(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if ((error as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}