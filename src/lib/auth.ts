import { SignJWT, jwtVerify } from "jose";

// PostgREST treats the JWT 'role' claim as a database role to SET ROLE to.
// We use 'userrole' instead to avoid this, and map it back in the session.
export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "host";
}

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-do-not-use-in-prod-change-me");

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload, userrole: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as any;
    return {
      userId: p.userId || p.userid || "",
      email: p.email || "",
      name: p.name || "",
      role: p.role || p.userrole || "host",
    };
  } catch {
    return null;
  }
}
