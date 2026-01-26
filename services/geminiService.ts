import { GoogleGenAI } from "@google/genai";

// Initialize the client
// Ideally, the API key should be properly handled. For this demo environment, 
// we assume process.env.API_KEY is available as per instructions.
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const streamGeminiResponse = async (
  prompt: string, 
  onChunk: (text: string) => void
): Promise<string> => {
  if (!apiKey) {
    const errorMsg = "API Key not configured.";
    onChunk(errorMsg);
    return errorMsg;
  }

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        systemInstruction: "You are 'xLab AI', a futuristic artificial intelligence assistant for SFC (SanTai Corp). You specialize in Cross-border E-commerce, Logistics, and AI SaaS software. Your tone is professional, futuristic, and insightful. Keep answers concise.",
      }
    });

    let fullText = '';
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMsg = "xLab System Error: Connection interrupted.";
    onChunk(errorMsg);
    return errorMsg;
  }
};