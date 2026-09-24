import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { BUILT_IN_API_URLS, PRIVATE_ROUTE_FIRST_PATH } from "../config";

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    // Eye open
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    // Eye closed
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.5-4.166M6.5 6.5A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.966 9.966 0 01-1.98 3.462M3 3l18 18" />
    </svg>
  );

const inputClass = `
  w-full px-4 py-3 rounded-xl
  border border-zinc-300/70 dark:border-zinc-700/60
  bg-white/80 dark:bg-zinc-800/60
  text-zinc-900 dark:text-zinc-100
  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
  focus:outline-none
  focus:border-orange-500
  focus:ring-2 focus:ring-orange-500/30
  transition
`;

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await axios.post(
        BUILT_IN_API_URLS.login,
        { email, password },
        { withCredentials: true }
      );

      navigate(PRIVATE_ROUTE_FIRST_PATH, { replace: true });

    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="
      min-h-screen w-full flex items-center justify-center px-6
      bg-cover bg-center relative bg-fixed
      "
      style={{ backgroundImage: `url("/images/NEM_mechanical.jpg")` }}
    >
  <div className="absolute inset-0 bg-orange-950/60 backdrop-blur-[2px]" />
      {/* Card */}
      <div className="
        relative z-10
        w-full max-w-md space-y-6
        rounded-3xl p-8
        border border-white/30
        bg-white/90 dark:bg-zinc-950/85
        backdrop-blur-xl
        shadow-2xl shadow-orange-950/30
      ">

        {/* Back */}
        <Link
          to="/"
          className="
            text-sm inline-flex items-center gap-1
            text-orange-700 dark:text-orange-300
            hover:text-orange-900 dark:hover:text-orange-100
            transition
          "
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-orange-50">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500 dark:text-orange-50/80">
            Login to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm text-zinc-700 dark:text-orange-50">
              Email / Username
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm text-zinc-700 dark:text-orange-50">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="
              text-sm px-3 py-2 rounded-md
              bg-red-50 dark:bg-red-950/40
              text-red-600 dark:text-red-400
              border border-red-200/60 dark:border-red-900/40
              text-center
            ">
              {error}
            </p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              cursor-pointer
              w-full py-3 rounded-xl
              bg-orange-600
              text-white
              font-semibold
              shadow-lg shadow-orange-600/25
              hover:bg-orange-700
              hover:shadow-orange-600/40
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline transition"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}