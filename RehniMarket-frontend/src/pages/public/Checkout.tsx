import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CheckoutView from "@/features/cart/components/CheckoutView";

export default function CheckoutPage() {
  return (
    <div>
      <NavBar />
      <CheckoutView />
      <Footer />
    </div>
  );
}
