import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./session";
import { loginUrl } from "./paths";

export type { SessionUser };

export async function requireUser(): Promise<
  { user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Sign in to continue.", login: loginUrl("/generate") },
        { status: 401 },
      ),
    };
  }
  return { user };
}
