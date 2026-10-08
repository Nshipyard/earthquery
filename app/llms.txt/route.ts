import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** GET /llms.txt: agent-readable project description, served from the repo-root llms.txt. */
export async function GET() {
  const text = await readFile(join(process.cwd(), "llms.txt"), "utf8");
  return new NextResponse(text, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
