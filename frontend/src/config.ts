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

export const NAVBAR_HEADER = "Asset Maintenance System";

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
  { label: string; href: string }[]
> = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Documentation", href: "/docs" },
    { label: "Updates", href: "/changelogs" },
  ],

  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],

  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/help" },
    { label: "Community", href: "/community" },
  ],

  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export const PRIVATE_FOOTER_LABEL = "Asset Maintenance and Monitoring System";

// ---------------------------------------------------
// About Page
// ---------------------------------------------------
export const ABOUT_DESCRIPTION: string = "A simple overview of this application";
export const ABOUT: { title: string; desc: string }[] = [
    {
        title: "What is this?",
        desc: "This is <strong>blah blah blah</strong> with <em>HTML support</em>.",
    },
    {
        title: "How did it come to this?",
        desc: "It went through like this <br/> blah blah <u>blah</u>",
    },
];

// ---------------------------------------------------
// Changelogs Page
// ---------------------------------------------------
export const CHANGELOGS: { release: string; changes: string[] }[] = [
    {
        release: "1.0.1",
        changes: [
            "Added feature X",
            "Added feature Y"
        ]
    },
    {
        release: "1.0.0",
        changes: [
            "Initial Release", 
            "Built with blah blah blah"
        ]
    },
  ];

// ---------------------------------------------------
// Terms and Conditions
// ---------------------------------------------------
export const TERMS_LAST_UPDATED_DATE: string = "May 3, 2026 @ 8:00 PM";
export const TERMS_CONDITIONS: { title: string; desc: string }[] = [
    {
        title: "Usage",
        desc: "Blah blah blah"
    },
    {
        title: "Legal Framework",
        desc: "Blah blah blah"
    }
];

// ---------------------------------------------------
// Privacy Policy
// ---------------------------------------------------
export const PRIVACY_LAST_UPDATED_DATE: string = "May 3, 2026 @ 8:00 PM";
export const PRIVACY_POLICY: { title: string; desc: string }[] = [
    {
      title: "Data",
      desc: "Blah blah blah"
    },
    {
      title: "Third Party",
      desc: "Blah blah blah"
    }
];

// ---------------------------------------------------
// Not Found Page
// ---------------------------------------------------
export const NOT_FOUND_MESSAGE: { main: string; additional: string } = {
    main: "Page not found",
    additional: "The page you're looking for doesn't exist or has been moved."
};