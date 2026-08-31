// Entfernt Service-Worker-Dateien aus dem nativen iOS-Bundle.
// Web/PWA bleibt unberührt – nur der Capacitor-Container soll niemals
// einen Service Worker registrieren oder alte Caches ausliefern.
import { rm, access } from "node:fs/promises";
import path from "node:path";

const iosPublic = path.resolve("ios/App/App/public");
const files = ["sw.js", "service-worker.js"];

for (const file of files) {
  const target = path.join(iosPublic, file);
  try {
    await access(target);
    await rm(target, { force: true });
    console.log(`[ios-strip-sw] removed ${path.relative(process.cwd(), target)}`);
  } catch {
    // Datei nicht vorhanden – nichts zu tun.
  }
}
