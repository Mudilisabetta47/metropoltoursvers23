import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, BorderStyle,
} from "docx";
import type { CompanyData } from "./types";
import { describePartySignature, formatDayDE } from "./signatureDates";

type Block =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "li"; text: string }
  | { type: "spacer" };

/** Sehr schlanker Markdown-Parser für Vertragstexte (Überschriften, Listen, Fettdruck). */
export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    if (line.trim() === "") { blocks.push({ type: "spacer" }); continue; }
    if (line.startsWith("### ")) blocks.push({ type: "h3", text: line.slice(4) });
    else if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3) });
    else if (line.startsWith("# ")) blocks.push({ type: "h1", text: line.slice(2) });
    else if (/^[-*]\s+/.test(line)) blocks.push({ type: "li", text: line.replace(/^[-*]\s+/, "") });
    else blocks.push({ type: "p", text: line });
  }
  return blocks;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inlineHtml = (s: string) =>
  escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>");

/** Zerlegt einen Absatz in Fett-/Normal-Segmente. */
function inlineRuns(text: string): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) =>
    part.startsWith("**") && part.endsWith("**")
      ? new TextRun({ text: part.slice(2, -2), bold: true })
      : new TextRun({ text: part }),
  );
}

export interface ExportPayload {
  body: string;
  company: CompanyData;
  contractNumber: string;
  employeeName: string;
  signatureEmployee?: string | null;
  signatureEmployer?: string | null;
  /** Frei gewählte Daten (YYYY-MM-DD) und echte Signaturzeitpunkte (vom Server). */
  documentDate?: string | null;
  contractDate?: string | null;
  plannedSignDateEmployer?: string | null;
  plannedSignDateEmployee?: string | null;
  signedEmployerAt?: string | null;
  signedEmployeeAt?: string | null;
}

function signatureLines(payload: ExportPayload) {
  return {
    employer: describePartySignature({ place: payload.company.city, plannedDate: payload.plannedSignDateEmployer, signedAt: payload.signedEmployerAt }),
    employee: describePartySignature({ place: payload.company.city, plannedDate: payload.plannedSignDateEmployee, signedAt: payload.signedEmployeeAt }),
  };
}

export function contractToHtml(payload: ExportPayload): string {
  const { body, company, contractNumber, employeeName } = payload;
  const blocks = parseBlocks(body);
  const html: string[] = [];
  let inList = false;
  for (const b of blocks) {
    if (b.type !== "li" && inList) { html.push("</ul>"); inList = false; }
    switch (b.type) {
      case "h1": html.push(`<h1>${inlineHtml(b.text)}</h1>`); break;
      case "h2": html.push(`<h2>${inlineHtml(b.text)}</h2>`); break;
      case "h3": html.push(`<h3>${inlineHtml(b.text)}</h3>`); break;
      case "li":
        if (!inList) { html.push("<ul>"); inList = true; }
        html.push(`<li>${inlineHtml(b.text)}</li>`);
        break;
      case "p": html.push(`<p>${inlineHtml(b.text)}</p>`); break;
      case "spacer": html.push('<div class="sp"></div>'); break;
    }
  }
  if (inList) html.push("</ul>");

  const lines = signatureLines(payload);
  const sig = (img: string | null | undefined, caption: string, l: { dateLine: string; eSignLine: string | null }) => `
    <div class="sigbox">
      <div class="sigdate">${escapeHtml(l.dateLine)}</div>
      ${img ? `<img src="${escapeHtml(img)}" alt="Unterschrift ${escapeHtml(caption)}" />` : '<div class="sigempty"></div>'}
      <div class="sigline"></div>
      <div class="sigcaption">${escapeHtml(caption)}</div>
      ${l.eSignLine ? `<div class="sigproof">${escapeHtml(l.eSignLine)}</div>` : ""}
    </div>`;
  const contractDay = formatDayDE(payload.contractDate);
  const documentDay = formatDayDE(payload.documentDate);

  return `<!doctype html><html lang="de"><head><meta charset="utf-8" />
<title>Arbeitsvertrag ${escapeHtml(contractNumber)} – ${escapeHtml(employeeName)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #111; font-size: 11.5pt; line-height: 1.6; margin: 0; }
  header.doc { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00CC36; padding-bottom: 10px; margin-bottom: 22px; }
  header.doc img.logo { max-height: 52px; }
  header.doc .meta { text-align: right; font-size: 9pt; color: #555; line-height: 1.4; }
  h1 { font-size: 18pt; margin: 0 0 14px; letter-spacing: .5px; }
  h2 { font-size: 12.5pt; margin: 20px 0 6px; border-bottom: 1px solid #e2e2e2; padding-bottom: 3px; }
  h3 { font-size: 11.5pt; margin: 14px 0 4px; }
  p { margin: 0 0 6px; }
  ul { margin: 0 0 8px 18px; padding: 0; }
  li { margin: 2px 0; }
  .sp { height: 7px; }
  .signatures { display: flex; gap: 40px; margin-top: 48px; page-break-inside: avoid; }
  .sigbox { flex: 1; }
  .sigbox img { max-height: 60px; display: block; margin-bottom: 2px; }
  .sigempty { height: 62px; }
  .sigline { border-top: 1px solid #111; }
  .sigcaption { font-size: 9pt; color: #444; margin-top: 4px; }
  .sigdate { font-size: 10pt; margin-bottom: 6px; }
  .sigproof { font-size: 8pt; color: #555; margin-top: 3px; }
  footer.doc { margin-top: 30px; border-top: 1px solid #e2e2e2; padding-top: 8px; font-size: 8.5pt; color: #666; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<header class="doc">
  <div>${company.logo_url ? `<img class="logo" src="${escapeHtml(company.logo_url)}" alt="${escapeHtml(company.name)} Logo" />` : `<strong>${escapeHtml(company.name)}</strong>`}</div>
  <div class="meta">
    Vertragsnummer: <strong>${escapeHtml(contractNumber)}</strong><br />
    ${contractDay ? `Vertragsdatum: ${escapeHtml(contractDay)}<br />` : ""}
    ${documentDay ? `Erstellt am: ${escapeHtml(documentDay)}<br />` : ""}
    ${escapeHtml(company.address || "")}<br />
    ${escapeHtml(company.commercial_register || "")}
  </div>
</header>
${html.join("\n")}
<div class="signatures">
  ${sig(payload.signatureEmployer || company.signature_url, `${company.name} – ${company.managing_director || "Arbeitgeber"}`, lines.employer)}
  ${sig(payload.signatureEmployee, `${employeeName} – Arbeitnehmer`, lines.employee)}
</div>
<footer class="doc">${escapeHtml(company.name)} · ${escapeHtml(company.address || "")} · ${escapeHtml(company.commercial_register || "")} · Steuernummer ${escapeHtml(company.tax_number || "—")}${company.vat_id ? ` · USt-IdNr. ${escapeHtml(company.vat_id)}` : ""}</footer>
</body></html>`;
}

