const RECIPES_PATH = "./recipes.json";

function getContentType(path: string): string {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".json")) return "application/json; charset=utf-8";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  return "application/octet-stream";
}

async function serveStatic(pathname: string): Promise<Response | null> {
  // Serve index.html for "/"
  const filePath = pathname === "/" ? "./index.html" : `.${pathname}`;

  try {
    const data = await Deno.readFile(filePath);
    return new Response(data, {
      headers: { "content-type": getContentType(filePath) },
    });
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Serve recipes.json explicitly (optional, but keeps behaviour consistent)
  if (pathname === "/recipes.json") {
    try {
      const text = await Deno.readTextFile(RECIPES_PATH);
      return new Response(text, {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } catch {
      return new Response("[]", {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
  }

  // Static files from repo root: /css/*, /js/*, /index.html, etc.
  const staticResponse = await serveStatic(pathname);
  if (staticResponse) return staticResponse;

  return new Response("Not found", { status: 404 });
});
