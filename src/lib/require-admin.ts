import { NextResponse } from "next/server";
import { isAdminUser } from "./admin";
import { requireUser, type SessionUser } from "./require-user";

export async function requireAdmin(): Promise<
  { user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const auth = await requireUser();
  if (auth.error) return auth;
  if (!isAdminUser(auth.user)) {
    return {
      error: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
    };
  }
  return auth;
}
