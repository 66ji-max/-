import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. 使用 Vite 专用的 import.meta.env 读取环境变量
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

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

  // 2. 检查 Key 是否存在
  if (!apiKey) {
    const errorMsg = "配置错误: 未找到 API Key。请检查 .env 文件中是否有 VITE_GEMINI_API_KEY";
    console.error(errorMsg);
    onChunk(errorMsg);
    return errorMsg;
  }

  try {
    // 3. 初始化 Web 版 SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemInstruction || DEFAULT_INSTRUCTION
    });

    const promptParts: any[] = [];

    // 处理文件附件
    if (files && files.length > 0) {
      files.forEach(file => {
        promptParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      });
    }

    promptParts.push(prompt);

    // 4. 发起请求
    const result = await model.generateContentStream(promptParts);

    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }
    return fullText;

  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);

    let errorMsg = "系统错误: 连接被中断。";
    if (error.message) {
      if (error.message.includes('401') || error.message.includes('API key')) {
        errorMsg = "认证失败: API Key 无效。请检查 .env 文件。";
      } else if (error.message.includes('fetch failed')) {
        errorMsg = "网络错误: 无法连接到 Google AI。请确保您的 VPN/代理已开启并覆盖浏览器。";
      }
    }

    onChunk(errorMsg);
    return errorMsg;
  }
};