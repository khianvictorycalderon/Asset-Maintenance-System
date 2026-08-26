import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BUILT_IN_API_URLS, REGISTER_FIELDS } from "../config";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { useSignalREvent } from "../utils/useSignalREvent";

type User = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date: string;
  email: string;
};

type Session = {
  id: string;
  ip: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  created_at: string;
  last_seen: string;
  expires_at: string;
  is_current: boolean;
};

type SessionPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const formatDate = (date?: string) => {
  if (!date) return "";
  return date.split("T")[0];
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

const PasswordInput = ({
  placeholder,
  value,
  disabled,
  onChange,
  inputClass,
}: {
  placeholder: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  inputClass: (disabled: boolean) => string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass(disabled)} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer disabled:cursor-not-allowed transition"
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
};

// ── Device / OS icons ──────────────────────────────────────────────────────
const DeviceIcon = ({ device }: { device: string | null }) => {
  const d = (device || "").toLowerCase();
  if (d.includes("mobile") || d.includes("phone")) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15h3" />
      </svg>
    );
  }
  if (d.includes("tablet") || d.includes("ipad")) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  );
};

// ── Session row component ──────────────────────────────────────────────────
const SessionRow = ({
  session,
  onRevoke,
  isRevoking,
}: {
  session: Session;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) => {
  const browserLabel = session.browser || "Unknown Browser";
  const osLabel = session.os || "Unknown OS";
  const deviceLabel = session.device || "Desktop";
  const ipLabel = session.ip || "Unknown IP";

  return (
    <div
      className={`
        flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors
        ${session.is_current
          ? "border-neutral-400 dark:border-neutral-500 bg-neutral-50 dark:bg-neutral-700/50"
          : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50"
        }
      `}
    >
      {/* Icon + info */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`
          mt-0.5 shrink-0 p-2 rounded-lg
          ${session.is_current
            ? "text-neutral-900 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-600"
            : "text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700"
          }
        `}>
          <DeviceIcon device={session.device} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {browserLabel}
            </span>
            {session.is_current && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500 inline-block" />
                Current
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span>{osLabel}</span>
            <span>·</span>
            <span>{deviceLabel}</span>
            <span>·</span>
            <span className="font-mono">{ipLabel}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-400 dark:text-neutral-500">
            <span>
              <span className="text-neutral-500 dark:text-neutral-400">Signed in:</span>{" "}
              {formatDateTime(session.created_at)}
            </span>
            <span>
              <span className="text-neutral-500 dark:text-neutral-400">Expires:</span>{" "}
              {formatDateTime(session.expires_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Revoke button */}
      {!session.is_current && (
        <button
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
          className={`
            shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition
            border-neutral-300 dark:border-neutral-600
            text-neutral-700 dark:text-neutral-300
            bg-white dark:bg-neutral-900
            ${isRevoking
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 cursor-pointer"
            }
          `}
        >
          Revoke
        </button>
      )}
    </div>
  );
};

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [infoMessage, setInfoMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });
  const [sessionMessage, setSessionMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionPagination, setSessionPagination] = useState<SessionPagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
        const res = await axios.get(
            BUILT_IN_API_URLS.getUserData,
            { withCredentials: true }
        );

        const userData = res.data.user;

        const normalized = {
            ...userData,
            birth_date: formatDate(userData.birth_date)
        };

        setUser(normalized);
        setForm(normalized);

    } catch {
        setUser(null);
    } finally {
        setLoading(false);
    }
  }, []);


  useEffect(() => {
      fetchUser();
  }, [fetchUser]);

  const fetchSessions = useCallback(async (page = 1) => {
    setSessionsLoading(true);
    try {
      const res = await axios.get(`${BUILT_IN_API_URLS.sessions}?page=${page}`, { withCredentials: true });
      setSessions(res.data.sessions);
      setSessionPagination(res.data.pagination);
    } catch {
      setSessionMessage({ type: "error", text: "Failed to load sessions" });
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // For detecting real-time changes
  useSignalREvent(
    "ProfileUpdated",
    () => {
      fetchUser();
    }
  );

  useEffect(() => {
    fetchSessions(1);
  }, [fetchSessions]);

  useSignalREvent(
    "SessionsUpdated",
    () => {
      fetchSessions(sessionPagination.page);
    }
  );

  if (loading) return <Loading />;

  if (!user) {
    navigate("/");
    return null;
  }

  const profileFields = REGISTER_FIELDS.filter((f) => f.id !== "password" && f.id !== "confirm_password");

  const showMsg = (
    setter: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | null; text: string }>>,
    type: "success" | "error",
    text: string
  ) => {
    setter({ type, text });
    setTimeout(() => setter({ type: null, text: "" }), 3000);
  };

  const handleUpdateInfo = async () => {
    setIsSavingInfo(true);
    try {
      await axios.patch(`${BUILT_IN_API_URLS.updateUserData}/${user.id}`, form, { withCredentials: true });
      showMsg(setInfoMessage, "success", "Profile updated successfully");
    } catch (err: any) {
      showMsg(setInfoMessage, "error", err?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleUpdatePassword = async () => {
    const weakError = validatePassword(passwordForm.new_password);
    if (weakError) { showMsg(setPasswordMessage, "error", weakError); return; }
    if (passwordForm.new_password !== passwordForm.confirm_password) { showMsg(setPasswordMessage, "error", "Passwords do not match"); return; }
    setIsSavingPassword(true);
    try {
      await axios.patch(BUILT_IN_API_URLS.updatePassword, passwordForm, { withCredentials: true });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showMsg(setPasswordMessage, "success", "Password updated successfully");
    } catch (err: any) {
      showMsg(setPasswordMessage, "error", err?.response?.data?.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) { showMsg(setDeleteMessage, "error", "Please enter your password to confirm"); return; }
    setIsDeletingAccount(true);
    try {
      await axios.delete(`${BUILT_IN_API_URLS.deleteUser}/${user.id}`, { data: { password: deletePassword }, withCredentials: true });
      navigate("/");
    } catch (err: any) {
      showMsg(setDeleteMessage, "error", err?.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await axios.delete(`${BUILT_IN_API_URLS.sessions}/${sessionId}`, { withCredentials: true });
      showMsg(setSessionMessage, "success", "Session revoked");
      await fetchSessions(sessionPagination.page);
    } catch (err: any) {
      showMsg(setSessionMessage, "error", err?.response?.data?.message || "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setIsRevokingAll(true);
    try {
      await axios.delete(BUILT_IN_API_URLS.sessions, { withCredentials: true });
      showMsg(setSessionMessage, "success", "All other sessions revoked");
      await fetchSessions(1);
    } catch (err: any) {
      showMsg(setSessionMessage, "error", err?.response?.data?.message || "Failed to revoke sessions");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const inputClass = (disabled: boolean) => `
    w-full px-3 py-2 rounded-lg border
    border-neutral-300 dark:border-neutral-600
    text-neutral-900 dark:text-neutral-100
    outline-none transition
    disabled:cursor-not-allowed
    ${disabled
      ? "bg-neutral-100 dark:bg-neutral-800 opacity-70"
      : "bg-white dark:bg-neutral-950 focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 cursor-text"
    }
  `;

  const messageClass = (type: "success" | "error") =>
    `px-4 py-2 rounded-lg text-sm text-center border ${
      type === "success"
        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
    }`;

  const { page, totalPages, total } = sessionPagination;
  const otherSessionCount = sessions.filter((s) => !s.is_current).length;

  return (
    <div className="p-6 space-y-6 mx-auto">

      {/* ================= PROFILE CARD ================= */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Account Information</h2>
          <p className="italic text-sm text-neutral-500 dark:text-neutral-400">Email / Username cannot be changed upon account creation.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileFields.map((field) => (
              <div key={field.id} className="flex flex-col gap-1">
                <label className="text-sm text-neutral-600 dark:text-neutral-300">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.id] || ""}
                  readOnly={field.id === "email"}
                  disabled={isSavingInfo}
                  onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                  className={inputClass(isSavingInfo)}
                />
              </div>
            ))}
          </div>
          {infoMessage.type && <div className={`mt-5 ${messageClass(infoMessage.type)}`}>{infoMessage.text}</div>}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpdateInfo}
              disabled={isSavingInfo}
              className={`px-5 py-2 rounded-lg transition bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 ${isSavingInfo ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}`}
            >
              {isSavingInfo ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      {/* ================= PASSWORD CARD ================= */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Change Password</h2>
        </div>
        <div className="p-6 space-y-4">
          <PasswordInput
            placeholder="Current Password"
            value={passwordForm.current_password}
            disabled={isSavingPassword}
            onChange={(v) => setPasswordForm({ ...passwordForm, current_password: v })}
            inputClass={inputClass}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PasswordInput
              placeholder="New Password"
              value={passwordForm.new_password}
              disabled={isSavingPassword}
              onChange={(v) => setPasswordForm({ ...passwordForm, new_password: v })}
              inputClass={inputClass}
            />
            <PasswordInput
              placeholder="Confirm Password"
              value={passwordForm.confirm_password}
              disabled={isSavingPassword}
              onChange={(v) => setPasswordForm({ ...passwordForm, confirm_password: v })}
              inputClass={inputClass}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
          </p>
          {passwordMessage.type && <div className={messageClass(passwordMessage.type)}>{passwordMessage.text}</div>}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleUpdatePassword}
              disabled={isSavingPassword}
              className={`px-5 py-2 rounded-lg transition bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 ${isSavingPassword ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}`}
            >
              {isSavingPassword ? "Saving..." : "Update Password"}
            </button>
          </div>
        </div>
      </section>

      {/* ================= LOGIN SESSIONS CARD ================= */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">

        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Login Sessions</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {sessionsLoading ? "Loading…" : `${total} active session${total !== 1 ? "s" : ""} across your account`}
            </p>
          </div>

          {otherSessionCount > 0 && (
            <button
              onClick={handleRevokeAll}
              disabled={isRevokingAll || sessionsLoading}
              className={`
                shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition
                border-neutral-300 dark:border-neutral-600
                text-neutral-700 dark:text-neutral-300
                bg-white dark:bg-neutral-900
                ${isRevokingAll ? "opacity-50 cursor-not-allowed" : "hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 cursor-pointer"}
              `}
            >
              {isRevokingAll ? "Revoking…" : `Revoke All Other Sessions`}
            </button>
          )}
        </div>

        <div className="p-6 space-y-3">

          {/* Message */}
          {sessionMessage.type && (
            <div className={messageClass(sessionMessage.type)}>{sessionMessage.text}</div>
          )}

          {/* Session list */}
          {sessionsLoading ? (
            <div className="py-10 flex flex-col items-center gap-3 text-neutral-400 dark:text-neutral-500">
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm">Loading sessions…</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No active sessions found.
            </div>
          ) : (
            sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onRevoke={handleRevokeSession}
                isRevoking={revokingId === session.id || isRevokingAll}
              />
            ))
          )}

          {/* Pagination */}
          {!sessionsLoading && totalPages > 1 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Page {page} of {totalPages} · {total} sessions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchSessions(page - 1)}
                  disabled={page <= 1 || sessionsLoading}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm border transition
                    border-neutral-300 dark:border-neutral-600
                    text-neutral-700 dark:text-neutral-300
                    bg-white dark:bg-neutral-900
                    ${page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}
                  `}
                >
                  ← Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "…" ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-sm text-neutral-400 dark:text-neutral-500">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => fetchSessions(p as number)}
                          disabled={sessionsLoading}
                          className={`
                            w-8 h-8 rounded-lg text-sm font-medium transition
                            ${p === page
                              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 cursor-default"
                              : "border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:opacity-80 cursor-pointer"
                            }
                          `}
                        >
                          {p}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => fetchSessions(page + 1)}
                  disabled={page >= totalPages || sessionsLoading}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm border transition
                    border-neutral-300 dark:border-neutral-600
                    text-neutral-700 dark:text-neutral-300
                    bg-white dark:bg-neutral-900
                    ${page >= totalPages ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}
                  `}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= DELETE ACCOUNT CARD ================= */}
      <section className="rounded-2xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 shadow-sm">
        <div className="p-6 border-b border-neutral-300 dark:border-neutral-600">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Delete Account</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            This action is permanent and cannot be undone. All your data will be erased.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {!showDeleteConfirm ? (
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-5 py-2 rounded-lg transition cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              >
                Delete My Account
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Enter your password to confirm account deletion:</p>
              <PasswordInput
                placeholder="Your password"
                value={deletePassword}
                disabled={isDeletingAccount}
                onChange={(v) => setDeletePassword(v)}
                inputClass={inputClass}
              />
              {deleteMessage.type && <div className={messageClass(deleteMessage.type)}>{deleteMessage.text}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteMessage({ type: null, text: "" }); }}
                  disabled={isDeletingAccount}
                  className={`px-5 py-2 rounded-lg transition border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 ${isDeletingAccount ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className={`px-5 py-2 rounded-lg transition text-white bg-red-600 ${isDeletingAccount ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700 cursor-pointer"}`}
                >
                  {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}