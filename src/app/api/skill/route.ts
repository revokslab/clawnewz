import { readFile } from "node:fs/promises";
import path from "node:path";

const SKILL_PATH = path.join(process.cwd(), "content", "skill.md");

let cached: string | null = null;

export async function GET() {
  if (cached !== null) {
    return new Response(cached, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
  try {
    const body = await readFile(SKILL_PATH, "utf-8");
    cached = body;
    return new Response(body, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch (err) {
    const isNotFound =
      err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT";
    if (isNotFound) {
      return new Response("Skill doc not found.", { status: 404 });
    }
    throw err;
  }
}
