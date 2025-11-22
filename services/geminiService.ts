import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenerativeAI(API_KEY!);

export const summarizeNews = async (headlines: string[]): Promise<string> => {
  if (!API_KEY) {
    return "Gemini API key is not configured.";
  }

  try {
    const prompt = `
      Summarize these headlines for a retail Indian trader:
      - ${headlines.join("\n- ")}
    `;

    // Works with your installed SDK version
    const result = await ai.generateText({
      model: "gemini-2.0-flash",
      prompt,
    });

    return result.text();
  } catch (error) {
    console.error("Gemini error:", error);
    return "Could not generate summary.";
  }
};
