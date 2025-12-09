// src/server.ts

type Recipe = {
  slug: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  keywords?: string[];
  meals?: string[];
  totalWeightGrams?: number;
  macros?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
};

const RECIPES_PATH = "./data/recipes.json";

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
  const filePath =
    pathname === "/" ? "./public/index.html" : `./public${pathname}`;

  try {
    const data = await Deno.readFile(filePath);
    return new Response(data, {
      headers: {
        "content-type": getContentType(filePath),
      },
    });
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // JSON API
  if (pathname === "/recipes.json") {
    try {
      const text = await Deno.readTextFile(RECIPES_PATH);
      const parsed = JSON.parse(text);
      const recipes: Recipe[] = Array.isArray(parsed) ? parsed : [];
      return new Response(JSON.stringify(recipes), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } catch (err) {
      console.error("Failed to read recipes.json", err);
      return new Response("[]", {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
  }

  // Static files (HTML, CSS, JS, etc.)
  const staticResponse = await serveStatic(pathname);
  if (staticResponse) return staticResponse;

  return new Response("Not found", { status: 404 });
});
