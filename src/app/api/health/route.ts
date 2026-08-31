import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "shivayonic-core", timestamp: new Date().toISOString() });
}
