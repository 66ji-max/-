import { GoogleGenAI } from "@google/genai";

// Initialize the client
// Ideally, the API key should be properly handled. For this demo environment, 
// we assume process.env.API_KEY is available as per instructions.
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

const DEFAULT_INSTRUCTION = "You are 'xLab AI', a futuristic artificial intelligence assistant for SFC (SanTai Corp). You specialize in Cross-border E-commerce, Logistics, and AI SaaS software. Your tone is professional, futuristic, and insightful. Keep answers concise.";

export interface FileData {
  mimeType: string;
  data: string;
}

export const streamGeminiResponse = async (
  prompt: string, 
  onChunk: (text: string) => void,
  systemInstruction?: string,
  files?: FileData[]
): Promise<string> => {
  if (!apiKey) {
    const errorMsg = "API Key not configured.";
    onChunk(errorMsg);
    return errorMsg;
  }

  try {
    const parts: any[] = [];
    
    // Add files if present
    if (files && files.length > 0) {
      files.forEach(file => {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      });
    }

    // Add text prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash-exp', // Switch to 2.0 Flash Exp for better multimodal stability
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      config: {
        systemInstruction: systemInstruction || DEFAULT_INSTRUCTION,
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
    const errorMsg = "xLab System Error: Connection interrupted. Please try again or check your file format.";
    onChunk(errorMsg);
    return errorMsg;
  }
};