/**
 * ============================================================================
 * CLOUD CONSOLE DEMO AUTHORIZATION GATEWAY (DEMO SCOPE ONLY)
 * ============================================================================
 * 
 * SECURITY DISCLAIMER & ARCHITECTURAL NOTE:
 * This is a lightweight, demo-scoped authorization gate designed specifically
 * for hackathon evaluations, judge walkthroughs, and UI flow demonstration.
 * 
 * IT IS NOT PRODUCTION-GRADE SECURITY:
 * 1. Single shared team credential gating the /cloud route (no per-user accounts,
 *    no RBAC, no JWT infrastructure, no server-side auth verification).
 * 2. Session flag is stored purely client-side in sessionStorage (which automatically
 *    clears when the browser tab closes).
 * 3. FALLBACK DEFAULT PASSWORD:
 *    The password defaults to "edgemind2026" if NEXT_PUBLIC_CLOUD_CONSOLE_PASSWORD
 *    is not defined in the environment. This ensures zero-friction out-of-the-box
 *    execution during live evaluations without manual environment setup.
 * 
 * Core Invariant:
 * EdgeMind's security principles mandate never claiming more security than
 * the code actually provides. If asked during an audit or judge review, state
 * clearly that this is an air-gapped demo gate, not production multi-tenant IAM.
 * ============================================================================
 */

export const CLOUD_AUTH_SESSION_KEY = "edgemind_cloud_auth_session";
export const CLOUD_AUTH_EVENT_NAME = "edgemind_cloud_auth_change";

// Fallback default password for zero-config hackathon walkthroughs
export const DEFAULT_CLOUD_CONSOLE_PASSWORD =
  process.env.NEXT_PUBLIC_CLOUD_CONSOLE_PASSWORD || "edgemind2026";

/**
 * Returns true if the client holds an active demo session flag in sessionStorage.
 */
export function isCloudConsoleAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(CLOUD_AUTH_SESSION_KEY) === "authorized";
  } catch {
    return false;
  }
}

/**
 * Validates the candidate password against the configured or fallback credential.
 * If valid, sets the session flag and notifies active listeners.
 */
export function authenticateCloudConsole(candidatePassword: string): boolean {
  if (typeof window === "undefined") return false;
  
  if (candidatePassword === DEFAULT_CLOUD_CONSOLE_PASSWORD) {
    try {
      window.sessionStorage.setItem(CLOUD_AUTH_SESSION_KEY, "authorized");
      window.dispatchEvent(new Event(CLOUD_AUTH_EVENT_NAME));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Clears the demo session flag from sessionStorage and notifies active components
 * to immediately re-lock the console and render the gate screen.
 */
export function lockCloudConsole(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CLOUD_AUTH_SESSION_KEY);
    window.dispatchEvent(new Event(CLOUD_AUTH_EVENT_NAME));
  } catch {
    // ignore
  }
}
