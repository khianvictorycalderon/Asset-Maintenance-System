// In-memory store for the current session's CSRF token. Deliberately NOT
// persisted to localStorage/sessionStorage — it only needs to survive as
// long as the in-memory app session does, and it's re-fetched on every
// /api/verify call anyway (see PrivateLayout.tsx / PublicLayoutRedirect.tsx),
// so a full page reload recovers it automatically.
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null | undefined) {
  csrfToken = token ?? null;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}
