// ---------------------------------------------------
// API URL + ROLES
// ---------------------------------------------------
const ENV = import.meta.env;

// These are also the roles
export const ROLE_BASED_API_URLS = {
    Admin: `${ENV.VITE_API_URL}/api/admin`,
    Employee: `${ENV.VITE_API_URL}/api/employee`,
    Supervisor: `${ENV.VITE_API_URL}/api/supervisor`,
    Personnel: `${ENV.VITE_API_URL}/api/personnel`,
} as const;

export type UserRole = keyof typeof ROLE_BASED_API_URLS;

export const BUILT_IN_API_URLS = {
    login: `${ENV.VITE_API_URL}/api/login`,                                                                // POST
    logout: `${ENV.VITE_API_URL}/api/logout`,                                                              // DELETE
    register: `${ENV.VITE_API_URL}/api/register`,                                                          // POST
    getUserData: `${ENV.VITE_API_URL}/api/users/me`,                                                       // GET
    updateUserData: `${ENV.VITE_API_URL}/api/users`, // extend with /<id>                                  // PATCH
    updatePassword: `${ENV.VITE_API_URL}/api/users/password`,                                              // PATCH
    deleteUser: `${ENV.VITE_API_URL}/api/users`,  // extend with /<id>                                     // DELETE
    verify: `${ENV.VITE_API_URL}/api/verify`,  // used to verify if user currently logged in or not        // GET
    sessions: `${ENV.VITE_API_URL}/api/login-sessions`                                                          // GET, DELETE only
} as const;
export const PRIVATE_ROUTE_FIRST_PATH = "/dashboard";

// ---------------------------------------------------
// SignalR
// ---------------------------------------------------
export const HUBS_URL = `${import.meta.env.VITE_API_URL}/hubs`;

// ---------------------------------------------------
// Sidebar Buttons
// ---------------------------------------------------
export type SidebarButton = {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
};

export type PrivateRoute = {
  path: string;
  element: React.ReactNode;
  roles: UserRole[];
};

