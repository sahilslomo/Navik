import { NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "../../lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      name,
      courseClass,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !email ||
      !name ||
      !courseClass ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // ✅ DEBUG LOGS
    console.log("🔍 Verifying Payment...");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);

    // ✅ VERIFY SIGNATURE
    const bodyString = razorpay_order_id + "|" + razorpay_payment_id;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(bodyString)
      .digest("hex");

    console.log("Expected:", generated_signature);
    console.log("Received:", razorpay_signature);

    if (generated_signature !== razorpay_signature) {
      console.error("❌ Signature mismatch");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log("✅ Signature verified");

    const client = await clientPromise;
    const db = client.db("navik");

    // ✅ UPDATE ORDER
    await db.collection("orders").updateOne(
      { order_id: razorpay_order_id },
      {
        $set: {
          payment_id: razorpay_payment_id,
          status: "paid",
          paid_at: new Date(),
        },
      }
    );

    // ✅ SAVE PREMIUM PER COURSE
    await db.collection("premiumUsers").updateOne(
      { email, courseClass },
      {
        $set: {
          name,
          premium: true,
          upgraded_at: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 Verify payment error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
