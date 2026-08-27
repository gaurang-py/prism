import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";
import { hmacToken, randomToken } from "./crypto";

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "bio" | "avatarKey" | "credits"
>;

export async function createSession(userId: string): Promise<string> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hmacToken(token),
      expiresAt,
    },
  });
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;
  let tokenHash: string;
  try {
    tokenHash = hmacToken(token);
  } catch {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          bio: true,
          avatarKey: true,
          credits: true,
        },
      },
    },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }
  return session.user;
}

export async function destroyCurrentSession(): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    try {
      await prisma.session.deleteMany({ where: { tokenHash: hmacToken(token) } });
    } catch {
      // AUTH_SECRET missing or DB down — still clear the cookie
    }
  }
  await clearSessionCookie();
}
