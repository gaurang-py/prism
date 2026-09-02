import type { SessionUser } from "./session";

/** First admin — also promoted on signup if this email registers. */
export const BOOTSTRAP_ADMIN_EMAIL = "gaurangpatel@tripzygo.in";

export function isBootstrapAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}

export function isAdminUser(user: Pick<SessionUser, "role">): boolean {
  return user.role === "admin";
}

export function roleForNewUser(email: string): "user" | "admin" {
  return isBootstrapAdminEmail(email) ? "admin" : "user";
}
