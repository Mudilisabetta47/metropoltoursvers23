import TourBookingsTab from "@/components/admin/TourBookingsTab";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminTourBookings = () => {
  return (
    <AdminLayout title="Reise-Buchungen" subtitle="Alle Pauschalreise-Buchungen verwalten">
      <TourBookingsTab />
    </AdminLayout>
  );
};

export default AdminTourBookings;
