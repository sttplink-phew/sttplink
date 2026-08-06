import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Authentication not yet implemented" },
    { status: 501 }
  );
}
