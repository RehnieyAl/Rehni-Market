import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CategoriesGrid from "@/features/public/categories/components/CategoriesGrid";

// Mismo patrón que pages/public/Products.tsx: página delgada que solo
// arma NavBar + contenido + Footer, toda la lógica vive en
// features/public/categories/*.
export default function Categories() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <main className="flex-1">
        <CategoriesGrid />
      </main>

      <Footer />
    </div>
  );
}
