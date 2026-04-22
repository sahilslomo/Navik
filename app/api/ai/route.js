import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();

    const question = body?.question || "";
    const answer = body?.answer || "";

    if (!question || !answer) {
      return NextResponse.json(
        { result: "❌ Missing question or answer" },
        { status: 400 }
      );
    }

    // ✅ STRONG SYSTEM PROMPT (FIXED)
    const systemPrompt = `
You are a Master Mariner with 30+ years of experience in merchant shipping.

🎯 Role:
Train me for Chief Engineer oral exams and real onboard competency.

📚 Coverage Areas:
- Safety (firefighting, LSA/FFA, drills, emergencies, ISM, PSC, UNCLOS, MLC, STCW, and all other Codes and Conventions)
- Electrical (generators, switchboards, motors, protection, alarms etc)
- MEP (pumps, compressors, boilers, purifiers, refrigeration etc)
- Propulsion/Motors (main engine, fuel, lube, cooling, auxiliaries etc)

🧠 Answer Format (STRICT):
CLEAR explaination with EXAMPLES and REFERENCE DOCUMENT
`;

    // ✅ STRONG USER PROMPT
    const userPrompt = `
QUESTION:
${question}

MY ANSWER (IMPORTANT - MUST BE USED):
${answer}

INSTRUCTION:
- Extract keywords from MY ANSWER
- Use my wording in your explanation
- Improve and structure it like a Chief Engineer
- Do NOT ignore my answer
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // 🔁 change to "gpt-4o" for better quality
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("Empty AI response");
    }

    const result = response.choices[0].message?.content || "";

    return NextResponse.json({ result });

  } catch (error) {
    console.error("🔥 FULL AI ERROR:", error);

    return NextResponse.json(
      { result: "❌ AI failed. Check API key / model / logs." },
      { status: 500 }
    );
  }
}