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

    const query: any = {
  className: { $regex: new RegExp(`^${className}$`, "i") },
  subject: { $regex: new RegExp(`^${subject}$`, "i") },
};

if (topic) {
  query.topic = { $regex: new RegExp(`^${topic}$`, "i") };
}
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
      questions,
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
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
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
  if (!topic || !Array.isArray(questions)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const docs = questions.map((q: any) => ({
    className,
    subject,
    topic,
    question: q.question,
    answer: q.answer,
    labels: q.labels || [],
    createdAt: new Date(),
  }));

  if (docs.length > 0) {
    await collection.insertMany(docs);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

    // ===== UPDATE =====
    if (action === "UPDATE_QUESTION") {
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
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
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
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