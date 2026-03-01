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
    const docs = await generateDocument(options, documentType);
    if (!docs) return;

    const html = docs[documentType];
    if (!html) {
      toast.error("Dokument nicht verfügbar");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      // Fallback: download as HTML
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentType}-${options.bookingNumber || options.bookingId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const downloadAllDocuments = async (options: UseTourDocumentsOptions) => {
    const docs = await generateDocument(options, "all");
    if (!docs) return;

    // Open each in a new tab
    const docTypes: DocumentType[] = ["confirmation", "invoice", "voucher", "travelplan"];
    for (const type of docTypes) {
      if (docs[type]) {
        const blob = new Blob([docs[type]], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}-${options.bookingNumber || options.bookingId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
    toast.success("Alle Reiseunterlagen heruntergeladen!");
  };

  return { generateDocument, openDocument, downloadAllDocuments, isGenerating };
};
