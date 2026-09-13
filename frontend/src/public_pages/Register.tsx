import { useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { BUILT_IN_API_URLS, REGISTER_FIELDS } from "../config";

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character";
  return null;
};

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.5-4.166M6.5 6.5A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.966 9.966 0 01-1.98 3.462M3 3l18 18" />
    </svg>
  );

const ROLES = [
  {
    id: "Office Employees",
    label: "Office Employees",
    value: "Employee",
    icon: "/office.svg",
    background: "/register-office.jpg",
  },
  {
    id: "Maintenance Supervisor",
    label: "Maintenance Supervisor",
    value: "Supervisor",
    icon: "/maintenance.svg",
    background: "/register-maintenance.jpg",
  },
  {
    id: "On-Site Personnel",
    label: "On-Site Personnel",
    value: "Personnel",
    icon: "/onsite.svg",
    background: "/register-onsite.jpg",
  },
];

const ROLE_MAP = ROLES.map((role) => ({
  label: role.id,
  value: role.value,
}));


export default function Register() {
    const [form, setForm] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [params] = useSearchParams();
    const initialRole = params.get("role");

    const [role, setRole] = useState(
       initialRole &&
    ["Office Employees", "Maintenance Supervisor", "On-Site Personnel"].includes(initialRole)
    ? initialRole
    : "Office Employees"
    );

    // Track visibility per password field id
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

    const toggleShow = (id: string) =>
      setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleChange = (id: string, value: string) => {
      setForm((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
      e.preventDefault();

      const weakError = validatePassword(form.password || "");
      if (weakError) {
        setError(weakError);
        return;
      }

      if (form.password !== form.confirm_password) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      setError("");
      setSuccess(false);

      try {
        const backendRole = ROLE_MAP.find(
          (item) => item.label === role
        )?.value;

        await axios.post(BUILT_IN_API_URLS.register, {
          ...form,
          role: backendRole,
        });        
        setSuccess(true);
        setForm({});
      } catch (err: unknown) {
        if (err instanceof Error) {
        setError(err?.message || "Registration failed");
        }
      } finally {
        setLoading(false);
      }
    };

    const baseInputClass = `
      w-full px-3 py-2 rounded-md
      border border-orange-200 dark:border-orange-800
      bg-white/70 dark:bg-zinc-900/80
      text-zinc-900 dark:text-zinc-100
      placeholder:text-zinc-400 dark:placeholder:text-zinc-500
      focus:outline-none
      focus:ring-2 focus:ring-orange-500/30
      focus:border-orange-500
      transition
    `;

    const isPasswordField = (id: string) => id === "password" || id === "confirm_password";

    return (
      <div className="
          min-h-screen w-full flex items-center justify-center 
          px-6 py-8
          bg-orange-100
          relative overflow-hidden
          bg-fixed
          "
          style={{ backgroundImage: `
          linear-gradient(
          rgba(67, 32, 8, 0.60),
          rgba(120, 53, 15, 0.68)
            ),
          url('${ROLES.find((item) => item.id === role)?.background}')
            `,
        backgroundSize: "cover",
        backgroundPosition: "center",
       }}>

        {/* Card */}
        <div className="
          relative z-10
          w-full max-w-2xl space-y-6
          bg-white/95 dark:bg-zinc-950/95
          backdrop-blur-xl
          border border-orange-200 dark:border-orange-900
          rounded-3xl p-8
          shadow-2xl shadow-black/30
        ">

          {/* Back */}
          <Link
            to="/"
            className="text-sm text-orange-700 dark:text-orange-300 hover:text-orange-500 dark:hover:text-orange-200 transition"
          >
            ← Back to Home
          </Link>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-semibold text-orange-600">
              Create account
            </h1>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Fill in your details
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
          <label className="text-sm font-medium text-orange-950 dark:text-orange-100">
             Select your role
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES.map((item) => (
          <button
          key={item.id}
          type="button"
          onClick={() => setRole(item.id)}
          className={`
          flex items-center gap-3
          px-4 py-3
          rounded-xl
          border
          text-left
          cursor-pointer
          transition-all duration-200

          ${
            role === item.id
              ? "bg-orange-600 dark:bg-orange-700 text-white border-orange-600 dark:border-orange-600 shadow-lg shadow-orange-900/30"
              : "bg-orange-100 dark:bg-zinc-900 text-orange-950 dark:text-orange-100 border-orange-300 dark:border-orange-700 hover:bg-orange-400 dark:hover:bg-orange-600"
          }
        `}
      >
            {/* Icon - LEFT */}
            <img
                src={item.icon}
                alt=""
                className="w-12 h-12 shrink-0 object-contain"
            />

            {/* Text - RIGHT */}
            <span className="text-sm font-semibold">
              {item.label}
            </span>
                  </button>
                ))}
              </div>
            </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REGISTER_FIELDS.map((field) => (
                <div key={field.id} className="space-y-1">

                  <label className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    {field.label}
                  </label>

                  {isPasswordField(field.id) ? (
                    <div className="relative">
                      <input
                        type={showPassword[field.id] ? "text" : "password"}
                        value={form[field.id] || ""}
                        required={field.required}
                        minLength={field.minLength}
                        maxLength={field.maxLength}
                        placeholder={field.placeholder}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={`${baseInputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShow(field.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition"
                        tabIndex={-1}
                      >
                        <EyeIcon open={!!showPassword[field.id]} />
                      </button>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.id] || ""}
                      required={field.required}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      pattern={field.pattern}
                      placeholder={field.placeholder}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={baseInputClass}
                    />
                  )}

                  {field.id === "password" && (
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Min 8 chars, uppercase, lowercase, number, special character.
                    </p>
                  )}

                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="
                text-center text-sm px-3 py-2 rounded-md
                bg-red-50 dark:bg-red-950/40
                text-red-600 dark:text-red-400
                border border-red-200/60 dark:border-red-900/40
              ">
                {error}
              </div>
            )}

            {success && (
              <div className="
                text-center px-4 py-3 rounded-md
                bg-emerald-50 dark:bg-emerald-950/40
                border border-emerald-200/60 dark:border-emerald-900/40
                text-emerald-700 dark:text-emerald-300
              ">
                Account created successfully 🎉
                <div className="mt-2">
                  <Link to="/login" className="text-sm underline hover:opacity-80">
                    Go to login
                  </Link>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                cursor-pointer
                w-full py-2 rounded-md
                bg-orange-600 dark:bg-orange-800
                text-white
                hover:bg-orange-700 dark:hover:bg-orange-700
                shadow-lg shadow-orange-900/30
                disabled:opacity-50 disabled:cursor-not-allowed
                transition
              "
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-600 hover:text-orange-700 hover:underline">
              Login
            </Link>
          </p>

        </div>
      </div>
    );
}