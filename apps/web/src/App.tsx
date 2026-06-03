import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import ExcosPage from "./pages/ExcosPage";
import BotPage from "./pages/BotPage";
import RegionsPage from "./pages/RegionsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RequireAdmin from "./components/RequireAdmin";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import ExcosAdminPage from "./pages/admin/ExcosAdminPage";
import BotAdminPage from "./pages/admin/BotAdminPage";
import RegionsAdminPage from "./pages/admin/RegionsAdminPage";

export default function App() {
  return (
    <Routes>
      {/* Public pages with shared header/footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about/excos" element={<ExcosPage />} />
        <Route path="/about/bot" element={<BotPage />} />
        <Route path="/about/regions" element={<RegionsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Public pages not yet built fall back to a placeholder (Sprint 3+). */}
        <Route path="*" element={<ComingSoonPage />} />
      </Route>

      {/* Auth pages use their own centered shell */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin route group. Server re-checks role on every request */}
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="excos" element={<ExcosAdminPage />} />
          <Route path="bot" element={<BotAdminPage />} />
          <Route path="regions" element={<RegionsAdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
