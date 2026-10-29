/*

UI Design NOTES:
- Always use neutral colors, not text-white, not text-black, not text-zinc, especially not text-gray, this applies to any style, bg, border, etc... (Even text, should not text-white nor text-black). You can use text-neutral-50 for white text, and text-neutral-950 or text-neutral-900 for black text. This is for white-related and black-related colors only, does not affect the red, blue, green, yellow, etc.... Also take note the project specific main theme color.
- Use proper color hierarchy system like:
  - Light theme:
    - sidebar must be bg-neutral-50
    - main content must be bg-neutral-100 (as defined in private layout, <main> must not have their own bg, it must rely on private layout, just don't put any bg- in <main>)
    - rounded box must be bg-neutral-50 with tables having horizontal borders only (divide-y something like that), and no vertical border, so that it looks good on the eye
    - input must have no bg but relies on border color instead, since there is no lighter neutral color than neutral-50
  - Dark theme:
    - sidebar must be bg-neutral-800
    - main content must be bg-neutral-900 (as defined in private layout, <main> must not have their own bg, it must rely on private layout, just don't put any bg- in <main>)
    - rounded box must be bg-neutral-800 with tables having horizontal borders only (divide-y something like that), and no vertical border, so that it looks good on the eye
    - input must be bg-neutral-700
  (As you can see, the hierarchy is something like this, the more front it is in z index, the lighter it is)
- Always use pop-modal for every edit for better UX.
- Sometimes, light theme is better to have the main theme color (for example orange is the main theme project color, it should be more dominant in the light theme than in dark theme because of contrast issues, therefore improving UX).
- Unified margin (use what already in private layout and don't create a separate margin inside a content of a component).

Architectural NOTES:
- If possible, make a dedicated component for input field, table, and box, as these 3 are the most commonly used in systems management.
- Always use pagination for private layout pages.
- Search, filter, with any field, and date range is a must to all system.
- STRICTLY One .tsx, .ejs, or .php file per page, no more, if you want a component, use outside the role directory. So if an employee role has 2 page for example, it must have exactly 2 files inside it, depending on which template was used. So it becomes something like Employee/Reports.tsx, Employee/Tasks.tsx. (This may not be applicable in PHM template since it uses a file-based directory instead, so just in RTAP and EEP). You can use component-based architecture, but it must not be stored somewhere else, not in the private_pages/[roles] for example in RTAP and EEP (PHM is a bit different, because it's file-based directory). STRICTLY DO NOT PUT A COMPONENT IN THE PAGE FILE, use a separate file for example search bar component, no const SearchBar() => {} inside that page file, use components instead. This way the file structure stays clean and readable just by one look.

This template specific notes:
- STRICLY FOLLOW ARCHITECTURAL DESIGN such as:
  - Only the Account.tsx and Dashboard.tsx must be the direct descendant of private_pages folder in frontend as it is the only 2 page that is present in all roles, other pages must be inside their corresponding roles.
  - Backend controller and service layer has 2 options (only 1, cannot be mixed, it looks messy):
    - Option 1: Unified Controllers/AdminController.cs, Services/ControllersAdminServices.cs, and Services/IAdminServices.cs, all the services of admin page stays there, nothing gets out, same as to other roles (useful for small project with few pages)
    - Option 2: Dedicated Controllers and Services such as Controllers/Admin/UserRolesController.cs, Controllers/Admin/SystemActivityLogsController.cs, Services/Admin/UserRolesService.cs, Services/Admin/SystemActivityLogsService.cs, and the Interfaces too, and so on.
  - No icons in the header text, the sidebar icons is already more than enough
*/

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
import UsersRoles from "./private_pages/Admin/UsersRoles";

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
import AssetList from "./private_pages/Personnel/AssetList";

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
  // NOTE: DO NOT put a background on invidiual private pages as it is handled by the private layout itself
  // Bad EXAMPLE: <div className="min-h-full w-full bg-[#f4f4f4] px-0 py-0 text-gray-800 dark:bg-neutral-950 dark:text-gray-100">
  // Example: <div className="min-h-full w-full px-0 py-0 text-gray-800 dark:text-gray-100">
  // Just don't put any bg at all in private pages.

  // NOTE 2: DO NOT USE zinc nor gray color for black and white related colors, just use neutral only or orange (as it is the main color theme of the project).

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
  { path: "/personnel/asset-list", element: <AssetList /> },
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