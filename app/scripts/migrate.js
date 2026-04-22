require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env.local") });

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

console.log("🚀 Script started...");

// 🔥 IMPORTANT: correct path from app/scripts → root → public/data
const filePath = path.join(__dirname, "../../public/data/questions.json");

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.log("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function migrate() {
  console.log("👉 Inside migrate function...");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("navik");
    const collection = db.collection("questions");

    // OPTIONAL: clear old data (only if you want fresh start)
    // await collection.deleteMany({});
    // console.log("🧹 Old data cleared");

    console.log("📂 Reading JSON file from:", filePath);

    if (!fs.existsSync(filePath)) {
      console.log("❌ JSON file not found at path above");
      return;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw || "{}");

    console.log("📊 Data loaded. Classes found:", Object.keys(data));

    let totalInserted = 0;

    for (const className in data) {
      for (const subject in data[className]) {
        const topics = data[className][subject].topics;

        for (const topic in topics) {
          const questions = topics[topic];

          const docs = questions.map((q) => ({
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
            totalInserted += docs.length;
            console.log(`✅ Inserted ${docs.length} from topic: ${topic}`);
          }
        }
      }
    }

    console.log(`🚀 Migration complete: ${totalInserted} questions inserted`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await client.close();
    console.log("🔌 Connection closed");
  }
}

migrate();