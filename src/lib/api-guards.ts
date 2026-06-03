import { NextRequest, NextResponse } from "next/server";

export const MAX_JSON_BYTES = 10_000;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

type JsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export async function readJsonBody<T>(
  req: NextRequest,
  maxBytes = MAX_JSON_BYTES
): Promise<JsonBodyResult<T>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, error: "invalid", status: 415 };
  }

  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, error: "too_large", status: 413 };
  }

  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    return { ok: false, error: "too_large", status: 413 };
  }

  try {
    return { ok: true, data: JSON.parse(rawBody) as T };
  } catch {
    return { ok: false, error: "invalid", status: 400 };
  }
}
