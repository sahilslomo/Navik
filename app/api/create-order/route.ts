// /app/api/create-order/route.ts
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseClass } = body;

    if (!courseClass) {
      return NextResponse.json(
        { success: false, error: "Missing courseClass" },
        { status: 400 }
      );
    }

    const amount = courseClass === "4" ? 39900 : 79900; // ₹399 or ₹799 in paise

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1 as any, // auto-capture
    });

    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("❌ Create order error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
