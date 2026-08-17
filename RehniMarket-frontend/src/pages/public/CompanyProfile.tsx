import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CompanyProfile from "@/features/public/company/components/CompanyProfile";

export default function CompanyProfilePage() {
  return (
    <div>
      <NavBar />
      <CompanyProfile />
      <Footer />
    </div>
  );
}
