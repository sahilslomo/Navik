import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// ================== GET ==================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const className = searchParams.get("className");
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");

    if (!className || !subject) {
      return NextResponse.json(
        { success: false, message: "Missing params" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("navik");
    const collection = db.collection("questions");

    const query: any = { className, subject };
    if (topic) query.topic = topic;

    const data = await collection.find(query).toArray();

    const formatted = data.map((item: any) => ({
      id: item._id.toString(),
      question: item.question,
      answer: item.answer,
      labels: item.labels || [],
      topic: item.topic,
    }));

    return NextResponse.json(
      { success: true, data: formatted },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ================== POST ==================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      action,
      className,
      subject,
      topic,
      id,
      question,
      answer,
      labels,
      bulkText,
    } = body;

    if (!className || !subject) {
      return NextResponse.json(
        { success: false, message: "Missing class or subject" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("navik");
    const collection = db.collection("questions");

    // ===== ADD =====
    if (action === "ADD_QUESTION") {
      if (!topic || !question || !answer) {
        return NextResponse.json({ success: false }, { status: 400 });
      }

      await collection.insertOne({
        className,
        subject,
        topic,
        question,
        answer,
        labels: labels || [],
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ===== BULK =====
    if (action === "BULK_ADD") {
      if (!topic || !bulkText) {
        return NextResponse.json({ success: false }, { status: 400 });
      }

      const blocks = bulkText.split("###");

      const docs = blocks
        .map((block: string) => {
          const lines = block.trim().split("\n");

          if (lines.length >= 2) {
            return {
              className,
              subject,
              topic,
              question: lines[0],
              answer: lines.slice(1).join("\n"),
              labels: [],
              createdAt: new Date(),
            };
          }
          return null;
        })
        .filter(Boolean);

      if (docs.length > 0) {
        await collection.insertMany(docs);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ===== UPDATE =====
    if (action === "UPDATE_QUESTION") {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ success: false }, { status: 400 });
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            question,
            answer,
            labels: labels || [],
          },
        }
      );

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ===== DELETE QUESTION =====
    if (action === "DELETE_QUESTION") {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ success: false }, { status: 400 });
      }

      await collection.deleteOne({
        _id: new ObjectId(id),
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ===== DELETE TOPIC =====
    if (action === "DELETE_TOPIC") {
      if (!topic) {
        return NextResponse.json({ success: false }, { status: 400 });
      }

      await collection.deleteMany({
        className,
        subject,
        topic,
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ success: false }, { status: 400 });
  } catch (error) {
    console.error("POST ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}