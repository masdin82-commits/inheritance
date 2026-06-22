/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Initialize the Google Gen AI client server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI Features will operate in fallback mode.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple Request Logging Middleware for debugging
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${req.method} ${req.url}\n`;
    try {
      fs.appendFileSync(path.join(process.cwd(), "req-log.txt"), logMsg, "utf8");
    } catch (e) {
      console.error("Failed to write request log:", e);
    }
    next();
  });

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiEnabled: !!ai });
  });

  // API Route: Explain Faraid calculation using Gemini 3.5 Flash
  app.post("/api/inheritance/explain", async (req, res) => {
    try {
      const { calculationResult, madhab = "General Sunni" } = req.body;
      
      if (!calculationResult) {
        return res.status(400).json({ error: "No calculation results provided." });
      }

      if (!ai) {
        return res.json({ 
          explanation: "AI Features are currently simulating! (GEMINI_API_KEY is not defined in Secrets panel).\n\n" +
            "Under " + madhab + " Islamic Jurisprudence, the estate of " + (calculationResult.inputs.deceasedName || "the deceased") + " is broken down as follows.\n" +
            "First, liabilities such as funeral expenses (" + calculationResult.funeralDeducted.toLocaleString() + ") and debts (" + calculationResult.debtsDeducted.toLocaleString() + ") were paid.\n" +
            "Then, the remaining estate was allocated based on fixed Quranic shares (Zawil Furud) and residuaries (Asabah). " +
            (calculationResult.adjustmentType === 'aoul' ? "Because the sum of Quranic heirs exceeded 1, Al-Aoul (proportional reduction) was applied." : "") +
            (calculationResult.adjustmentType === 'radd' ? "Because there was a surplus and no residuaries, Al-Radd (return of surplus) was applied to the non-spouse heirs." : "")
        });
      }

      const activeHeirs = calculationResult.heirs.filter((h: any) => h.count > 0);
      const prompt = `You are a highly respected and gentle Mufti and Islamic Inheritance Law expert (Al-Faraid Scholar).
Provide an elegant, compassionate, and mathematically supportive explanation of this inheritance distribution.
The school of thought to follow or reference is: ${madhab}.

### Deceased Details:
- Name: ${calculationResult.inputs.deceasedName || "The Deceased"}
- Gender: ${calculationResult.inputs.gender}
- Total Estate: ${calculationResult.inputs.estateValue.toLocaleString()}
- Debts Paid: ${calculationResult.debtsDeducted.toLocaleString()}
- Funeral Costs Paid: ${calculationResult.funeralDeducted.toLocaleString()}
- Bequests/Wills Paid: ${calculationResult.bequestsDeducted.toLocaleString()} ${calculationResult.bequestCapped ? "(Capped at 1/3 maximum rule)" : ""}
- Net Distributable Estate: ${calculationResult.netEstate.toLocaleString()}

### Distribution Mechanism (Aoul, Radd, or Normal):
- Under logic, the division style was diagnosed as: ${calculationResult.adjustmentType.toUpperCase()} (where raw Siham sum out of 24 was ${calculationResult.rawSihamSum}).

### Heirs and Allocated Shares:
${activeHeirs.map((h: any) => `- **${h.relationship} (${h.arabicName})**: ${h.count} heir(s), Share: ${h.baseShare}, Percentage: ${h.percentage.toFixed(2)}%, Allocated Amount: ${h.amount.toLocaleString()} ${h.isExcluded ? `[EXCLUDED: ${h.exclusionReason}]` : ""}`).join("\n")}

### Steps Followed by Engine:
${calculationResult.steps.map((s: string) => `1. ${s}`).join("\n")}

Format your response perfectly in clean Markdown. Start with a warm greeting and high-level assessment.
Then, break your scholarly review into distinct, elegant sections:
1. **The Legal Priorities**: Briefly mention the fulfillment of funeral costs, debts, and optional bequests first (Surah An-Nisa 4:11 "after any bequest he has made or after debt").
2. **Quranic Heirs (Zawil Furud) & Proofs**: Detail who gets fixed shares and reference the Quranic verses (Surah An-Nisa: 11 for children and parents, 12 for spouses and maternal siblings, 176 for siblings). Explain the theological wisdom behind their fractions.
3. **Residuaries (Asabah) & Inclusion/Exclusion Rules (Hajb)**: Detail who got nothing because they were completely excluded (e.g. why grandfather, brothers, or grandchildren were blocked by closer relatives) and why the residuaries took the remainder.
4. **Al-Aoul or Al-Radd Resolution** (if applicable): Detail why and how proportional adjustment was triggered so the mathematical sum matches the assets exactly.
5. **Final Scholarly Council**: Give a short, comforting ethical summary about keeping family bonds tight and implementing the deceased's destiny fairly.

Keep your tone humble, authoritative, comforting, and clear.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      res.json({ explanation: response.text });
    } catch (error: any) {
      console.error("Error generating explanation:", error);
      res.status(500).json({ error: "Could not generate AI explanation. Please try again." });
    }
  });

  // API Route: Interactive Chat with Sharia Scholar
  app.post("/api/inheritance/chat", async (req, res) => {
    try {
      const { messages, calculationResult, madhab = "General Sunni" } = req.body;
      
      if (!messages || !calculationResult) {
        return res.status(400).json({ error: "Missing required parameters." });
      }

      if (!ai) {
        return res.json({ 
          reply: "I am ready to help, but the search/API key is not configured. Here is a helpful tip: In Islamic probate, spouses never undergo exclusion (Hajb Hirman), but their shares do fluctuate." 
        });
      }

      // We format system instructions alongside the chat history
      const systemInstruction = `You are a compassionate, scholarly Mufti and Faraid (Islamic Inheritance) scholar. 
The user is calculating the estate separation for ${calculationResult.inputs.deceasedName || "the deceased"} (${calculationResult.inputs.gender}) with a Net Estate of ${calculationResult.netEstate.toLocaleString()} and the following active list of heirs:
${calculationResult.heirs.filter((h: any) => !h.isExcluded && h.percentage > 0).map((h: any) => `- ${h.relationship}: ${h.percentage.toFixed(2)}% (${h.baseShare})`).join("\n")}
And the following excluded or zero-share heirs:
${calculationResult.heirs.filter((h: any) => h.isExcluded).map((h: any) => `- ${h.relationship}: EXCLUDED due to ${h.exclusionReason}`).join("\n")}

Respond to user queries regarding Islamic estate laws, calculations, the 4 classic schools (${madhab}), or individual portions with utmost scriptural accuracy (using verses on inheritance like 4:11, 4:12, 4:176 or Sahih Hadiths like 'Give the shares to those who are entitled'). 
Be elegant, warm, and highly informative. Keep answers concise but reassuring, formatting with Markdown. No self-praise or sales language.`;

      // Structure messages for generateContent
      // Map previous chat logs, including the prompt
      const formattedContents = [
        {
          role: "user",
          parts: [{ text: `Here is the current Faraid sheet context.\nSystem Instruction: ${systemInstruction}\n\nLet's start our conversation. I have a question regarding this estate.` }]
        }
      ];

      // Append user messages
      messages.forEach((msg: any) => {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Error in AI Scholar chat:", error);
      res.status(500).json({ error: "Could not communicate with AI Scholar. Please try again." });
    }
  });

  // Vite Integration for Full-Stack App
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as middleware");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
