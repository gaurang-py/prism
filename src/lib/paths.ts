export function appUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://127.0.0.1:43123"
  );
}

export function loginUrl(next?: string | null): string {
  const path = next?.startsWith("/") ? next : "/generate";
  return `/login?next=${encodeURIComponent(path)}`;
}

export const AUTH_PAGE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export function isAuthPath(pathname: string): boolean {
  return AUTH_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const PROTECTED_PAGE_PREFIXES = [
  "/generate",
  "/image",
  "/video",
  "/history",
  "/library",
  "/profile",
  "/credits",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
