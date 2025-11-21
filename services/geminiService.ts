import { GoogleGenerativeAI } from "@google/generative-ai";

// Assume process.env.API_KEY is available
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenerativeAI({ apiKey: API_KEY! });

export const summarizeNews = async (headlines: string[]): Promise<string> => {
  if (!API_KEY) {
      return "Gemini API key is not configured.";
  }
  try {
      const prompt = `
      Summarize these headlines for a retail trader:
      - ${headlines.join("\n- ")}
      `;

      const response = await ai.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
      });

      return response.response.text();
  } catch (error) {
      console.error(error);
      return "Could not generate summary.";
  }
};