export const SIDEBAR_BUTTONS: SidebarButton[] = [
  // =================================================
  // DASHBOARD
  // =================================================
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
        />
      </svg>
    `,
    roles: ["Admin", "Employee", "Supervisor", "Personnel"],
  },

  // =================================================
  // ADMIN
  // =================================================
  {
    label: "Users & Roles",
    path: "/admin/users-roles",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8zm6 0a3 3 0 100-6 3 3 0 000 6z"
        />
      </svg>
    `,
    roles: ["Admin"],
  },
  {
    label: "Asset Registry",
    path: "/admin/asset-registry",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4"
        />
      </svg>
    `,
    roles: ["Admin"],
  },
  {
    label: "Maintenance Budget",
    path: "/admin/maintenance-budget",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8c-4 0-7 1.5-7 4s3 4 7 4 7-1.5 7-4-3-4-7-4zm0 8v4m0-16v4M5 12V7m14 5V7"
        />
      </svg>
    `,
    roles: ["Admin"],
  },
  {
    label: "Maintenance Vendors",
    path: "/admin/maintenance-vendors",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h.01M15 10h.01"
        />
      </svg>
    `,
    roles: ["Admin"],
  },
  {
    label: "Maintenance Contracts",
    path: "/admin/maintenance-contracts",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm3 4h4m-4 4h4m-4 4h4"
        />
      </svg>
    `,
    roles: ["Admin"],
  },
  {
    label: "Maintenance Records",
    path: "/admin/maintenance-records",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 4h14v16H5V4zm3 4h8m-8 4h8m-8 4h5"
        />
      </svg>
    `,
    roles: ["Admin"],
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8"
        />
      </svg>
    `,
    roles: ["Admin"],
  },
  {
    label: "System Activity Logs",
    path: "/admin/system-activity-logs",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 5h16v14H4V5zm3 4h10m-10 4h10m-10 4h6"
        />
      </svg>
    `,
    roles: ["Admin"],
  },

  // =================================================
  // EMPLOYEE
  // =================================================
  {
    label: "Assigned Assets",
    path: "/employee/assigned-assets",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4"
        />
      </svg>
    `,
    roles: ["Employee"],
  },
  {
    label: "Report an Issue",
    path: "/employee/report-an-issue",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v4m0 4h.01M10.3 4.3L2.6 18a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z"
        />
      </svg>
    `,
    roles: ["Employee"],
  },
  {
    label: "My Maintenance Requests",
    path: "/employee/my-maintenance-requests",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 3h12v18H6V3zm3 4h6m-6 4h6m-6 4h4"
        />
      </svg>
    `,
    roles: ["Employee"],
  },
  {
    label: "Maintenance Status",
    path: "/employee/maintenance-status",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    `,
    roles: ["Employee"],
  },
  {
    label: "Maintenance History",
    path: "/employee/maintenance-history",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 5h16v14H4V5zm4 4h8m-8 4h8m-8 4h5"
        />
      </svg>
    `,
    roles: ["Employee"],
  },

  // =================================================
  // SUPERVISOR
  // =================================================
  {
    label: "Maintenance Requests",
    path: "/supervisor/maintenance-requests",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 3h12v18H6V3zm3 4h6m-6 4h6m-6 4h4"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "Maintenance Planning",
    path: "/supervisor/maintenance-planning",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "Maintenance Assignments",
    path: "/supervisor/maintenance-assignments",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8z"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "Maintenance Schedule",
    path: "/supervisor/maintenance-schedule",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "External Maintenance",
    path: "/supervisor/external-maintenance",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M14.7 6.3a4 4 0 01-5 5L4 17a2 2 0 102.8 2.8l5.7-5.7a4 4 0 005-5l-2.8 2.8-2.8-2.8 2.8-2.8z"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "Budget Requests",
    path: "/supervisor/budget-requests",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 2v20m5-16H9a3 3 0 000 6h6a3 3 0 010 6H7"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "Maintenance Approval",
    path: "/supervisor/maintenance-approval",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 12l4 4L19 6"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "Maintenance Monitoring",
    path: "/supervisor/maintenance-monitoring",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
    `,
    roles: ["Supervisor"],
  },
  {
    label: "Maintenance Reports",
    path: "/supervisor/maintenance-reports",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8"
        />
      </svg>
    `,
    roles: ["Supervisor"],
  },

  // =================================================
  // PERSONNEL
  // =================================================
  {
    label: "Assigned Maintenance",
    path: "/personnel/assigned-maintenance",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m5-5H4a1 1 0 00-1 1v14a1 1 0 001 1h16a1 1 0 001-1V6a1 1 0 00-1-1z"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },
  {
    label: "Asset Inspection",
    path: "/personnel/asset-inspection",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5m-6 7l2 2 5-5"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },
  {
    label: "Maintenance Checklist",
    path: "/personnel/maintenance-checklist",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 4h14v16H5V4zm3 4l1 1 2-2m1 1h4m-7 4l1 1 2-2m1 1h4"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },
  {
    label: "Repair & Maintenance",
    path: "/personnel/repair-maintenance",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M14.7 6.3a4 4 0 01-5 5L4 17a2 2 0 102.8 2.8l5.7-5.7a4 4 0 005-5l-2.8 2.8-2.8-2.8 2.8-2.8z"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },
  {
    label: "Outsource Recommendation",
    path: "/personnel/outsource-recommendation",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 12h16m-6-6l6 6-6 6"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },
  {
    label: "My Maintenance History",
    path: "/personnel/my-maintenance-history",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },
  {
    label: "Parts & Materials",
    path: "/personnel/parts-materials",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4m-16 5l8 4 8-4"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },
  {
    label: "Maintenance Reports",
    path: "/personnel/maintenance-reports",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8"
        />
      </svg>
    `,
    roles: ["Personnel"],
  },

  // =================================================
  // ACCOUNT
  // =================================================
  {
    label: "Account",
    path: "/account",
    icon: `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5.121 17.804A10.95 10.95 0 0112 15c2.5 0 4.847.84 6.879 2.254M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    `,
    roles: ["Admin", "Employee", "Supervisor", "Personnel"],
  },
];


// ---------------------------------------------------
// Navbar Buttons
// ---------------------------------------------------
export const NAVBAR_BUTTONS: { label: string; path: string }[] = [
    {
        label: "Home",
        path: "/"
    },
    {
        label: "About",
        path: "/about"
    },
    {
        label: "Changelogs",
        path: "/changelogs"
    }
];

export const NAVBAR_HEADER = "Asset Maintenance and Monitoring System";

import type React from "react";
// ---------------------------------------------------
// Register Page
// ---------------------------------------------------
import type { HTMLInputTypeAttribute } from "react";

export interface RegisterFieldsProps {
    label: string;
    id: string;
    type: HTMLInputTypeAttribute;

    // optional validation
    pattern?: string; // regex string
    required?: boolean;
    minLength?: number;
    maxLength?: number;

    placeholder?: string;
}

export const REGISTER_FIELDS: RegisterFieldsProps[] = [
    {
        label: "First Name",
        id: "first_name",
        type: "text",
        required: true,
        minLength: 2,
        maxLength: 30,
        placeholder: "John",
    },
    {
        label: "Middle Name",
        id: "middle_name",
        type: "text",
        required: false,
        minLength: 2,
        maxLength: 30,
        placeholder: "Michael",
    },
    {
        label: "Last Name",
        id: "last_name",
        type: "text",
        required: true,
        minLength: 2,
        maxLength: 30,
        placeholder: "Doe",
    },
    {
        label: "Birth Date",
        id: "birth_date",
        type: "date",
        required: true,
    },
    {
        label: "Email",
        id: "email",
        type: "email",
        required: true,
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        placeholder: "you@example.com",
    },
    {
        label: "Password",
        id: "password",
        type: "password",
        required: true,
        minLength: 8,
        placeholder: "••••••••",
    },
    {
        label: "Confirm Password",
        id: "confirm_password",
        type: "password",
        required: true,
        minLength: 8,
        placeholder: "••••••••",
    },
];

// ---------------------------------------------------
// Footer
// ---------------------------------------------------
export const FOOTER_BUTTONS: Record<
  string,
  { label: string; href?: string }[]
> = {
   "Capstone Project By": [
    { label: "Khian Victory D. Calderon", href: "https://github.com/khianvictorycalderon" },
    { label: "Dishiela Ingrid M. Camunag", href: "https://github.com/Dishiela12" },
    { label: "Rafael L. Metran", href: "https://github.com/Raaafael" },
  ],

  References: [
    { label: "GitHub Source Code", href: "https://github.com/khianvictorycalderon/Asset-Maintenance-System" },
    { label: "Blogs", href: "#" },
    { label: "Guide", href: "#" },
  ],
};

export const PRIVATE_FOOTER_LABEL = "Asset Maintenance and Monitoring System";

// ---------------------------------------------------
// About Page
// ---------------------------------------------------
export const ABOUT_DESCRIPTION: string = "An asset maintenance and monitoring system designed to help automotive manufacturing companies manage, monitor, and maintain their operational assets.";
export const ABOUT: { title: string; desc: string }[] = [
    {
        title: "What is this system?",
        desc: "The <strong>Asset Maintenance and Monitoring System</strong> is a centralized platform designed to help an automotive manufacturing company manage its assets and maintenance activities more efficiently.",
    },
    {
        title: "What does it do?",
        desc: "The system helps authorized personnel <strong>monitor assets, manage maintenance activities, and keep track of asset-related information</strong> through a centralized web application.",
    },
    {
        title: "Who is it for?",
        desc: "The system is intended for authorized <strong>administrators, employees, supervisors, and personnel</strong> involved in asset management and maintenance operations."
    },
];

// ---------------------------------------------------
// Changelogs Page
// ---------------------------------------------------
export const CHANGELOGS: { release: string; changes: string[] }[] = [
    {
        release: "1.0.1",
        changes: [
            "Updated public pages with system information and documentation.",
            "Improved navigation and user-facing content."
        ]
    },
    {
        release: "1.0.0",
        changes: [
            "Initial release of the Asset Maintenance and Monitoring System.", 
            "Implemented role-based access for system users.",
            "Added account and authentication functionality.",
        ]
    },
  ];


// ---------------------------------------------------
// Guide Page
// ---------------------------------------------------
export const GUIDE_DESCRIPTION: string =
    "A practical guide to using the Asset Maintenance and Monitoring System.";

export const GUIDE: { title: string; desc: string }[] = [
    {
        title: "Getting Started",
        desc: "blah blah",
    },
];

// ---------------------------------------------------
// Blog Page
// ---------------------------------------------------
export const BLOG_DESCRIPTION: string =
    "Articles and insights about asset maintenance and monitoring in automotive manufacturing.";

export const BLOG: { title: string; desc: string }[] = [
    {
        title: "Why Asset Maintenance Matters in Automotive Manufacturing",
        desc: "blah blah",
    },
];
  
// ---------------------------------------------------
// Terms and Conditions
// ---------------------------------------------------
export const TERMS_LAST_UPDATED_DATE: string = "September 1, 2026";
export const TERMS_CONDITIONS: { title: string; desc: string }[] = [
    {
        title: "Authorized Use",
        desc: "This system is intended for authorized users involved in asset management and maintenance operations within the organization. Users are expected to use the system only for legitimate work-related purposes."
    },
    {
        title: "Account Responsibility",
        desc: "Users are responsible for maintaining the confidentiality of their account credentials and for all activities performed through their account. Users should report suspected unauthorized access to the appropriate administrator."
    },
    {
        title: "Access and Permissions",
        desc: "Access to system features and information is determined by the user's assigned role and permissions. Users must only access information and functionality necessary for their assigned responsibilities and must not attempt to bypass or modify access restrictions."
    },
    {
        title: "System Information",
        desc: "Users should provide accurate and appropriate information when recording or updating asset and maintenance-related data. Information entered into the system may be used to support maintenance operations and monitoring."
    },
    {
        title: "Acceptable Use",
        desc: "Users must not intentionally misuse, disrupt, damage, or attempt to gain unauthorized access to the system or its data."
    },
    {
        title: "System Availability",
        desc: "The system may occasionally be unavailable due to maintenance, updates, technical issues, network conditions, or other operational circumstances. Reasonable efforts may be made to maintain system availability, but uninterrupted access cannot be guaranteed."
    },
        {
        title: "Account Suspension or Termination",
        desc: "User access may be suspended, restricted, or terminated when authorization is revoked, an account is no longer required, or there is a suspected violation of system policies or security requirements."
    },
    {
        title: "Changes to These Terms",
        desc: "These Terms and Conditions may be updated from time to time to reflect changes to the system, organizational practices, operational requirements, or applicable policies. The latest version and its effective date will be made available through the system."
    },
];

// ---------------------------------------------------
// Privacy Policy
// ---------------------------------------------------
export const PRIVACY_LAST_UPDATED_DATE: string = "September 1, 2026";
export const PRIVACY_POLICY: { title: string; desc: string }[] = [
    {
      title: "Information We Collect",
      desc: "The system may collect information necessary for account management and system operations, such as user names, email addresses, account information, and asset or maintenance records entered into the system."
    },
    {
      title: "Use of Information",
      desc: "Information collected through the system is used to support asset management, maintenance monitoring, user authentication, and other legitimate system operations."
    },
        {
        title: "Data Access",
        desc: "Access to system information is restricted according to the user's assigned role and permissions. Users should only access information necessary for their responsibilities."
    },
    {
        title: "Data Security",
        desc: "Reasonable security measures are implemented to help protect account information and system data from unauthorized access or misuse."
    },
    {
        title: "Data Retention",
        desc: "Information may be retained for as long as reasonably necessary to support legitimate operational, administrative, security, record-keeping, and organizational requirements. Retention periods may vary depending on the type and purpose of the information."
    },
    {
        title: "Privacy Requests and Concerns",
        desc: "Users with questions, concerns, or requests regarding their personal information or its use within the system should contact the appropriate organizational administrator or designated privacy contact. Requests may be handled in accordance with applicable organizational policies and requirements."
    },
    {
        title: "Changes to This Privacy Policy",
        desc: "This Privacy Policy may be updated from time to time to reflect changes to the system, information-handling practices, organizational requirements, or applicable policies. The latest version and its effective date will be made available through the system."
    },
];

// ---------------------------------------------------
// Not Found Page
// ---------------------------------------------------
export const NOT_FOUND_MESSAGE: { main: string; additional: string } = {
    main: "Page not found",
    additional: "The page you're looking for doesn't exist or has been moved."
};