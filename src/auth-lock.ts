// authentication expiry key.
const AUTH_UNTIL_KEY = "hushnav:authenticatedUntil";
// 1 hour for authentication
export const AUTH_TTL_MS = 60 * 60 * 1000;

export function setAuthenticatedForOneHour(): void {
  // save unlock deadline.
  const authenticatedUntil = Date.now() + AUTH_TTL_MS;
  localStorage.setItem(AUTH_UNTIL_KEY, String(authenticatedUntil));
}

export function clearAuthentication(): void {
  localStorage.removeItem(AUTH_UNTIL_KEY);
}

export function isAuthenticated(): boolean {
  const raw = localStorage.getItem(AUTH_UNTIL_KEY);
  if (!raw) return false;

  const authenticatedUntil = Number(raw);
  // remove invalid values.
  if (!Number.isFinite(authenticatedUntil)) {
    clearAuthentication();
    return false;
  }

  // lock again when expired.
  if (Date.now() > authenticatedUntil) {
    clearAuthentication();
    return false;
  }

  return true;
}

