// Echter Apple Wallet Pass (.pkpass) – serverseitig generiert & signiert.
// GET /apple-wallet-pass?serial=<serial>&token=<auth_token>
// Antwort: application/vnd.apple.pkpass  (iOS öffnet nativen "Zu Wallet hinzufügen"-Dialog)
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import forge from "npm:node-forge@1.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PASS_TYPE_ID = Deno.env.get("APPLE_PASS_TYPE_ID") ?? Deno.env.get("APPLE_PASS_TYPE_IDENTIFIER") ?? "";
const TEAM_ID = Deno.env.get("APPLE_TEAM_ID") ?? Deno.env.get("APPLE_TEAM_IDENTIFIER") ?? "";
const P12_B64 = Deno.env.get("APPLE_PASS_CERT_P12") ?? Deno.env.get("APPLE_PASS_CERT_P12_BASE64") ?? "";
const P12_PASS = Deno.env.get("APPLE_PASS_CERT_PASSWORD") ?? "";
const WWDR_PEM = Deno.env.get("APPLE_WWDR_PEM") ?? Deno.env.get("APPLE_WWDR_CERT_PEM") ?? "";
const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://www.metours.de";

const missingCredentials = () => {
  const missing: string[] = [];
  if (!PASS_TYPE_ID) missing.push("APPLE_PASS_TYPE_ID");
  if (!TEAM_ID) missing.push("APPLE_TEAM_ID");
  if (!P12_B64) missing.push("APPLE_PASS_CERT_P12");
  if (!WWDR_PEM) missing.push("APPLE_WWDR_PEM");
  return missing;
};

// ---------- ZIP (store, no compression) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zip(files: { name: string; data: Uint8Array }[]) {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(8, 0, true); // store
    lv.setUint32(14, crc, true);
    lv.setUint32(18, f.data.length, true);
    lv.setUint32(22, f.data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    chunks.push(local, f.data);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true);
    cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += local.length + f.data.length;
  }
  const centralSize = central.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const all = [...chunks, ...central, end];
  const total = all.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

// ---------- Helpers ----------
const bytesToBinary = (b: Uint8Array) => {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
};
const binaryToBytes = (s: string) => {
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
  return b;
};
function sha1Hex(data: Uint8Array) {
  const md = forge.md.sha1.create();
  md.update(bytesToBinary(data));
  return md.digest().toHex();
}

// Secrets können als reines Base64, als PEM-Block oder mit \n / Whitespace kommen.
// Ohne Normalisierung landet Müll in asn1.fromDer → "Only 8, 16, 24, or 32 bits supported: N".
function normalizeBase64(raw: string): string {
  let s = (raw ?? "").trim();
  s = s.replace(/\\n/g, "\n");
  if (s.includes("-----BEGIN")) {
    s = s.replace(/-----BEGIN[^-]+-----/g, "").replace(/-----END[^-]+-----/g, "");
  }
  s = s.replace(/\s+/g, "");
  // URL-safe Base64 tolerieren
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad === 2) s += "==";
  else if (pad === 3) s += "=";
  else if (pad === 1) throw new Error("Base64-Wert ist unvollständig (ungültige Länge)");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error("Wert enthält ungültige Base64-Zeichen");
  return s;
}

function base64ToBinaryString(raw: string, label: string): string {
  const src = (raw ?? "").trim();
  // Fall A: Wert wurde als Rohbinär (latin1) hinterlegt -> direkt verwenden
  if (src.charCodeAt(0) === 0x30 && /[\x00-\x08\x0e-\x1f\x80-\xff]/.test(src)) return src;
  // Fall B: Hex-String
  const hex = src.replace(/\s+/g, "");
  if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0 && hex.length > 64 && hex.slice(0, 2) === "30") {
    let out = "";
    for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    return out;
  }
  // Fall C: Base64 (ggf. PEM-verpackt)
  let b64: string;
  try {
    b64 = normalizeBase64(src);
  } catch (e: any) {
    const invalid = [...new Set(src.replace(/[A-Za-z0-9+/=\s-]/g, "").split(""))]
      .map((c) => c.charCodeAt(0)).slice(0, 10);
    console.error(`${label} ungültig`, { length: src.length, invalidCharCodes: invalid });
    throw new Error(`${label}: ${e.message} (Länge ${src.length}, ungültige Zeichencodes: ${invalid.join(",")})`);
  }
  try {
    return atob(b64);
  } catch {
    throw new Error(`${label}: Base64 konnte nicht dekodiert werden`);
  }
}


