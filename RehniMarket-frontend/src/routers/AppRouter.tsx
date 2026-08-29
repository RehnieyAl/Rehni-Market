import { BrowserRouter, Routes, Route } from "react-router-dom";

import RequireAuth from "@/shared/components/auth/RequireAuth";
import ScrollToTop from "@/shared/components/ScrollToTop";

import Home from "../pages/public/Home";
import Categories from "../pages/public/Categories";
import Products from "../pages/public/Products";
import Offers from "../pages/public/Offers";
import NewProducts from "../pages/public/NewProducts";
import ProductsDetail from "../pages/public/ProductsDetail";
import CompanyProfilePage from "../pages/public/CompanyProfile";
import CartPage from "../pages/public/Cart";
import CheckoutPage from "../pages/public/Checkout";

import RegisterUser from "@/features/public/auth/pages/RegisterUser";
import RegisterCompany from "@/features/public/auth/pages/RegisterCompany";
import VerifyEmail from "@/features/public/auth/pages/VerifyEmail";
import Login from "@/features/public/auth/pages/Login";
import ForgotPassword from "@/features/public/auth/pages/ForgotPassword";
import ResetPassword from "@/features/public/auth/pages/ResetPassword";

import Company from "../pages/dashboard/Company";
import Admin from "../pages/dashboard/Admin";
import UserDashboard from "../pages/user/Dashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/products" element={<Products />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/new" element={<NewProducts />} />
        <Route path="/products/:id" element={<ProductsDetail />} />
        <Route path="/company/:companyId" element={<CompanyProfilePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboards */}
        <Route
          path="/company/dashboard"
          element={
            <RequireAuth>
              <Company />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth>
              <Admin />
            </RequireAuth>
          }
        />
        <Route
          path="/user/dashboard"
          element={
            <RequireAuth>
              <UserDashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}