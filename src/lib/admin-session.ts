import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 24;
export const ADMIN_SESSION_COOKIE = "admin-session";

function signingKey() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac(
    "sha256",
    process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SESSION_SECRET || password,
  )
    .update(`el-arcangel:admin:${password}`)
    .digest();
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(
    createHash("sha256").update(password).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

export async function createAdminSessionToken(): Promise<string> {
  const key = signingKey();
  if (!key) throw new Error("Falta configurar ADMIN_PASSWORD.");
  const expiresAt = String(Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000);
  return `${expiresAt}.${createHmac("sha256", key).update(expiresAt).digest("base64url")}`;
}

export async function verifyAdminSessionToken(
  token?: string,
): Promise<boolean> {
  const key = signingKey();
  if (!key || !token) return false;
  const parts = token.split(".");
  if (
    parts.length !== 2 ||
    !/^\d+$/.test(parts[0]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  )
    return false;
  const expiration = Number(parts[0]);
  if (
    !Number.isSafeInteger(expiration) ||
    expiration <= Date.now() ||
    expiration > Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000
  )
    return false;
  const expected = createHmac("sha256", key).update(parts[0]).digest();
  const actual = Buffer.from(parts[1], "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  return verifyAdminSessionToken(
    (await cookies()).get(ADMIN_SESSION_COOKIE)?.value,
  );
}
