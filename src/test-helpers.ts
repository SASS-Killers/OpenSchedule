import { vi } from "vitest";

// Mock the database module
vi.mock("@/db/neon", () => ({
  query: new Proxy(async () => [], {
    apply(target, thisArg, args) {
      return Promise.resolve([]);
    },
  }),
  raw: async (sql: string) => [],
  __esModule: true,
}));

// Helper to create an Astro-style APIRoute context
export function mockAPIContext({
  method = "GET",
  url = "http://localhost:6969/api/test",
  body = null,
  headers = {} as Record<string, string>,
  cookies = "",
} = {}) {
  const req = new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      cookie: cookies,
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  });
  return { request: req, url: new URL(url) };
}

// Helper to create an Astro page context (for .astro pages)
export function mockPageContext({
  url = "http://localhost:6969/",
  cookies = "",
  params = {} as Record<string, string>,
} = {}) {
  const req = new Request(url, {
    headers: { cookie: cookies },
  });
  return {
    request: req,
    url: new URL(url),
    params,
    redirect: (path: string) => new Response(null, { status: 302, headers: { location: path } }),
  };
}
