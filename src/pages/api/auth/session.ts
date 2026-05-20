import type { APIRoute } from "astro";
import { signSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  // Handle both JSON and form-encoded submissions
  let userId: string, email: string, name: string, role: string;

  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await request.json();
    userId = body.userId;
    email = body.email;
    name = body.name;
    role = body.role;
  } else {
    const form = await request.formData();
    userId = form.get("userId") as string;
    email = form.get("email") as string;
    name = form.get("name") as string;
    role = form.get("role") as string;
  }

  if (!userId || !email) {
    return new Response(JSON.stringify({ error: "userId and email required" }), { status: 400 });
  }

  const token = await signSession({ userId, email, name, role: role || "host" });

  const isSecure = request.url.startsWith("https");
  const cookie = `session=${token}; SameSite=Lax; Path=/; Max-Age=604800${isSecure ? "; Secure" : ""}`;

  return new Response(null, {
    status: 302,
    headers: {
      location: "/hosts/me",
      "set-cookie": cookie,
    },
  });
};
