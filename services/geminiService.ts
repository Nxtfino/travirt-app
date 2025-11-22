import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const summarizeNews = async (headlines: string[]): Promise<string> => {
  if (!API_KEY) {
    return "Gemini API key is not configured.";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
      You are a financial market analyst. Summarize these market news headlines
      into one concise insight for a retail trader:

      - ${headlines.join("\n- ")}
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response;
  } catch (error) {
    console.error("Gemini summarize error:", error);
    return "Could not generate summary.";
  }
};
