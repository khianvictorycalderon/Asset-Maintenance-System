import axios from "axios";

// One shared API error mapper (a 401 is handled by the caller, usually by redirecting to /login)
export function getErrorInfo(error: unknown): { message: string; status: number | undefined } {
  if (!axios.isAxiosError(error)) {
    return { message: "Something went wrong.", status: undefined };
  }
  if (!error.response) {
    return { message: "Can't reach the server.", status: undefined };
  }

  const { status, data } = error.response;

  if (status === 401) return { message: "Your session has expired.", status };
  if (status === 403) {
    return { message: "You don't have permission to perform this action.", status };
  }
  if (status >= 500) return { message: "Server error. Please try again.", status };

  return {
    message: data?.message ?? data?.detail ?? data?.title ?? "Something went wrong.",
    status,
  };
}
