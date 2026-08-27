import type { SessionUser } from "./session";
import { getReadUrl, r2Configured } from "./r2";

export async function serializeUser(user: SessionUser) {
  let avatarUrl = "";
  if (user.avatarKey && r2Configured()) {
    try {
      avatarUrl = await getReadUrl(user.avatarKey);
    } catch (error) {
      console.error("[r2] avatar URL failed", error);
    }
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    avatarUrl,
    credits: user.credits,
  };
}

export type PublicUser = Awaited<ReturnType<typeof serializeUser>>;
