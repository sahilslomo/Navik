import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession();

  // ✅ FIXED
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  const { courseClass, topic } = await req.json();

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection("users").findOne({ email });

  const key = `meo${courseClass}`;
  let limits = user?.limits || {};

  if (!limits[key]) {
    limits[key] = { topicsViewed: [], used: 0, isPremium: false };
  }

  const course = limits[key];

  if (course.isPremium) {
    return NextResponse.json({ remaining: 999, locked: false });
  }

  if (topic && !course.topicsViewed.includes(topic)) {
    course.topicsViewed.push(topic);
    course.used += 1;
  }

  const remaining = Math.max(20 - course.used, 0);
  const locked = course.used >= 20;

  await db.collection("users").updateOne(
    { email },
    { $set: { limits } },
    { upsert: true }
  );

  return NextResponse.json({ remaining, locked });
}