function loadWwdrCertificate(): any {
  const raw = (WWDR_PEM ?? "").trim().replace(/\\n/g, "\n");
  if (raw.includes("-----BEGIN CERTIFICATE-----")) {
    return forge.pki.certificateFromPem(raw);
  }
  // .cer-Datei als Base64 (DER) hinterlegt
  const der = base64ToBinaryString(raw, "APPLE_WWDR_PEM");
  return forge.pki.certificateFromAsn1(forge.asn1.fromDer(der));
}

function signManifest(manifest: Uint8Array): Uint8Array {
  const p12Der = base64ToBinaryString(P12_B64, "APPLE_PASS_CERT_P12");
  if (p12Der.charCodeAt(0) !== 0x30) {
    throw new Error("APPLE_PASS_CERT_P12 ist keine gültige .p12/PKCS#12-Datei (Base64 der Binärdatei erwartet)");
  }
  let p12: any;
  try {
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, P12_PASS || "");
  } catch (e: any) {
    throw new Error(`.p12 konnte nicht gelesen werden (falsches Passwort oder beschädigte Datei): ${e?.message ?? e}`);
  }

  let cert: any = null;
  let key: any = null;
  const certs: any[] = [];
  for (const safeContents of p12.safeContents) {
    for (const bag of safeContents.safeBags) {
      if (bag.cert) certs.push(bag.cert);
      if ((bag.type === forge.pki.oids.pkcs8ShroudedKeyBag || bag.type === forge.pki.oids.keyBag) && bag.key) key = bag.key;
    }
  }
  if (key) {
    const modulus = key.n?.toString(16);
    cert = certs.find((c) => c.publicKey?.n?.toString(16) === modulus) ?? null;
  }
  if (!cert) {
    cert = certs.find((c) => String(c.subject?.getField("CN")?.value ?? "").includes("Pass Type ID")) ?? certs[0] ?? null;
  }
  if (!cert || !key) throw new Error("Pass-Zertifikat oder privater Schlüssel konnte nicht aus der .p12 gelesen werden");

  const wwdr = loadWwdrCertificate();

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(bytesToBinary(manifest));
  p7.addCertificate(cert);
  p7.addCertificate(wwdr);
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return binaryToBytes(der);
}


// ---------- Bilder ----------
// Apple akzeptiert ausschließlich echte PNGs. Ein HTML-Fehlerseiten-Body oder
// ein SVG würde den Pass ungültig machen -> Signatur prüfen.
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const isPng = (b: Uint8Array) => b.length > 8 && PNG_MAGIC.every((v, i) => b[i] === v);
const FALLBACK_ICON_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAAAYUlEQVR4nO3PAQ3AIADAMI4o/Au4p+MCkr1VsD3jXd/4gXk74BSjNUZrjNYYrTFaY7TGaI3RGqM1RmuM1hitMVpjtMZojdEaozVGa4zWGK0xWmO0xmiN0RqjNUZrjNYYrdnz/QJ1Ry/LogAAAABJRU5ErkJggg==";
const fallbackIcon = () => binaryToBytes(atob(FALLBACK_ICON_B64));

let imageCache: Record<string, Uint8Array> | null = null;
async function loadImages(): Promise<Record<string, Uint8Array>> {
  if (imageCache) return imageCache;
  const out: Record<string, Uint8Array> = {};
  let logo: Uint8Array | null = null;
  try {
    const res = await fetch(`${SITE_URL}/brand/metropol-logo-white.png`);
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (isPng(buf)) logo = buf;
      else console.warn("Logo ist kein gültiges PNG – Fallback wird verwendet");
    }
  } catch (err) {
    console.warn("Logo konnte nicht geladen werden", err);
  }
  const icon = fallbackIcon();
  const brand = logo ?? icon;
  out["icon.png"] = icon;
  out["icon@2x.png"] = icon;
  out["logo.png"] = brand;
  out["logo@2x.png"] = brand;
  imageCache = out;
  return out;
}


