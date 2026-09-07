import { Route, Routes, Navigate } from "react-router-dom";
import "./dispo.css";
import DispoDashboard from "./pages/DispoDashboard";
import DispoCalendar from "./pages/DispoCalendar";
import DispoOrders from "./pages/DispoOrders";
import DispoOffers from "./pages/DispoOffers";
import DispoOfferDetail from "./pages/DispoOfferDetail";
import DispoInvoices from "./pages/DispoInvoices";
import DispoInvoiceDetail from "./pages/DispoInvoiceDetail";
import DispoInbox from "./pages/DispoInbox";
import DispoCustomers from "./pages/DispoCustomers";
import DispoAssistant from "./pages/DispoAssistant";
import DispoBuses from "./pages/DispoBuses";
import DispoDrivers from "./pages/DispoDrivers";
import DispoCalc from "./pages/DispoCalc";
import DispoTraining from "./pages/DispoTraining";
import DispoSettings from "./pages/DispoSettings";


export default function DispoApp() {
  return (
    <Routes>
      <Route index element={<DispoDashboard />} />
      <Route path="kalender" element={<DispoCalendar />} />
      <Route path="auftraege" element={<DispoOrders />} />
      <Route path="angebote" element={<DispoOffers />} />
      <Route path="angebot/:id" element={<DispoOfferDetail />} />
      <Route path="rechnungen" element={<DispoInvoices />} />
      <Route path="rechnung/:id" element={<DispoInvoiceDetail />} />
      <Route path="postfach" element={<DispoInbox />} />
      <Route path="kunden" element={<DispoCustomers />} />
      <Route path="assistent" element={<DispoAssistant />} />
      <Route path="busse" element={<DispoBuses />} />
      <Route path="fahrer" element={<DispoDrivers />} />
      <Route path="kalkulation" element={<DispoCalc />} />
      <Route path="ki-training" element={<DispoTraining />} />

      <Route path="einstellungen" element={<DispoSettings />} />
      <Route path="*" element={<Navigate to="/dispo" replace />} />
    </Routes>
  );
}
