import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { courseClass, subject, topic, questionId, note } = body;

    const client = await clientPromise;
    const db = client.db("navik");

    await db.collection("notes").insertOne({
      courseClass,
      subject,
      topic,
      questionId,
      ...note,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Save note error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
