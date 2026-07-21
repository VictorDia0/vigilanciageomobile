import {
  isInactivityTimeoutExceeded,
  checkAndLogoutIfExpired,
  INACTIVITY_THRESHOLD_MS,
} from "./inactivity";

describe("isInactivityTimeoutExceeded", () => {
  it("returns false when there is no backgrounded timestamp", () => {
    expect(isInactivityTimeoutExceeded(null, Date.now())).toBe(false);
  });

  it("returns false when under the threshold", () => {
    const now = 1_000_000;
    const backgroundedAt = now - (INACTIVITY_THRESHOLD_MS - 1000);
    expect(isInactivityTimeoutExceeded(backgroundedAt, now)).toBe(false);
  });

  it("returns true when at or over the threshold", () => {
    const now = 1_000_000;
    const backgroundedAt = now - INACTIVITY_THRESHOLD_MS;
    expect(isInactivityTimeoutExceeded(backgroundedAt, now)).toBe(true);
  });

  it("respects a custom threshold", () => {
    const now = 1_000_000;
    expect(isInactivityTimeoutExceeded(now - 5000, now, 10_000)).toBe(false);
    expect(isInactivityTimeoutExceeded(now - 10_000, now, 10_000)).toBe(true);
  });
});

describe("checkAndLogoutIfExpired", () => {
  it("does not log out when there is no stored timestamp", async () => {
    const logout = jest.fn();
    await checkAndLogoutIfExpired({
      getStoredTimestamp: async () => null,
      clearStoredTimestamp: jest.fn().mockResolvedValue(undefined),
      logout,
    });
    expect(logout).not.toHaveBeenCalled();
  });

  it("logs out when the stored timestamp exceeds the threshold", async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    const clearStoredTimestamp = jest.fn().mockResolvedValue(undefined);
    const now = 1_000_000;
    const backgroundedAt = now - INACTIVITY_THRESHOLD_MS;

    await checkAndLogoutIfExpired({
      getStoredTimestamp: async () => String(backgroundedAt),
      clearStoredTimestamp,
      logout,
      now: () => now,
    });

    expect(logout).toHaveBeenCalledTimes(1);
    expect(clearStoredTimestamp).toHaveBeenCalledTimes(1);
  });

  it("does not log out when under the threshold", async () => {
    const logout = jest.fn();
    const now = 1_000_000;
    const backgroundedAt = now - 1000;

    await checkAndLogoutIfExpired({
      getStoredTimestamp: async () => String(backgroundedAt),
      clearStoredTimestamp: jest.fn().mockResolvedValue(undefined),
      logout,
      now: () => now,
    });

    expect(logout).not.toHaveBeenCalled();
  });
});
