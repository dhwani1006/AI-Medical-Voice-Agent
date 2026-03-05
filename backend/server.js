import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

console.log("HF KEY PRESENT:", !!process.env.HF_API_KEY);
console.log("DG KEY PRESENT:", !!process.env.DEEPGRAM_API_KEY);

/* ===============================
   1️⃣ CHAT (HF Router)
================================ */
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Meta-Llama-3-8B-Instruct",
          messages: [
            {
              role: "system",
              content: `
You are an AI telemedicine voice assistant.

You are NOT a physical doctor.
You cannot examine or perform procedures.

Provide short (2-4 sentence) clear responses.
Give safe advice.
Suggest nearby hospital ONLY if symptoms are serious.
Avoid dramatic or invasive suggestions.
`
            },
            ...messages
          ],
          max_tokens: 80,
          temperature: 0.5
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.json({
        reply: data.error?.message || "AI error occurred."
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "I’m unable to respond at the moment.";

    res.json({ reply });

  } catch (err) {
    console.log("CHAT ERROR:", err);
    res.json({ reply: "AI service unavailable." });
  }
});

/* ===============================
   2️⃣ TTS (Deepgram)
================================ */
app.post("/api/tts", async (req, res) => {
  const { text, voice } = req.body;

  try {
    const dgResponse = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!dgResponse.ok) {
      return res.status(500).json({ error: "TTS failed" });
    }

    const audioBuffer = Buffer.from(await dgResponse.arrayBuffer());

    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);

  } catch (err) {
    console.log("TTS ERROR:", err);
    res.status(500).json({ error: "TTS error" });
  }
});

/* ===============================
   3️⃣ REPORT (FIXED)
================================ */
app.post("/api/report", async (req, res) => {
  const { messages } = req.body;

  // ✅ Check if user actually spoke
  const userMessages = messages.filter(m => m.role === "user");

  if (!userMessages.length) {
    return res.json({
      report: {
        name: "Not Provided",
        age: "Not Provided",
        concern: "No consultation performed",
        advice: "No medical advice generated because no symptoms were provided."
      }
    });
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Meta-Llama-3-8B-Instruct",
          messages: [
            {
              role: "system",
              content: `
You are a medical data extraction system.

Only extract real data from the conversation.
Do NOT invent missing information.

If a field is not mentioned, return "Not Provided".

Return STRICT JSON:
{
  "name": "",
  "age": "",
  "concern": "",
  "advice": ""
}
`
            },
            ...messages
          ],
          temperature: 0,
          max_tokens: 200
        }),
      }
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const match = content.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Invalid JSON");
    }

    const parsed = JSON.parse(match[0]);

    res.json({ report: parsed });

  } catch (err) {
    console.log("REPORT ERROR:", err);
    res.json({
      report: {
        name: "Not Provided",
        age: "Not Provided",
        concern: "Extraction failed",
        advice: "Unable to generate structured report."
      }
    });
  }
});
/* ===============================
   START SERVER
================================ */
app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});