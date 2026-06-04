import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import ExcosPage from "./pages/ExcosPage";
import BotPage from "./pages/BotPage";
import RegionsPage from "./pages/RegionsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage";
import GalleryPage from "./pages/GalleryPage";
import AlbumPage from "./pages/AlbumPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RequireAdmin from "./components/RequireAdmin";
import RequireMember from "./components/RequireMember";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import ExcosAdminPage from "./pages/admin/ExcosAdminPage";
import BotAdminPage from "./pages/admin/BotAdminPage";
import RegionsAdminPage from "./pages/admin/RegionsAdminPage";
import AnnouncementsAdminPage from "./pages/admin/AnnouncementsAdminPage";
import GalleryAdminPage from "./pages/admin/GalleryAdminPage";

export default function App() {
  return (
    <Routes>
      {/* Pages with shared header/footer */}
      <Route element={<PublicLayout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:id" element={<AlbumPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Members-only. Logged-out visitors are redirected to /login. The
            server also requires a session on these pages' API endpoints. */}
        <Route element={<RequireMember />}>
          <Route path="/about/excos" element={<ExcosPage />} />
          <Route path="/about/bot" element={<BotPage />} />
          <Route path="/about/regions" element={<RegionsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
          {/* Not built yet, but gated so they don't leak to logged-out users. */}
          <Route path="/events" element={<ComingSoonPage />} />
          <Route path="/donate" element={<ComingSoonPage />} />
          <Route path="/decides" element={<ComingSoonPage />} />
        </Route>

        {/* Unknown public routes fall back to a placeholder. */}
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
          <Route path="announcements" element={<AnnouncementsAdminPage />} />
          <Route path="gallery" element={<GalleryAdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
