import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DocumentType = "confirmation" | "invoice" | "voucher" | "travelplan" | "all";

interface UseTourDocumentsOptions {
  bookingId?: string;
  bookingNumber?: string;
}

export const useTourDocuments = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDocument = async (
    options: UseTourDocumentsOptions,
    documentType: DocumentType = "all"
  ) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tour-documents", {
        body: {
          bookingId: options.bookingId,
          bookingNumber: options.bookingNumber,
          documentType,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.documents) {
        throw new Error("Dokumente konnten nicht generiert werden");
      }

      return data.documents as Record<string, string>;
    } catch (error: any) {
      console.error("Error generating documents:", error);
      toast.error("Fehler beim Generieren der Dokumente");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const openDocument = async (
    options: UseTourDocumentsOptions,
    documentType: DocumentType
  ) => {
    const printWindow = window.open("", "_blank");
    printWindow?.document.write('<!doctype html><html><body style="font-family:system-ui;padding:24px">Dokument wird vorbereitet…</body></html>');
    printWindow?.document.close();

    const docs = await generateDocument(options, documentType);
    if (!docs) {
      printWindow?.close();
      return;
    }

    const html = docs[documentType];
    if (!html) {
      toast.error("Dokument nicht verfügbar");
      printWindow?.close();
      return;
    }

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      downloadHtmlFile(html, documentType, options);
    }
  };

  const downloadHtmlFile = (html: string, type: string, options: UseTourDocumentsOptions) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-${options.bookingNumber || options.bookingId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllDocuments = async (options: UseTourDocumentsOptions) => {
    const docs = await generateDocument(options, "all");
    if (!docs) return;

    const docTypes: DocumentType[] = ["confirmation", "invoice", "voucher", "travelplan"];
    const docLabels: Record<string, string> = {
      confirmation: "Buchungsbestätigung",
      invoice: "Rechnung",
      voucher: "Hotel-Voucher",
      travelplan: "Reiseplan",
    };

    let downloadedCount = 0;

    // Use staggered downloads to avoid browser blocking
    for (let i = 0; i < docTypes.length; i++) {
      const type = docTypes[i];
      if (docs[type]) {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            downloadHtmlFile(docs[type], type, options);
            downloadedCount++;
            resolve();
          }, i * 500); // 500ms delay between each download
        });
      }
    }

    if (downloadedCount > 0) {
      toast.success(`${downloadedCount} Reiseunterlagen heruntergeladen!`);
    }
  };

  return { generateDocument, openDocument, downloadAllDocuments, isGenerating };
};
