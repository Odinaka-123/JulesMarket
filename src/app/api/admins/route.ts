import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

function isSuperAdmin(uid: string) {
  return uid === process.env.ADMIN_UID;
}

export async function POST(req: NextRequest) {
  const sessionUid = (await cookies()).get("admin-session")?.value; // ← await added
  if (!sessionUid || !isSuperAdmin(sessionUid)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, name } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existing = await adminDb
    .collection("admins")
    .where("email", "==", email.toLowerCase().trim())
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Already an admin" }, { status: 409 });
  }

  const ref = await adminDb.collection("admins").add({
    email: email.toLowerCase().trim(),
    name: name?.trim() || null,
    addedAt: new Date().toISOString(),
  });

  return NextResponse.json({ id: ref.id });
}

export async function DELETE(req: NextRequest) {
  const sessionUid = (await cookies()).get("admin-session")?.value; // ← await added
  if (!sessionUid || !isSuperAdmin(sessionUid)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await adminDb.collection("admins").doc(id).delete();
  return NextResponse.json({ success: true });
}