// ---------- Daten ----------
function fmtDate(d: any) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtTime(t: any) {
  if (!t) return "—";
  const m = String(t).match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : String(t);
}
function isoFrom(date: any, time: any): string | null {
  if (!date) return null;
  const d = String(date).slice(0, 10);
  const t = time ? String(time).slice(0, 8).padEnd(8, "0") : "00:00:00";
  const dt = new Date(`${d}T${t}+02:00`);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

serveHandler();
function serveHandler() {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    try {
      const url = new URL(req.url);
      const serial = url.searchParams.get("serial") ?? "";
      const token = url.searchParams.get("token") ?? "";
      if (!serial || !token) {
        return new Response(JSON.stringify({ error: "serial und token erforderlich" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const missing = missingCredentials();
      if (missing.length) {
        return new Response(JSON.stringify({
          error: "Apple-Wallet-Zertifikate fehlen im Backend",
          missing_credentials: missing,
          hint: "Pass Type ID, Team ID, Pass-Zertifikat (.p12, base64) und Apple WWDR-Zertifikat (PEM) hinterlegen.",
        }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: passRow } = await admin.from("wallet_passes")
        .select("*").eq("serial_number", serial).eq("auth_token", token).maybeSingle();
      if (!passRow || passRow.is_voided) {
        return new Response(JSON.stringify({ error: "Pass nicht gefunden oder ungültig" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Echte Buchungsdaten laden
      let front: any = {};
      let back: Array<{ key: string; label: string; value: string }> = [];
      let ticketNumber = serial;
      let relevantDate: string | null = null;

      if (passRow.booking_type === "tour") {
        const { data: b } = await admin.from("tour_bookings")
          .select(`booking_number, contact_first_name, contact_last_name, contact_email, contact_phone,
                   participants, created_at, total_price,
                   tour_dates ( departure_date, departure_time, return_date, return_time ),
                   package_tours ( title, destination, hotel_name, hotel_address ),
                   pickup_stops:tour_pickup_stops!tour_bookings_pickup_stop_id_fkey ( location_name, city, departure_time )`)
          .eq("id", passRow.tour_booking_id).maybeSingle();
        if (!b) throw new Error("Buchung nicht gefunden");
        const td: any = b.tour_dates ?? {};
        const t: any = b.package_tours ?? {};
        const pu: any = b.pickup_stops ?? {};
        ticketNumber = b.booking_number;
        relevantDate = isoFrom(td.departure_date, pu.departure_time || td.departure_time);
        front = {
          from: pu.city || pu.location_name || "Abfahrtsort",
          to: t.destination || t.title || "Reiseziel",
          departure: `${fmtDate(td.departure_date)} · ${fmtTime(pu.departure_time || td.departure_time)}`,
          ret: `${fmtDate(td.return_date)} · ${fmtTime(td.return_time)}`,
          passenger: `${b.contact_first_name ?? ""} ${b.contact_last_name ?? ""}`.trim(),
          seat: `${b.participants ?? 1} Pers.`,
          travelType: "Pauschalreise",
        };
        back = [
          { key: "company", label: "Veranstalter", value: "METROPOL TOURS · Metours" },
          { key: "booking", label: "Buchungsnummer", value: ticketNumber },
          { key: "passenger", label: "Fahrgast", value: front.passenger || "—" },
          { key: "trip", label: "Reise", value: t.title || t.destination || "—" },
          { key: "outbound", label: "Hinreise", value: `${fmtDate(td.departure_date)} · ${fmtTime(pu.departure_time || td.departure_time)}` },
          { key: "inbound", label: "Rückreise", value: `${fmtDate(td.return_date)} · ${fmtTime(td.return_time)}` },
          { key: "origin", label: "Abfahrt", value: pu.location_name ? `${pu.location_name}${pu.city ? `, ${pu.city}` : ""}` : (pu.city || "—") },
          { key: "destination", label: "Ziel", value: t.destination || "—" },
          { key: "seat", label: "Sitzplatz / Personen", value: front.seat },
          ...(t.hotel_name ? [{ key: "hotel", label: "Hotel", value: `${t.hotel_name}${t.hotel_address ? `\n${t.hotel_address}` : ""}` }] : []),
          { key: "period", label: "Reisezeitraum", value: `${fmtDate(td.departure_date)} – ${fmtDate(td.return_date)}` },
          { key: "booked", label: "Buchungsdatum", value: fmtDate(b.created_at) },
        ];
      } else {
        const { data: b } = await admin.from("bookings")
          .select(`ticket_number, passenger_first_name, passenger_last_name, created_at,
                   trips ( departure_date, departure_time, arrival_date, arrival_time, routes ( name ) ),
                   origin_stop:stops!bookings_origin_stop_id_fkey ( name, city ),
                   destination_stop:stops!bookings_destination_stop_id_fkey ( name, city ),
                   seats ( seat_number )`)
          .eq("id", passRow.booking_id).maybeSingle();
        if (!b) throw new Error("Buchung nicht gefunden");
        const trip: any = b.trips ?? {};
        const o: any = b.origin_stop ?? {};
        const d: any = b.destination_stop ?? {};
        const seat: any = b.seats ?? {};
        ticketNumber = b.ticket_number;
        relevantDate = isoFrom(trip.departure_date, trip.departure_time);
        front = {
          from: o.city || o.name || "Abfahrt",
          to: d.city || d.name || "Ziel",
          departure: `${fmtDate(trip.departure_date)} · ${fmtTime(trip.departure_time)}`,
          ret: `${fmtDate(trip.arrival_date || trip.departure_date)} · ${fmtTime(trip.arrival_time)}`,
          passenger: `${b.passenger_first_name ?? ""} ${b.passenger_last_name ?? ""}`.trim(),
          seat: seat.seat_number || "—",
          travelType: trip?.routes?.name || "Buslinie",
        };
        back = [
          { key: "company", label: "Veranstalter", value: "METROPOL TOURS · Metours" },
          { key: "booking", label: "Buchungsnummer", value: ticketNumber },
          { key: "passenger", label: "Fahrgast", value: front.passenger || "—" },
          { key: "trip", label: "Reise", value: front.travelType },
          { key: "outbound", label: "Hinreise", value: front.departure },
          { key: "inbound", label: "Rückreise", value: `${fmtDate(trip.arrival_date || trip.departure_date)} · ${fmtTime(trip.arrival_time)}` },
          { key: "origin", label: "Abfahrt", value: o.name ? `${o.name}${o.city ? `, ${o.city}` : ""}` : (o.city || "—") },
          { key: "destination", label: "Ziel", value: d.name ? `${d.name}${d.city ? `, ${d.city}` : ""}` : (d.city || "—") },
          { key: "seat", label: "Sitzplatz", value: front.seat },
          { key: "booked", label: "Buchungsdatum", value: fmtDate(b.created_at) },
        ];
      }

      back.push(
        { key: "contact", label: "Kontakt", value: "Tel. +49 511 80781106\nkundenservice@metours.de" },
        { key: "website", label: "Website", value: "https://www.metours.de" },
        { key: "luggage", label: "Gepäck", value: "1 Koffer (max. 20 kg) + 1 Handgepäckstück pro Person. Zusätzliches Gepäck bitte vorab anmelden." },
        { key: "notes", label: "Wichtige Reisehinweise", value: "Bitte seien Sie 20 Minuten vor Abfahrt am Abfahrtsort. Gültiger Lichtbildausweis erforderlich. Dieser Pass gilt als elektronisches Ticket – QR-Code beim Einstieg bereithalten." },
      );

      const passJson = {
        formatVersion: 1,
        passTypeIdentifier: PASS_TYPE_ID,
        teamIdentifier: TEAM_ID,
        organizationName: "METROPOL TOURS",
        description: `Metours Ticket ${ticketNumber}`,
        serialNumber: passRow.serial_number,
        authenticationToken: passRow.auth_token,
        webServiceURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/`,
        backgroundColor: "rgb(0,204,54)",
        foregroundColor: "rgb(255,255,255)",
        labelColor: "rgb(255,255,255)",
        sharingProhibited: false,
        ...(relevantDate ? { relevantDate } : {}),
        barcodes: [{
          format: "PKBarcodeFormatQR",
          message: JSON.stringify({ ticket: ticketNumber, serial: passRow.serial_number, type: passRow.booking_type }),
          messageEncoding: "iso-8859-1",
          altText: ticketNumber,
        }],
        boardingPass: {
          transitType: "PKTransitTypeBus",
          headerFields: [{ key: "seat", label: "SITZPLATZ", value: front.seat }],
          primaryFields: [
            { key: "from", label: "VON", value: front.from },
            { key: "to", label: "NACH", value: front.to },
          ],
          secondaryFields: [
            { key: "passenger", label: "FAHRGAST", value: front.passenger || "—" },
            { key: "departure", label: "ABFAHRT", value: front.departure },
          ],
          auxiliaryFields: [
            { key: "type", label: "REISEART", value: front.travelType },
            { key: "return", label: "RÜCKREISE", value: front.ret },
          ],
          backFields: back,
        },
      };

      const enc = new TextEncoder();
      const images = await loadImages();
      const files: { name: string; data: Uint8Array }[] = [
        { name: "pass.json", data: enc.encode(JSON.stringify(passJson)) },
        ...Object.entries(images).map(([name, data]) => ({ name, data })),
      ];

      const manifest: Record<string, string> = {};
      for (const f of files) manifest[f.name] = sha1Hex(f.data);
      const manifestBytes = enc.encode(JSON.stringify(manifest));
      const signature = signManifest(manifestBytes);

      const pkpass = zip([
        ...files,
        { name: "manifest.json", data: manifestBytes },
        { name: "signature", data: signature },
      ]);

      await admin.from("wallet_passes").update({ last_updated: new Date().toISOString() }).eq("id", passRow.id);

      return new Response(pkpass, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": `attachment; filename="metours-${ticketNumber}.pkpass"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err: any) {
      console.error("apple-wallet-pass failed", err);
      return new Response(JSON.stringify({ error: err?.message || "Pass konnte nicht erzeugt werden" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  });
}
