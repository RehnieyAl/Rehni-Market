import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CartView from "@/features/cart/components/CartView";

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-1">
      <NavBar />

      <main className="flex-1">
        <CartView />
      </main>

      <Footer />
    </div>
  );
}
