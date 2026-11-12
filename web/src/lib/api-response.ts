import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(err: unknown, status = 500) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation error",
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ ok: false, error: message }, { status });
}

