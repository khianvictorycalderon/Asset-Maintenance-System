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
import AssetRegistry from "./private_pages/Admin/AssetRegistry";
import MaintenanceBudget from "./private_pages/Admin/MaintenanceBudget";
import MaintenanceContracts from "./private_pages/Admin/MaintenanceContracts";
import MaintenanceRecords from "./private_pages/Admin/MaintenanceRecords";
import MaintenanceVendors from "./private_pages/Admin/MaintenanceVendors";
import AdminReports from "./private_pages/Admin/Reports";
import SystemActivityLogs from "./private_pages/Admin/SystemActivityLogs";
import UsersRoles from "./private_pages/Admin/UsersRoles";

// Employee pages
import AssignedAssets from "./private_pages/Employee/AssignedAssets";
import MaintenanceHistory from "./private_pages/Employee/MaintenanceHistory";
import MaintenanceStatus from "./private_pages/Employee/MaintenanceStatus";
import MyMaintenanceRequests from "./private_pages/Employee/MyMaintenanceRequests";
import ReportAnIssue from "./private_pages/Employee/ReportAnIssue";

// Supervisor pages
import BudgetRequests from "./private_pages/Supervisor/BudgetRequests";
import ExternalMaintenance from "./private_pages/Supervisor/ExternalMaintenance";
import MaintenanceApproval from "./private_pages/Supervisor/MaintenanceApproval";
import MaintenanceAssignments from "./private_pages/Supervisor/MaintenanceAssignments";
import MaintenanceMonitoring from "./private_pages/Supervisor/MaintenanceMonitoring";
import MaintenancePlanning from "./private_pages/Supervisor/MaintenancePlanning";
import SupervisorMaintenanceReports from "./private_pages/Supervisor/MaintenanceReports";
import MaintenanceRequests from "./private_pages/Supervisor/MaintenanceRequests";
import MaintenanceSchedule from "./private_pages/Supervisor/MaintenanceSchedule";

// Personnel pages
import AssetInspection from "./private_pages/Personnel/AssetInspection";
import AssignedMaintenance from "./private_pages/Personnel/AssignedMaintenance";
import MaintenanceChecklist from "./private_pages/Personnel/MaintenanceChecklist";
import PersonnelMaintenanceReports from "./private_pages/Personnel/MaintenanceReports";
import MyMaintenanceHistory from "./private_pages/Personnel/MyMaintenanceHistory";
import OutsourceRecommendation from "./private_pages/Personnel/OutsourceRecommendation";
import PartsMaterials from "./private_pages/Personnel/PartsMaterials";
import RepairMaintenance from "./private_pages/Personnel/RepairMaintenance";

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
  { path: "/admin/asset-registry", element: <AssetRegistry /> },
  { path: "/admin/maintenance-budget", element: <MaintenanceBudget /> },
  { path: "/admin/maintenance-vendors", element: <MaintenanceVendors /> },
  { path: "/admin/maintenance-contracts", element: <MaintenanceContracts /> },
  { path: "/admin/maintenance-records", element: <MaintenanceRecords /> },
  { path: "/admin/reports", element: <AdminReports /> },
  { path: "/admin/system-activity-logs", element: <SystemActivityLogs /> },

  // Employee
  { path: "/employee/assigned-assets", element: <AssignedAssets /> },
  { path: "/employee/report-an-issue", element: <ReportAnIssue /> },
  { path: "/employee/my-maintenance-requests", element: <MyMaintenanceRequests /> },
  { path: "/employee/maintenance-status", element: <MaintenanceStatus /> },
  { path: "/employee/maintenance-history", element: <MaintenanceHistory /> },

  // Supervisor
  { path: "/supervisor/maintenance-requests", element: <MaintenanceRequests /> },
  { path: "/supervisor/maintenance-planning", element: <MaintenancePlanning /> },
  { path: "/supervisor/maintenance-assignments", element: <MaintenanceAssignments /> },
  { path: "/supervisor/maintenance-schedule", element: <MaintenanceSchedule /> },
  { path: "/supervisor/external-maintenance", element: <ExternalMaintenance /> },
  { path: "/supervisor/budget-requests", element: <BudgetRequests /> },
  { path: "/supervisor/maintenance-approval", element: <MaintenanceApproval /> },
  { path: "/supervisor/maintenance-monitoring", element: <MaintenanceMonitoring /> },
  { path: "/supervisor/maintenance-reports", element: <SupervisorMaintenanceReports /> },

  // Personnel
  { path: "/personnel/assigned-maintenance", element: <AssignedMaintenance /> },
  { path: "/personnel/asset-inspection", element: <AssetInspection /> },
  { path: "/personnel/maintenance-checklist", element: <MaintenanceChecklist /> },
  { path: "/personnel/repair-maintenance", element: <RepairMaintenance /> },
  { path: "/personnel/outsource-recommendation", element: <OutsourceRecommendation /> },
  { path: "/personnel/my-maintenance-history", element: <MyMaintenanceHistory /> },
  { path: "/personnel/parts-materials", element: <PartsMaterials /> },
  { path: "/personnel/maintenance-reports", element: <PersonnelMaintenanceReports /> },
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