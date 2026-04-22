import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("navik");

    const testEmail = "testuser@example.com";

    // 1️⃣ Insert test order
    const orderResult = await db.collection("testOrders").insertOne({
      user: testEmail,
      amount: 19900,
      currency: "INR",
      createdAt: new Date(),
    });

    // 2️⃣ Mark user as premium
    await db.collection("premiumUsers").updateOne(
      { email: testEmail },
      {
        $set: {
          premium: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          name: "Test User",
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 3️⃣ Check premium status
    const user = await db.collection("premiumUsers").findOne({ email: testEmail });

    return NextResponse.json({
      success: true,
      testOrderId: orderResult.insertedId,
      premiumStatus: user?.premium || false,
    });
  } catch (err: any) {
    console.error("Full flow test error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}