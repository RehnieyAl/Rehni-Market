import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CartView from "@/features/cart/components/CartView";

export default function CartPage() {
  return (
    <div>
      <NavBar />
      <CartView />
      <Footer />
    </div>
  );
}
