export const INACTIVITY_THRESHOLD_MS = 15 * 60 * 1000;

export function isInactivityTimeoutExceeded(
  backgroundedAt: number | null,
  now: number,
  thresholdMs: number = INACTIVITY_THRESHOLD_MS
): boolean {
  if (backgroundedAt === null) return false;
  return now - backgroundedAt >= thresholdMs;
}

export async function checkAndLogoutIfExpired(deps: {
  getStoredTimestamp: () => Promise<string | null>;
  clearStoredTimestamp: () => Promise<void>;
  logout: () => Promise<void>;
  now?: () => number;
}): Promise<void> {
  const stored = await deps.getStoredTimestamp();
  const backgroundedAt = stored ? Number(stored) : null;
  const now = (deps.now ?? Date.now)();

  if (isInactivityTimeoutExceeded(backgroundedAt, now)) {
    await deps.logout();
  }

  await deps.clearStoredTimestamp();
}
