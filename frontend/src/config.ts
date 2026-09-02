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
        roles: ["Admin", "Employee", "Supervisor", "Personnel"]
    },
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
        roles: ["Admin", "Employee", "Supervisor", "Personnel"]
    }
];

export const TOPNAV_HEADER = "Asset Maintenance Portal";

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