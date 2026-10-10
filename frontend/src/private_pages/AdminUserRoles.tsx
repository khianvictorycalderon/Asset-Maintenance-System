import axios from "axios";
import { useEffect, useState } from "react";
import Modal from "../Modal";
import Pagination from "../Pagination";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Toast from "../components/Toast";
import { ROLE_BASED_API_URLS as API_URLS } from "../config";
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
      setErrorMessage(
        axios.isAxiosError(error)
          ? error.response?.data?.message ??
              error.response?.data?.detail ??
              error.response?.data?.title ??
              (error.response
                ? "Something went wrong."
                : "Can't reach the server.")
          : "Something went wrong."
      );
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
    <div className="min-h-screen bg-[#1d1d1d] p-6 text-white">

      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="mb-6">

        <h1 className="text-2xl font-bold">
          Users & Roles
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Manage system users, roles, and access status.
        </p>

      </div>

      {/* =========================
          USERS TABLE
      ========================= */}
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#242424]">

        <div className="overflow-x-auto">

          <table className="min-w-[1100px] w-full">

            {/* TABLE HEADER */}
            <thead className="border-b border-gray-700 bg-[#191919]">

              <tr>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  First Name / Middle Name / Last Name
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Email
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Role
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Access Status
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold">
                  Actions
                </th>

              </tr>

            </thead>

            {/* =========================
                TABLE BODY
            ========================= */}
            <tbody className="divide-y divide-gray-700">

              {/* LOADING */}
              {isLoading ? (

                <tr>

                  <td colSpan={5}>

                    <LoadingState />

                  </td>

                </tr>

              ) : errorMessage ? (

                /* ERROR */
                <tr>

                  <td colSpan={5}>

                    <ErrorState
                      message={errorMessage}
                      onRetry={handleRetry}
                    />

                  </td>

                </tr>

              ) : users.length === 0 ? (

                /* EMPTY */
                <tr>

                  <td colSpan={5}>

                    <EmptyState
                      message="No users found."
                    />

                  </td>

                </tr>

              ) : (

                /* USERS */
                users.map((user) => {

                  const isAdmin =
                    user.role === "Admin";

                  const isLoading =
                    loadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-[#2b2b2b]"
                    >

                      {/* NAME */}
                      <td className="px-5 py-4 text-sm">

                        {user.firstName}{" "}

                        {user.middleName || "—"}{" "}

                        {user.lastName}

                      </td>

                      {/* EMAIL */}
                      <td className="max-w-[250px] px-5 py-4 text-sm">

                        <span
                          title={user.email}
                          className="block truncate text-gray-300"
                        >
                          {user.email}
                        </span>

                      </td>

                      {/* ROLE */}
                      <td className="px-5 py-4">

                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            isAdmin
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-gray-700 text-gray-200"
                          }`}
                        >
                          {roleLabels[user.role]}
                        </span>

                      </td>

                      {/* ACCESS STATUS */}
                      <td className="px-5 py-4">

                        {user.status === "Active" ? (

                          <span className="rounded-md bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400">
                            Active
                          </span>

                        ) : (

                          <span className="rounded-md bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400">
                            Revoked
                          </span>

                        )}

                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          {/* REVOKE / UNDO REVOKE */}
                          <button
                            type="button"
                            disabled={
                              isAdmin || isLoading
                            }
                            title={
                              isAdmin
                                ? "Admin accounts can't be modified"
                                : user.status === "Active"
                                ? "Revoke access"
                                : "Restore access"
                            }
                            onClick={() =>
                              handleRevoke(user)
                            }
                            className={`
                              flex items-center gap-2
                              rounded-md
                              px-3 py-2
                              text-xs font-medium
                              transition

                              ${
                                isAdmin
                                  ? "cursor-not-allowed bg-gray-700 text-gray-500"
                                  : user.status === "Active"
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "border border-red-500 text-red-400 hover:bg-red-500/10"
                              }

                              disabled:cursor-not-allowed
                              disabled:opacity-60
                            `}
                          >

                            {isLoading && (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            )}

                            {isLoading
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
                            onClick={() =>
                              openRoleModal(user)
                            }
                            className="
                              rounded-md
                              bg-green-600
                              px-3 py-2
                              text-xs font-medium
                              text-white
                              transition
                              hover:bg-green-700
                              disabled:cursor-not-allowed
                              disabled:bg-gray-700
                              disabled:text-gray-500
                            "
                          >
                            Update Role
                          </button>

                          {/* CHANGE PASSWORD */}
                          <button
                            type="button"
                            onClick={() =>
                              openPasswordModal(user)
                            }
                            className="
                              rounded-md
                              border border-gray-600
                              bg-gray-700
                              px-3 py-2
                              text-xs font-medium
                              text-gray-200
                              transition
                              hover:bg-gray-600
                            "
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

      </div>

      {/* =========================
          ROLE LABELS
      ========================= */}
      <div className="mt-8">

        <h2 className="mb-4 text-lg font-semibold">
          Role Labels
        </h2>

        <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#242424]">

          <table className="w-full">

            <thead className="border-b border-gray-700 bg-[#191919]">

              <tr>

                <th className="px-5 py-3 text-left text-sm">
                  Backend Value
                </th>

                <th className="px-5 py-3 text-left text-sm">
                  Display Label
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-700">

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-gray-700 px-2 py-1 text-xs">
                    Employee
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">
                  Office Employee
                </td>

              </tr>

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-gray-700 px-2 py-1 text-xs">
                    Supervisor
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">
                  Maintenance Supervisor
                </td>

              </tr>

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-gray-700 px-2 py-1 text-xs">
                    Personnel
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">
                  On-Site Personnel
                </td>

              </tr>

              <tr>

                <td className="px-5 py-3">

                  <span className="rounded bg-blue-500/15 px-2 py-1 text-xs text-blue-400">
                    Admin
                  </span>

                </td>

                <td className="px-5 py-3 text-sm">

                  Administrator{" "}

                  <span className="italic text-gray-500">
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
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">

              <p className="font-medium text-white">

                {selectedUser.firstName}{" "}

                {selectedUser.middleName
                  ? `${selectedUser.middleName} `
                  : ""}

                {selectedUser.lastName}

              </p>

              <p className="mt-1 truncate text-sm text-gray-400">
                {selectedUser.email}
              </p>

            </div>

            {/* ROLE SELECT */}
            <div>

              <label
                htmlFor="user-role"
                className="mb-2 block text-sm font-medium text-gray-300"
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
                  border border-gray-700
                  bg-gray-800
                  px-3 py-2.5
                  text-white
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

              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
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
                  rounded-lg
                  border border-gray-700
                  px-4 py-2.5
                  text-sm font-medium
                  text-gray-300
                  transition
                  hover:bg-gray-800
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
                  flex items-center
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

          }

        }}
      >

        {selectedUser && (

          <div className="space-y-5">

            {/* USER INFORMATION */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">

              <p className="font-medium text-white">

                {selectedUser.firstName}{" "}

                {selectedUser.middleName
                  ? `${selectedUser.middleName} `
                  : ""}

                {selectedUser.lastName}

              </p>

              <p className="mt-1 truncate text-sm text-gray-400">
                {selectedUser.email}
              </p>

            </div>

            {/* NEW PASSWORD */}
            <div>

              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-gray-300"
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
                    border border-gray-700
                    bg-gray-800
                    px-3 py-2.5
                    pr-16
                    text-white
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
                    text-xs
                    text-gray-400
                    hover:text-white
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
                className="mb-2 block text-sm font-medium text-gray-300"
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
                    border border-gray-700
                    bg-gray-800
                    px-3 py-2.5
                    pr-16
                    text-white
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
                    text-xs
                    text-gray-400
                    hover:text-white
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

              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
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

                }}
                className="
                  rounded-lg
                  border border-gray-700
                  px-4 py-2.5
                  text-sm font-medium
                  text-gray-300
                  transition
                  hover:bg-gray-800
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
                  flex items-center
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