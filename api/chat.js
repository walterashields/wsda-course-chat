import OpenAI from "openai";

export default async function handler(req, res) {
  // Basic CORS (Thinkific + your domain)
  const origin = req.headers.origin || "";
  const allowed = [
    "https://wsdalearning.ai",
    "https://www.wsdalearning.ai"
    // Add your Thinkific domain after we confirm it (example: https://wsda.thinkific.com)
  ];

  if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { course_id = "course_1", question = "" } = req.body || {};
    if (!question.trim()) return res.status(400).json({ error: "Missing question" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Phase 1: fast + good (no RAG yet). We’ll add your course index after this is live.
    const system = `
You are WSDA Course Support.
Course: ${course_id}

Rules:
- Be concise, friendly, step-by-step.
- If the question depends on course materials you can’t see yet, say what to check in the lesson (Lesson title, Quiz, Project) and ask 1 clarifying question.
- Never invent lesson-specific facts. If unsure, say so.
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: question }
      ]
    });

    const answer =
      response.output_text ||
      "I couldn’t generate an answer. Please try again.";

    return res.status(200).json({ answer });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: err?.message || String(err)
    });
  }
}
