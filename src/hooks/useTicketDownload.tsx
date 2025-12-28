import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadOptions {
  bookingId?: string;
  ticketNumber?: string;
  email?: string;
}

export const useTicketDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadTicket = async (options: string | DownloadOptions) => {
    setIsDownloading(true);
    
    try {
      // Support both old API (bookingId string) and new API (options object)
      let body: DownloadOptions;
      if (typeof options === 'string') {
        body = { bookingId: options };
      } else {
        body = options;
      }

      const { data, error } = await supabase.functions.invoke('generate-ticket-pdf', {
        body,
      });

      if (error) throw error;

      if (!data?.ticketHtml) {
        throw new Error('Ticket konnte nicht generiert werden');
      }

      // Create a new window with the ticket HTML and trigger print/save
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.ticketHtml);
        printWindow.document.close();
        
        // Optional: Auto-trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        // Fallback: Download as HTML file
        const blob = new Blob([data.ticketHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${data.ticketNumber}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('Ticket erfolgreich generiert!');
      return true;
    } catch (error: any) {
      console.error('Error downloading ticket:', error);
      if (error.message?.includes('401') || error.message?.includes('403')) {
        toast.error('Zugriff verweigert. Bitte überprüfen Sie Ihre Angaben.');
      } else if (error.message?.includes('429')) {
        toast.error('Zu viele Anfragen. Bitte warten Sie einen Moment.');
      } else {
        toast.error('Fehler beim Generieren des Tickets');
      }
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadTicket, isDownloading };
};
