import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb"; // relative path

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("navik");

    await db.collection("test").insertOne({ name: "NAVIK WORKS 🚀", createdAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DB test error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
