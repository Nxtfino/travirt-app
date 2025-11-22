import { GoogleGenerativeAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key missing. AI functions disabled.");
}

const ai = new GoogleGenerativeAI({
  apiKey: API_KEY!,
});

export const summarizeNews = async (headlines: string[]): Promise<string> => {
  if (!API_KEY) {
    return "Gemini API key missing.";
  }

  try {
    const prompt = `Summarize these stock market headlines:\n\n- ${headlines.join("\n- ")}`;

    const result = await ai.generateText({
      model: "gemini-1.5-flash",
      prompt,
    });

    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error summarizing headlines.";
  }
};
