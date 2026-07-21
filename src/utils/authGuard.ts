export function shouldRedirectToLogin(
  hydrated: boolean,
  authenticated: boolean
): boolean {
  return hydrated && !authenticated;
}
