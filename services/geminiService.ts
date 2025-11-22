import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("⚠️ Gemini API Key not found. AI features disabled.");
}

const genAI = new GoogleGenerativeAI(API_KEY!);

// Pre-load model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const summarizeNews = async (headlines: string[]): Promise<string> => {
  if (!API_KEY) return "Gemini API key missing.";

  try {
    const prompt = `
      Summarize these stock market headlines for an Indian retail trader:
      - ${headlines.join("\n- ")}
    `;

    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate summary.";
  }
};