/** Öffnet den Druckdialog – dort kann direkt gedruckt oder als PDF gespeichert werden. */
export function printContract(payload: ExportPayload) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) throw new Error("Popup blockiert – bitte Popups für diese Seite erlauben.");
  win.document.open();
  win.document.write(contractToHtml(payload));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

async function dataUrlToUint8(dataUrl: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export async function exportContractDocx(payload: ExportPayload) {
  const { body, company, contractNumber, employeeName } = payload;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: company.name, bold: true, size: 24 })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "00CC36", space: 4 } },
    }),
    new Paragraph({
      children: [new TextRun({
        text: [
          `Vertragsnummer ${contractNumber}`,
          formatDayDE(payload.contractDate) ? `Vertragsdatum ${formatDayDE(payload.contractDate)}` : null,
          formatDayDE(payload.documentDate) ? `Erstellt am ${formatDayDE(payload.documentDate)}` : null,
        ].filter(Boolean).join(" · "),
        size: 18, color: "666666",
      })],
      spacing: { after: 240 },
    }),
  );

  for (const b of parseBlocks(body)) {
    if (b.type === "spacer") { children.push(new Paragraph({ children: [] })); continue; }
    if (b.type === "h1") {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: inlineRuns(b.text), spacing: { after: 200 } }));
    } else if (b.type === "h2") {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: inlineRuns(b.text), spacing: { before: 200, after: 120 } }));
    } else if (b.type === "h3") {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: inlineRuns(b.text), spacing: { before: 160, after: 100 } }));
    } else if (b.type === "li") {
      children.push(new Paragraph({ numbering: { reference: "contract-bullets", level: 0 }, children: inlineRuns(b.text) }));
    } else {
      children.push(new Paragraph({ children: inlineRuns(b.text), spacing: { after: 80 } }));
    }
  }

  const lines = signatureLines(payload);
  const addSignature = async (img: string | null | undefined, caption: string, l: { dateLine: string; eSignLine: string | null }) => {
    children.push(new Paragraph({ children: [] }));
    children.push(new Paragraph({ children: [new TextRun({ text: l.dateLine, size: 20 })], spacing: { after: 80 } }));
    if (img && img.startsWith("data:image")) {
      const data = await dataUrlToUint8(img);
      if (data) {
        children.push(new Paragraph({
          children: [new ImageRun({
            type: "png",
            data,
            transformation: { width: 180, height: 60 },
            altText: { title: caption, description: caption, name: caption },
          })],
        }));
      }
    }
    children.push(
      new Paragraph({ children: [new TextRun({ text: "____________________________________" })] }),
      new Paragraph({ children: [new TextRun({ text: caption, size: 18, color: "444444" })], spacing: { after: l.eSignLine ? 40 : 200 } }),
    );
    if (l.eSignLine) {
      children.push(new Paragraph({ children: [new TextRun({ text: l.eSignLine, size: 16, color: "555555" })], spacing: { after: 200 } }));
    }
  };

  children.push(new Paragraph({ children: [], spacing: { before: 400 } }));
  await addSignature(payload.signatureEmployer, `${company.name} – ${company.managing_director || "Arbeitgeber"}`, lines.employer);
  await addSignature(payload.signatureEmployee, `${employeeName} – Arbeitnehmer`, lines.employee);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    numbering: {
      config: [{
        reference: "contract-bullets",
        levels: [{
          level: 0, format: "bullet" as any, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1247, right: 1134, bottom: 1247, left: 1134 } } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Arbeitsvertrag_${contractNumber}_${employeeName.replace(/\s+/g, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
