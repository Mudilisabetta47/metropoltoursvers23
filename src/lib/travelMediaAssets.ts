const photos = import.meta.glob<string>("/src/assets/**/*.{jpg,jpeg,png,webp,svg,avif}", { eager: true, query: "?url", import: "default" });
const pointers = import.meta.glob<{ url: string; original_filename: string }>("/src/assets/**/*.asset.json", { eager: true, import: "default" });

export const generalTravelAssets = [
  ...Object.entries(photos).map(([path, url]) => ({ path, url })),
  ...Object.entries(pointers).map(([path, pointer]) => ({ path: path.replace(".asset.json", ""), url: pointer.url })),
];

export function resolveMediaReference(value: string): string | null {
  if (/^https?:\/\//i.test(value) || value.startsWith("/__l5e/") || value.startsWith("/assets/")) return value;
  const basename = value.split("/").pop();
  const asset = generalTravelAssets.find(item => item.path.split("/").pop() === basename);
  if (asset) return asset.url;
  return value.startsWith("/") ? value : null;
}