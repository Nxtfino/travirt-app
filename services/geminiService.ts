
import { GoogleGenAI } from "@google/genai";

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const summarizeNews = async (headlines: string[]): Promise<string> => {
    if (!API_KEY) {
        return "Gemini API key is not configured. Please set up your API key to use this feature.";
    }
    try {
        const prompt = `You are a financial analyst for an Indian trading platform. Summarize the following market news headlines into a single, insightful paragraph for a retail trader. Focus on the key market sentiment, sector trends, and potential impact on major stocks. Keep it concise and easy to understand.

Headlines:
- ${headlines.join('\n- ')}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error("Error summarizing news with Gemini:", error);
        return "Could not generate summary at this time. Please try again later.";
    }
};