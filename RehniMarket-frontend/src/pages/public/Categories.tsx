import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CategoriesGrid from "@/features/public/categories/components/CategoriesGrid";

export default function Categories() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-1">
      <NavBar />

      <main className="flex-1">
        <CategoriesGrid />
      </main>

      <Footer />
    </div>
  );
}
