import { NextRequest, NextResponse } from "next/server";

const ADMIN_UID = process.env.ADMIN_UID; // set this in .env.local

export async function POST(request: NextRequest) {
  const { uid } = await request.json();

  if (!uid) {
    return NextResponse.json({ error: "No UID provided" }, { status: 400 });
  }

  // Optional: whitelist only your UID
  if (ADMIN_UID && uid !== ADMIN_UID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("admin-session", uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin-session");
  return response;
}