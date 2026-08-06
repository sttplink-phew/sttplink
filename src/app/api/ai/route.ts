import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "AI endpoints not yet implemented" },
    { status: 501 }
  );
}
