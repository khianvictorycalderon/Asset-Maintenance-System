import { useState } from "react";

type UserRole =
  | "Employee"
  | "Supervisor"
  | "Personnel"
  | "Admin";

type User = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  role: UserRole;
  revoked: boolean;
};

const roleLabels: Record<UserRole, string> = {
  Employee: "Office Employee",
  Supervisor: "Maintenance Supervisor",
  Personnel: "On-Site Personnel",
  Admin: "Administrator",
};

const initialUsers: User[] = [
  {
    id: 1,
    firstName: "Admin",
    middleName: "",
    lastName: "User",
    email: "admin@example.com",
    role: "Admin",
    revoked: false,
  },
  {
    id: 2,
    firstName: "Jane",
    middleName: "M.",
    lastName: "Doe",
    email: "jane.doe@example.com",
    role: "Employee",
    revoked: false,
  },
  {
    id: 3,
    firstName: "John",
    middleName: "",
    lastName: "Smith",
    email: "john.smith@example.com",
    role: "Supervisor",
    revoked: false,
  },
  {
    id: 4,
    firstName: "Mark",
    middleName: "A.",
    lastName: "Santos",
    email: "mark.santos@example.com",
    role: "Personnel",
    revoked: true,
  },
];

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
      {roleLabels[role]}
    </span>
  );
}

function StatusBadge({ revoked }: { revoked: boolean }) {
  return revoked ? (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
      Revoked
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
      Active
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 text-sm dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-neutral-500 dark:text-neutral-400">
        Showing 1–{Math.min(10, totalItems)} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Previous
        </button>

        <span className="px-2 text-neutral-600 dark:text-neutral-300">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function UsersRolesPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const [roleModalUser, setRoleModalUser] =
    useState<User | null>(null);

  const [passwordModalUser, setPasswordModalUser] =
    useState<User | null>(null);

  const [newRole, setNewRole] =
    useState<UserRole>("Employee");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const toggleRevoke = (id: number) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? { ...user, revoked: !user.revoked }
          : user
      )
    );
  };

  const openRoleModal = (user: User) => {
    setNewRole(user.role);
    setRoleModalUser(user);
  };

  const openPasswordModal = (user: User) => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordModalUser(user);
  };

  const updateRole = () => {
    if (!roleModalUser) return;

    setUsers((current) =>
      current.map((user) =>
        user.id === roleModalUser.id
          ? { ...user, role: newRole }
          : user
      )
    );

    setRoleModalUser(null);
  };

  const changePassword = () => {
    if (!passwordModalUser) return;

    if (newPassword.length < 8) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    setPasswordModalUser(null);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Users & Roles
        </h1>

        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Manage user accounts, access status, and assigned roles.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left">

            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/70">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  First Name
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Middle Name
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Last Name
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

            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {users.map((user) => {
                const isAdmin = user.role === "Admin";

                return (
                  <tr
                    key={user.id}
                    className="transition hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                      {user.firstName}
                    </td>

                    <td className="px-4 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                      {user.middleName || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm text-neutral-900 dark:text-white">
                      {user.lastName}
                    </td>

                    <td className="max-w-[220px] px-4 py-4">
                      <span
                        title={user.email}
                        className="block truncate text-sm text-neutral-600 dark:text-neutral-300"
                      >
                        {user.email}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge revoked={user.revoked} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">

                        {/* Revoke */}
                        <button
                          onClick={() => toggleRevoke(user.id)}
                          disabled={isAdmin}
                          title={
                            isAdmin
                              ? "Admin accounts can't be modified"
                              : undefined
                          }
                          className={
                            user.revoked
                              ? "rounded-lg border border-green-300 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                              : "rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          }
                        >
                          {user.revoked ? "Undo Revoke" : "Revoke"}
                        </button>

                        {/* Update Role */}
                        <button
                          onClick={() => openRoleModal(user)}
                          disabled={isAdmin}
                          title={
                            isAdmin
                              ? "Admin accounts can't be modified"
                              : undefined
                          }
                          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Update Role
                        </button>

                        {/* Change Password */}
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="rounded-lg bg-neutral-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                        >
                          Change Password
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

        <Pagination
          page={1}
          totalPages={10}
          totalItems={93}
        />
      </div>

      {/* Update Role Modal */}
      {roleModalUser && (
        <Modal
          title="Update Role"
          onClose={() => setRoleModalUser(null)}
        >
          <div className="space-y-5">

            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                {roleModalUser.firstName}{" "}
                {roleModalUser.lastName}
              </p>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {roleModalUser.email}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Role
              </label>

              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as UserRole)
                }
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
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

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRoleModalUser(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>

              <button
                onClick={updateRole}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                Update Role
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* Change Password Modal */}
      {passwordModalUser && (
        <Modal
          title="Change Password"
          onClose={() => setPasswordModalUser(null)}
        >
          <div className="space-y-5">

            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                {passwordModalUser.firstName}{" "}
                {passwordModalUser.lastName}
              </p>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {passwordModalUser.email}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />

              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                At least 8 characters
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Confirm New Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            {newPassword &&
              newPassword.length < 8 && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  Password must be at least 8 characters.
                </p>
              )}

            {confirmPassword &&
              newPassword !== confirmPassword && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  Passwords do not match.
                </p>
              )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPasswordModalUser(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>

              <button
                onClick={changePassword}
                disabled={
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Change Password
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
