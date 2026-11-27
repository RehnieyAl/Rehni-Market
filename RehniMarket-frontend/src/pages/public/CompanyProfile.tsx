/** Ruta /company/:companyId: navegación, perfil público de la empresa y pie de página. */
import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CompanyProfile from "@/features/public/company/components/CompanyProfile";

export default function CompanyProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />

      <main className="flex-1">
        <CompanyProfile />
      </main>

      <Footer />
    </div>
  );
}
