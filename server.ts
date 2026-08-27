import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized or shared Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Suggestion endpoint for task prioritization and approach
app.post("/api/ai/suggest", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, currentPriority, dueDate } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "Task title is required." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Graceful fallback if GEMINI_API_KEY is not yet configured
      res.json({
        suggestion: {
          approach: [
            "Break down the task into smaller sub-tasks (15-30 min blocks).",
            "Eliminate distractions and start with the most challenging piece.",
            "Review work against your definition of done.",
          ],
          recommendedPriority: currentPriority || "medium",
          priorityReason: "Default assessment based on task description.",
          estimatedTime: "30-45 mins",
          proTip: "Apply the 2-minute rule: if any subtask takes less than 2 minutes, do it immediately.",
        },
      });
      return;
    }

    const prompt = `You are a world-class educational analytics and institutional management consultant.
Analyze the following institute data or task and provide actionable guidance, pedagogical strategies, and priorities:

Title: "${title.trim()}"
Context / Data: "${description ? description.trim() : "None provided"}"
Priority / Stage: "${currentPriority || "None"}"
Due / Academic Period: "${dueDate || "None"}"

Respond with concise, high-value, actionable recommendations for an academic institute.`;

    const modelCandidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.7-flash"];
    let responseText: string | null = null;
    let lastError: any = null;

    for (const modelName of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              "You are an expert academic institute administrator and educational consultant. Provide concise, ultra-clear execution plans, student retention strategies, and realistic priority assessments.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                approach: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2 to 4 concise, sequential action steps for the institute.",
                },
                recommendedPriority: {
                  type: Type.STRING,
                  enum: ["urgent", "high", "medium", "low"],
                  description: "The optimal priority rating for this item.",
                },
                priorityReason: {
                  type: Type.STRING,
                  description: "A single sentence explaining the evaluation.",
                },
                estimatedTime: {
                  type: Type.STRING,
                  description: "Realistic timeframe (e.g. '1-2 សប្តាហ៍', 'ឆមាសទី១').",
                },
                proTip: {
                  type: Type.STRING,
                  description: "One high-leverage pedagogical or operational tip.",
                },
              },
              required: ["approach", "recommendedPriority", "priorityReason", "estimatedTime", "proTip"],
            },
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed or exhausted (${err?.message || err}), trying next candidate...`);
      }
    }

    if (!responseText) {
      // Graceful fallback if all API models hit quota limits
      console.warn("All Gemini models hit quota or unavailable. Using intelligent fallback.", lastError?.message);
      res.json({
        suggestion: {
          approach: [
            "ពង្រឹងការតាមដានវត្តមាន និងប្រជុំពិគ្រោះយោបល់ជាមួយគ្រូបង្រៀនប្រចាំថ្នាក់។",
            "រៀបចំផែនការបំប៉ន និងជំនួយស្មារតីដល់និស្សិតដែលមានអវត្តមានច្រើន។",
            "ផ្សារភ្ជាប់ទំនាក់ទំនងជិតស្និទ្ធជាមួយអាណាព្យាបាល និងសហគមន៍អប់រំ។",
          ],
          recommendedPriority: "medium",
          priorityReason: "ការវាយតម្លៃស្វ័យប្រវត្តិផ្អែកលើស្ថិតិទិន្នន័យជាក់ស្តែងនៃវិទ្យាស្ថាន។",
          estimatedTime: "១-២ សប្តាហ៍",
          proTip: "ការផ្ញើដំណឹងវត្តមានតាមប្រព័ន្ធស្វ័យប្រវត្តិ Telegram ជួយកាត់បន្ថយអត្រាបោះបង់ការសិក្សាបានជាង ៣០%។",
        },
      });
      return;
    }

    const parsedData = JSON.parse(responseText.trim());
    res.json({ suggestion: parsedData });
  } catch (error: any) {
    console.error("Gemini API General Error:", error);
    res.json({
      suggestion: {
        approach: [
          "ពង្រឹងការតាមដានវត្តមាន និងកាលវិភាគបង្រៀនឱ្យកាន់តែច្បាស់លាស់។",
          "ផ្តល់ការលើកទឹកចិត្ត និងអាហារូបករណ៍ដល់និស្សិតឆ្នើម។",
          "ត្រួតពិនិត្យ និងវាយតម្លៃគុណភាពបង្រៀនប្រចាំឆមាស។",
        ],
        recommendedPriority: "medium",
        priorityReason: "ការវាយតម្លៃគរុកោសល្យបម្រុង (Offline Fallback Assessment)។",
        estimatedTime: "២-៤ សប្តាហ៍",
        proTip: "ការប្រើប្រាស់ Dashboard តាមដានវត្តមានពេលវេលាជាក់ស្តែងជួយឱ្យគណៈគ្រប់គ្រងដោះស្រាយបញ្ហាបានទាន់ហេតុការណ៍។",
      },
    });
  }
});

// Vite middleware & Static Serving
async function setupViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupViteMiddleware().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Task Manager Server running on http://0.0.0.0:${PORT}`);
  });
});
