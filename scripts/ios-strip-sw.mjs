// Entfernt Service-Worker-Dateien aus dem nativen iOS-Bundle.
// Web/PWA bleibt unberührt – nur der Capacitor-Container soll niemals
// einen Service Worker registrieren oder alte Caches ausliefern.
import { rm, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iosPublic = path.join(projectRoot, "ios/App/App/public");
const files = ["sw.js", "sw\\.js", "service-worker.js"];

for (const file of files) {
  const target = path.join(iosPublic, file);
  await rm(target, { force: true });

  try {
    await access(target);
    throw new Error(`[ios-strip-sw] removal failed: ${target}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[ios-strip-sw]")) {
      throw error;
    }
  }
}

console.log(`[ios-strip-sw] verified absent: ${files.join(", ")}`);
