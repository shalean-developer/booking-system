import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

type RevalidateBody = {
  paths?: unknown;
};

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export async function POST(request: Request) {
  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body. Expected { paths: string[] }" },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.paths)) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload. 'paths' must be a string array." },
      { status: 400 }
    );
  }

  const normalizedPaths = Array.from(
    new Set(
      body.paths
        .filter((value): value is string => typeof value === "string")
        .map((value) => normalizePath(value))
        .filter(Boolean)
    )
  );

  if (normalizedPaths.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid paths provided for revalidation." },
      { status: 400 }
    );
  }

  for (const path of normalizedPaths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    ok: true,
    revalidated: normalizedPaths.length,
    paths: normalizedPaths,
  });
}

