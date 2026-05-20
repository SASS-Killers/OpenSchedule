import type { APIRoute } from "astro";

export const POST: APIRoute = async () => {
  // Clear the session cookie by setting it in the past
  return new Response(null, {
    status: 302,
    headers: {
      location: "/login",
      "set-cookie": "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
};
