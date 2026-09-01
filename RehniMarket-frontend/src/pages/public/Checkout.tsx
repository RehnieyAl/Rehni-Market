import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CheckoutView from "@/features/cart/components/CheckoutView";

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <main className="flex-1">
        <CheckoutView />
      </main>

      <Footer />
    </div>
  );
}
