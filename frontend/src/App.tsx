import { useEffect } from "react";
import { getTheme, setTheme } from "./utils/theme";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFoundPage from "./public_pages/NotFound";
import Login from "./public_pages/Login";
import Register from "./public_pages/Register";
import LandingPage from "./public_pages/LandingPage";
import PrivateLayout from "./layouts/PrivateLayout";
import Dashboard from "./private_pages/Dashboard";
import Account from "./private_pages/Account";
import PublicLayout from "./layouts/PublicLayout";
import About from "./public_pages/About";
import Changelogs from "./public_pages/Changelogs";
import SlideToTop from "./components/SlideToTop";
import PrivacyPolicy from "./public_pages/PrivacyPolicy";
import TermsConditions from "./public_pages/TermsConditions";
import PublicLayoutRedirect from "./layouts/PublicLayoutRedirect";

// Admin pages
import SystemActivityLogs from "./private_pages/Admin/SystemActivityLogs";
import UsersRoles from "./private_pages/AdminUserRoles";

// Employee pages
import AssetRegistry from "./private_pages/Employee/AssetRegistry";
import AssetsAssignment from "./private_pages/Employee/AssetsAssignment";
import AssignPersonnel from "./private_pages/Employee/AssignPersonnel";
import MaintenanceReport from "./private_pages/Employee/MaintenanceReport";

// Supervisor pages
import AssignedAssets from "./private_pages/Supervisor/AssignedAssets";
import MaintenanceAssignment from "./private_pages/Supervisor/MaintenanceAssignment";
import MaintenanceSchedule from "./private_pages/Supervisor/MaintenanceSchedule";

// Personnel pages
import MaintenanceTasks from "./private_pages/Personnel/MaintenanceTasks";

const PUBLIC_PAGES = [
  { path: "/", element: <LandingPage /> },
  { path: "/about", element: <About /> },
  { path: "/changelogs", element: <Changelogs /> },
  { path: "/privacy-policy", element: <PrivacyPolicy /> },
  { path: "/terms-and-conditions", element: <TermsConditions /> },
];

const PUBLIC_PAGES_REDIRECT = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
];

const PRIVATE_PAGES = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/account", element: <Account /> },
  
  // Admin
  { path: "/admin/users-roles", element: <UsersRoles /> },
  { path: "/admin/system-activity-logs", element: <SystemActivityLogs /> },
  
  // Employee
  { path: "/employee/asset-registry", element: <AssetRegistry /> },
  { path: "/employee/assets-assignment", element: <AssetsAssignment /> },
  { path: "/employee/assign-personnel", element: <AssignPersonnel /> },
  { path: "/employee/maintenance-report", element: <MaintenanceReport /> },
  
  // Supervisor
  { path: "/supervisor/assigned-assets", element: <AssignedAssets /> },
  { path: "/supervisor/maintenance-assignment", element: <MaintenanceAssignment /> },
  { path: "/supervisor/maintenance-schedule", element: <MaintenanceSchedule /> },
  
  // Personnel
  { path: "/personnel/maintenance-tasks", element: <MaintenanceTasks /> },
  { path: "/personnel/asset-list", element: <MaintenanceTasks /> },
];

export default function App() {

  // Theme initializer
  useEffect(() => {
    setTheme(getTheme());
  }, []);

  return (
    <BrowserRouter>
      <SlideToTop/>
      <Routes>

        {/* Public pages without any layout */}
        <Route element={<PublicLayoutRedirect/>}>
          {PUBLIC_PAGES_REDIRECT.map((page, i) => (
            <Route key={i} path={page.path} element={page.element} />
          ))}
        </Route>

        {/* Public pages with navbar layout */}
        <Route element={<PublicLayout/>}>
          {PUBLIC_PAGES.map((page, i) => (
            <Route key={i} path={page.path} element={page.element} />
          ))}
        </Route>

        {/* Private pages (with sidebar layout) */}
        <Route element={<PrivateLayout />}>
          {PRIVATE_PAGES.map((page, i) => (
            <Route key={i} path={page.path} element={page.element} />
          ))}
        </Route>

        {/* Error page */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  );
}