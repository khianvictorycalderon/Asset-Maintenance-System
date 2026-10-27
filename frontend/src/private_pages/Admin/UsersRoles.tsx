import axios from "axios";
import { useEffect, useState } from "react";
import Modal from "../../Modal";
import Pagination from "../../Pagination";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Toast from "../../components/Toast";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";
import { useNavigate } from "react-router-dom";

type UserRole =
  | "Employee"
  | "Supervisor"
  | "Personnel"
  | "Admin";

type AccessStatus = "Active" | "Revoked";

interface User {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: AccessStatus;
}

interface UsersResponse {
  message: string;
  users: {
    user_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    revocation_status: AccessStatus;
    is_user_banned: boolean;
  }[];
  total_users: number;
  current_page: number;
  page_size: number;
  total_pages: number;
}

const AdminUsersRoles = () => {
  
  const navigate = useNavigate();

  // =========================
  // USERS
  // =========================
  const [users, setUsers] = useState<User[]>([]);

  // =========================
  // PAGE LOADING / ERROR
  // =========================
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================
  // PAGINATION
  // =========================
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // =========================
  // TOAST
  // =========================
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // =========================
  // REVOKE LOADING
  // =========================
  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  // =========================
  // ROLE MODAL
  // =========================
  const [roleModalOpen, setRoleModalOpen] =
    useState(false);

  const [selectedRole, setSelectedRole] =
    useState<Exclude<UserRole, "Admin">>(
      "Employee"
    );

  // =========================
  // PASSWORD MODAL
  // =========================
  const [passwordModalOpen, setPasswordModalOpen] =
    useState(false);

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =========================
  // SHARED MODAL STATE
  // =========================
  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [modalLoading, setModalLoading] =
    useState(false);

  const [modalError, setModalError] =
    useState("");

  // =========================
  // FETCH USERS
  // =========================
  const fetchUsers = async (page: number) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.get<UsersResponse>(
        `${API_URLS.Admin}/users?page=${page}&pageSize=${itemsPerPage}`,
        { withCredentials: true }
      );

      const data = response.data;

      setUsers(
        data.users.map((user) => ({
          id: user.user_id,
          firstName: user.first_name,
          middleName: user.middle_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          status: user.revocation_status,
        }))
      );

      setTotalItems(data.total_users);
      setItemsPerPage(data.page_size);
      setTotalPages(data.total_pages);
      setCurrentPage(data.current_page);
    } catch (error: unknown) {
      setErrorMessage(getErrorInfo(error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // ROLE LABELS
  // =========================
  const roleLabels: Record<
    UserRole,
    string
  > = {
    Employee: "Office Employee",
    Supervisor: "Maintenance Supervisor",
    Personnel: "On-Site Personnel",
    Admin: "Administrator",
  };

  // =========================
  // RETRY USERS
  // =========================
  const handleRetry = () => {
    fetchUsers(currentPage);
  };

  // =========================
  // ERROR HELPER (shared by all PATCH calls)
  // =========================
  const getErrorInfo = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return { message: "Something went wrong.", status: undefined };
    }

    if (!error.response) {
      return { message: "Can't reach the server.", status: undefined };
    }

    const status = error.response.status;
    const data = error.response.data;

    // Session expired, or this admin's access was revoked
    if (status === 401) {
      navigate("/login", { replace: true });
      return { message: "Your session has expired.", status };
    }

    if (status === 403) {
      return {
        message: "You don't have permission to perform this action.",
        status,
      };
    }

    if (status >= 500) {
      return { message: "Server error. Please try again.", status };
    }

    return {
      message:
        data?.message ??
        data?.detail ??
        data?.title ??
        "Something went wrong.",
      status,
    };
  };

  // =========================
  // REVOKE / UNDO REVOKE
  // =========================
  const handleRevoke = async (user: User) => {

    // Admin accounts cannot be revoked, and block double clicks
    if (user.role === "Admin" || loadingId) return;

    setLoadingId(user.id);

    try {
      const response = await axios.patch<{
        is_user_banned: boolean;
        message: string;
      }>(
        `${API_URLS.Admin}/users/${user.id}/access-revocation`,
        null,
        { withCredentials: true }
      );

      const { is_user_banned, message } = response.data;

      // Status comes from the response, never guessed locally
      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                status: is_user_banned ? "Revoked" : "Active",
              }
            : item
        )
      );

      setToast({ type: "success", message });

    } catch (error: unknown) {
      const { message, status } = getErrorInfo(error);

      setToast({ type: "error", message });

      // User gone or record changed by someone else: refresh the list
      if (status === 404 || status === 409) {
        fetchUsers(currentPage);
      }

    } finally {
      setLoadingId(null);
    }
  };

  // =========================
  // OPEN UPDATE ROLE MODAL
  // =========================

  const openRoleModal = (user: User) => {

    // Admin accounts cannot have their role changed
    if (user.role === "Admin") return;

    setSelectedUser(user);
    setSelectedRole(user.role as Exclude<UserRole, "Admin">);
    setModalError("");
    setRoleModalOpen(true);
  };  

  // =========================
  // UPDATE ROLE
  // =========================

  // True when the selected role equals the current role (backend returns 400 for this)
  const roleUnchanged =
    selectedUser !== null && selectedUser.role === selectedRole;

  const handleUpdateRole = async () => {

    if (!selectedUser || modalLoading || roleUnchanged) return;

    setModalLoading(true);
    setModalError("");

    try {
      const response = await axios.patch<{
        role: UserRole;
        message: string;
      }>(
        `${API_URLS.Admin}/users/${selectedUser.id}/role-update`,
        { role: selectedRole },
        { withCredentials: true }
      );

      const { role, message } = response.data;

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === selectedUser.id
            ? { ...user, role }
            : user
        )
      );

      setToast({ type: "success", message });
      setRoleModalOpen(false);
      setSelectedUser(null);

    } catch (error: unknown) {
      const { message, status } = getErrorInfo(error);

      setModalError(message);
      setToast({ type: "error", message });

      if (status === 404 || status === 409) {
        fetchUsers(currentPage);
      }

    } finally {
      setModalLoading(false);
    }
  };

  // =========================
  // OPEN CHANGE PASSWORD MODAL
  // =========================
  const openPasswordModal = (user: User) => {

    setSelectedUser(user);

    // Reset password fields
    setNewPassword("");
    setConfirmPassword("");

    // Reset show/hide buttons
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    // Reset error
    setModalError("");

    setPasswordModalOpen(true);
  };

  // =========================
  // CHANGE PASSWORD
  // =========================
  const handleChangePassword = async () => {

    if (!selectedUser || modalLoading) return;

    setModalError("");

    if (!newPassword) {
      setModalError("New password is required.");
      return;
    }

    if (!confirmPassword) {
      setModalError("Please confirm the new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setModalError("Password must be at least 8 characters.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setModalError("Password is too long (maximum 72 bytes).");
      return;
    }

    setModalLoading(true);

    try {
      // Only new_password is sent. confirm_password never leaves the browser.
      const response = await axios.patch<{ message: string }>(
        `${API_URLS.Admin}/users/${selectedUser.id}/password-change`,
        { new_password: newPassword },
        { withCredentials: true }
      );

      setToast({ type: "success", message: response.data.message });

      // Close modal and clear the passwords
      setPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUser(null);

    } catch (error: unknown) {
      const { message, status } = getErrorInfo(error);

      setModalError(message);
      setToast({ type: "error", message });

      if (status === 404 || status === 409) {
        fetchUsers(currentPage);
      }

    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-900 dark:text-white">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Users &amp; Roles
        </h1>

        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Manage system users, roles, and access status.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-600 dark:bg-neutral-800">
        <div className="overflow-x-auto">

          <table className="min-w-[1100px] w-full text-left">

            {/* TABLE HEADER */}
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700/70">

              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  First Name / Middle Name / Last Name
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Email
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Role
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Access Status
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              </tr>

            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">

              {isLoading ? (

                <tr>
                  <td colSpan={5}>
                    <LoadingState />
                  </td>
                </tr>

              ) : errorMessage ? (

                <tr>
                  <td colSpan={5}>
                    <ErrorState
                      message={errorMessage}
                      onRetry={handleRetry}
                    />
                  </td>
                </tr>

              ) : users.length === 0 ? (

                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No users found." />
                  </td>
                </tr>

              ) : (

                users.map((user) => {

                  const isAdmin = user.role === "Admin";
                  const isRowLoading = loadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                    >

                      {/* NAME */}
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                        {user.firstName}{" "}
                        {user.middleName || "—"}{" "}
                        {user.lastName}
                      </td>

                      {/* EMAIL */}
                      <td className="max-w-[250px] px-4 py-4">
                        <span
                          title={user.email}
                          className="block truncate text-sm text-neutral-600 dark:text-neutral-300"
                        >
                          {user.email}
                        </span>
                      </td>

                      {/* ROLE */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isAdmin
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                          }`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>

                      {/* ACCESS STATUS */}
                      <td className="px-4 py-4">
                        {user.status === "Active" ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                            Revoked
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">

                          {/* REVOKE / UNDO REVOKE */}
                          <button
                            type="button"
                            disabled={isAdmin || isRowLoading}
                            title={
                              isAdmin
                                ? "Admin accounts can't be modified"
                                : user.status === "Active"
                                ? "Revoke access"
                                : "Restore access"
                            }
                            onClick={() => handleRevoke(user)}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              user.status === "Active"
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "border border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                            }`}
                          >
                            {isRowLoading && (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                            )}

                            {isRowLoading
                              ? "Loading..."
                              : user.status === "Active"
                              ? "Revoke"
                              : "Undo Revoke"}
                          </button>

                          {/* UPDATE ROLE */}
                          <button
                            type="button"
                            disabled={isAdmin}
                            title={
                              isAdmin
                                ? "Admin accounts can't be modified"
                                : "Update user role"
                            }
                            onClick={() => openRoleModal(user)}
                            className="cursor-pointer rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Update Role
                          </button>

                          {/* CHANGE PASSWORD */}
                          <button
                            type="button"
                            onClick={() => openPasswordModal(user)}
                            className="cursor-pointer rounded-lg bg-neutral-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                          >
                            Change Password
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}
        {!isLoading &&
          !errorMessage &&
          users.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => fetchUsers(page)}
            />
          )}

      </section>

      {/* =========================
          ROLE LABELS
      ========================= */}
      <div className="mt-8">

        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
          Role Labels
        </h2>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-600 dark:bg-neutral-800">

          <table className="w-full">

            <thead className="border-b border-neutral-200 bg-white dark:border-neutral-600 dark:bg-neutral-700/70">

              <tr>

                <th className="px-5 py-3 text-left text-sm">
                  Backend Value
                </th>

                <th className="px-5 py-3 text-left text-sm">
                  Display Label
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-gray-50 px-2 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    Employee
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">
                  Office Employee
                </td>

              </tr>

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-gray-50 px-2 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    Supervisor
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">
                  Maintenance Supervisor
                </td>

              </tr>

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-gray-50 px-2 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    Personnel
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">
                  On-Site Personnel
                </td>

              </tr>

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Admin
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">

                  Administrator{" "}

                  <span className="italic text-neutral-500">
                    (logged-in admin)
                  </span>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* ==================================================
          UPDATE ROLE MODAL
      ================================================== */}
      <Modal
        isOpen={roleModalOpen}
        title="Update Role"
        onClose={() => {

          if (!modalLoading) {

            setRoleModalOpen(false);
            setModalError("");

          }

        }}
      >

        {selectedUser && (

          <div className="space-y-5">

            {/* USER INFORMATION */}
            <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">

              <p className="font-medium text-neutral-900 dark:text-white">

                {selectedUser.firstName}{" "}

                {selectedUser.middleName
                  ? `${selectedUser.middleName} `
                  : ""}

                {selectedUser.lastName}

              </p>

              <p className="mt-1 truncate text-sm text-neutral-500 dark:text-gray-400">
                {selectedUser.email}
              </p>

            </div>

            {/* ROLE SELECT */}
            <div>

              <label
                htmlFor="user-role"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-gray-300"
              >
                Role
              </label>

              <select
                id="user-role"
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(
                    e.target.value as Exclude<
                      UserRole,
                      "Admin"
                    >
                  )
                }
                disabled={modalLoading}
                className="
                  w-full
                  rounded-lg
                  border border-neutral-300 dark:border-gray-700
                  bg-white dark:bg-gray-800
                  px-3 py-2.5
                  text-neutral-900 dark:text-white
                  outline-none
                  focus:border-green-500
                "
              >

                <option value="Employee">
                  Office Employee
                </option>

                <option value="Supervisor">
                  Maintenance Supervisor
                </option>

                <option value="Personnel">
                  On-Site Personnel
                </option>

              </select>

            </div>

            {/* ERROR MESSAGE */}
            {modalError && (

              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {modalError}
              </div>

            )}

            {/* BUTTONS */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={modalLoading}
                onClick={() => {

                  setRoleModalOpen(false);
                  setModalError("");

                }}
                className="
                  cursor-pointer
                  rounded-lg
                  border border-neutral-300 dark:border-gray-700
                  px-4 py-2.5
                  text-sm font-medium
                  text-neutral-700 dark:text-gray-300
                  transition
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={modalLoading || roleUnchanged}
                onClick={handleUpdateRole}
                className="
                  flex cursor-pointer items-center
                  justify-center gap-2
                  rounded-lg
                  bg-green-600
                  px-4 py-2.5
                  text-sm font-medium
                  text-white
                  transition
                  hover:bg-green-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {modalLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}

                {modalLoading
                  ? "Updating..."
                  : "Update Role"}

              </button>

            </div>

          </div>

        )}

      </Modal>

      {/* ==================================================
          CHANGE PASSWORD MODAL
      ================================================== */}
      <Modal
        isOpen={passwordModalOpen}
        title="Change Password"
        onClose={() => {

          if (!modalLoading) {

            setPasswordModalOpen(false);
            setModalError("");
            setNewPassword("");
            setConfirmPassword("");

          }

        }}
      >

        {selectedUser && (

          <div className="space-y-5">

            {/* USER INFORMATION */}
            <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">

              <p className="font-medium text-neutral-900 dark:text-white">

                {selectedUser.firstName}{" "}

                {selectedUser.middleName
                  ? `${selectedUser.middleName} `
                  : ""}

                {selectedUser.lastName}

              </p>

              <p className="mt-1 truncate text-sm text-neutral-500 dark:text-gray-400">
                {selectedUser.email}
              </p>

            </div>

            {/* NEW PASSWORD */}
            <div>

              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-gray-300"
              >
                New Password
              </label>

              <div className="relative">

                <input
                  id="new-password"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  disabled={modalLoading}
                  placeholder="Enter new password"
                  className="
                    w-full
                    rounded-lg
                    border border-neutral-300 dark:border-gray-700
                    bg-white dark:bg-gray-800
                    px-3 py-2.5
                    pr-16
                    text-neutral-900 dark:text-white
                    outline-none
                    placeholder:text-gray-500
                    focus:border-green-500
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    cursor-pointer
                    text-xs
                    text-neutral-500 dark:text-gray-400
                    hover:text-neutral-900 dark:hover:text-white
                  "
                >
                  {showNewPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                At least 8 characters
              </p>

            </div>

            {/* CONFIRM PASSWORD */}
            <div>

              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-neutral-700 dark:text-gray-300"
              >
                Confirm New Password
              </label>

              <div className="relative">

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  disabled={modalLoading}
                  placeholder="Confirm new password"
                  className="
                    w-full
                    rounded-lg
                    border border-neutral-300 dark:border-gray-700
                    bg-white dark:bg-gray-800
                    px-3 py-2.5
                    pr-16
                    text-neutral-900 dark:text-white
                    outline-none
                    placeholder:text-gray-500
                    focus:border-green-500
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    cursor-pointer
                    text-xs
                    text-neutral-500 dark:text-gray-400
                    hover:text-neutral-900 dark:hover:text-white
                  "
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            {/* ERROR MESSAGE */}
            {modalError && (

              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {modalError}
              </div>

            )}

            {/* BUTTONS */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={modalLoading}
                onClick={() => {

                  setPasswordModalOpen(false);
                  setModalError("");
                  setNewPassword("");
                  setConfirmPassword("");

                }}
                className="
                  cursor-pointer
                  rounded-lg
                  border border-neutral-300 dark:border-gray-700
                  px-4 py-2.5
                  text-sm font-medium
                  text-neutral-700 dark:text-gray-300
                  transition
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={modalLoading}
                onClick={handleChangePassword}
                className="
                  flex cursor-pointer items-center
                  justify-center gap-2
                  rounded-lg
                  bg-green-600
                  px-4 py-2.5
                  text-sm font-medium
                  text-white
                  transition
                  hover:bg-green-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {modalLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}

                {modalLoading
                  ? "Changing..."
                  : "Change Password"}

              </button>

            </div>

          </div>

        )}

      </Modal>

      {/* =========================
          TOAST
      ========================= */}
      {toast && (

        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />

      )}

    </div>
  );
};

export default AdminUsersRoles;
