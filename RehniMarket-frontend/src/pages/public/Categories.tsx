import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CategoriesGrid from "@/features/public/categories/components/CategoriesGrid";

// Mismo patrón que pages/public/Products.tsx: página delgada que solo
// arma NavBar + contenido + Footer, toda la lógica vive en
// features/public/categories/*.
export default function Categories() {
  return (
    <div>
      <NavBar />
      <CategoriesGrid />
      <Footer />
    </div>
  );
}
