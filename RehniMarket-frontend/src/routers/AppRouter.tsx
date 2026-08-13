import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/public/Home";
import Products from "../pages/public/Products";
import ProductsDetail from "../pages/public/ProductsDetail";

import RegisterUser from "@/features/public/auth/pages/RegisterUser";
import RegisterCompany from "@/features/public/auth/pages/RegisterCompany";
import VerifyEmail from "@/features/public/auth/pages/VerifyEmail";
import Login from "@/features/public/auth/pages/Login";
import ForgotPassword from "@/features/public/auth/pages/ForgotPassword";
import ResetPassword from "@/features/public/auth/pages/ResetPassword";

import Company from "../pages/dashboard/Company";
import Admin from "../pages/dashboard/Admin";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductsDetail />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboards */}
        <Route path="/company/dashboard" element={<Company />} />
        <Route path="/admin/dashboard" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}