import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/public/Home";
import RegisterUser from "../pages/auth/RegisterUser";
import RegisterCompany from "../pages/auth/RegisterCompany";
import VerifyEmail from "../pages/auth/VerifyEmail"
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Dashboard from "../pages/company/Dashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/verify-email" element={<VerifyEmail />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/forgot-password" element={<ForgotPassword />}/>
        <Route path="/reset-password" element={<ResetPassword />}/>
        <Route path="/company/dashboard" element={<Dashboard />}/>
      </Routes>
    </BrowserRouter>
  );
}