import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTicketDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadTicket = async (bookingId: string) => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ticket-pdf', {
        body: { bookingId },
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
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Fehler beim Generieren des Tickets');
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadTicket, isDownloading };
};
