import OpenAI from "openai";

// 1. 读取环境变量
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const baseURL = import.meta.env.VITE_GEMINI_BASE_URL || 'https://catiecli.sukaka.top/v1';

const DEFAULT_INSTRUCTION = "You are 'xLab AI', a futuristic artificial intelligence assistant for SFC (SanTai Corp). You specialize in Cross-border E-commerce, Logistics, and AI SaaS software. Your tone is professional, futuristic, and insightful. Keep answers concise.";

export interface FileData {
  mimeType: string;
  data: string; // 这里的 data 是 base64 字符串
}

export const streamGeminiResponse = async (
    prompt: string,
    onChunk: (text: string) => void,
    systemInstruction?: string,
    files?: FileData[]
): Promise<string> => {

  // 2. 检查 Key
  if (!apiKey) {
    const errorMsg = "配置错误: 未找到 API Key。请检查 .env 文件。";
    console.error(errorMsg);
    onChunk(errorMsg);
    return errorMsg;
  }

  try {
    // 3. 初始化 OpenAI SDK (用于连接中转站)
    // dangerouslyAllowBrowser: true 是必须的，因为你在前端 Vite 中直接调用
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      dangerouslyAllowBrowser: true
    });

    // 4. 构建消息列表
    const messages: any[] = [
      {
        role: "system",
        content: systemInstruction || DEFAULT_INSTRUCTION
      }
    ];

    // 处理用户消息和图片
    const userContent: any[] = [{ type: "text", text: prompt }];

    if (files && files.length > 0) {
      files.forEach(file => {
        // OpenAI 格式需要完整的 Data URL (例如: data:image/png;base64,...)
        const dataUrl = `data:${file.mimeType};base64,${file.data}`;
        userContent.push({
          type: "image_url",
          image_url: {
            url: dataUrl
          }
        });
      });
    }

    messages.push({
      role: "user",
      content: userContent
    });

    // 5. 发起流式请求
    // 注意：这里的 model 要填 'gemini-pro' 或 'gemini-1.5-pro'，
    // 具体取决于你的中转站支持什么名字，通常 gemini-pro 是通用的。
    const stream = await openai.chat.completions.create({
      model: 'gemini-pro',
      messages: messages,
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }
    return fullText;

  } catch (error: any) {
    console.error("API Error Detail:", error);

    let errorMsg = "系统错误: 连接被中断。";
    if (error.message) {
      errorMsg = `请求失败: ${error.message}`;
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};