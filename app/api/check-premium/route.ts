import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const email = url.searchParams.get("email");
    const courseClass = url.searchParams.get("courseClass"); // ✅ FIX

    if (!email || !courseClass) {
      return NextResponse.json(
        { success: false, error: "Email and courseClass required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("navik");

    const user = await db.collection("premiumUsers").findOne({
      email,
      courseClass,
    });

    return NextResponse.json({
      success: true,
      premium: !!user,
    });
  } catch (err: any) {
    console.error("Check premium error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
