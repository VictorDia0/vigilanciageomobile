import { shouldRedirectToLogin } from "./authGuard";

describe("shouldRedirectToLogin", () => {
  it("returns false while the store has not hydrated yet", () => {
    expect(shouldRedirectToLogin(false, false)).toBe(false);
  });

  it("returns true once hydrated and not authenticated", () => {
    expect(shouldRedirectToLogin(true, false)).toBe(true);
  });

  it("returns false once hydrated and authenticated", () => {
    expect(shouldRedirectToLogin(true, true)).toBe(false);
  });
});
