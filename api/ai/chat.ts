import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export const config = { maxDuration: 60 };

const authenticateFromRequest = (req: VercelRequest): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { userId: string };

    return decoded.userId;
  } catch {
    return null;
  }
};

type PrismaLike = any;

declare global {
  // eslint-disable-next-line no-var
  var __sailguardAiPrisma: PrismaLike | undefined;
}

async function loadPrisma() {
  try {
    const prismaClientModule = await import('@prisma/client');
    const PrismaClient = prismaClientModule.PrismaClient;

    if (!globalThis.__sailguardAiPrisma) {
      globalThis.__sailguardAiPrisma = new PrismaClient();
    }

    return {
      prisma: globalThis.__sailguardAiPrisma,
      error: null as any,
    };
  } catch (error: any) {
    console.error('AI chat failed to load @prisma/client:', error);
    return {
      prisma: null,
      error,
    };
  }
}

const PLAN_LIMITS = {
  free: {
    dailyAiLimit: 10,
    allowAttachment: false,
    allowMultimodal: false,
    allowEci: false,
    allowAdvancedTools: false,
    supportLevel: 'basic',
  },
  startup: {
    dailyAiLimit: 50,
    allowAttachment: true,
    allowMultimodal: true,
    allowEci: false,
    allowAdvancedTools: true,
    supportLevel: 'email',
  },
  pro: {
    dailyAiLimit: null,
    allowAttachment: true,
    allowMultimodal: true,
    allowEci: true,
    allowAdvancedTools: true,
    supportLevel: 'priority',
  },
} as const;

const getLLMConfigLocal = () => {
  const openAiCompatibleKey =
    process.env.SAILGUARD_LLM_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.AUDITEYE_LLM_API_KEY ||
    '';

  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.API_KEY ||
    '';

  const apiKey = openAiCompatibleKey || geminiKey;

  const baseUrl =
    process.env.SAILGUARD_LLM_BASE_URL ||
    process.env.LLM_BASE_URL ||
    process.env.AUDITEYE_LLM_BASE_URL ||
    'https://max.openai365.top/v1';

  const model =
    process.env.SAILGUARD_LLM_MODEL ||
    process.env.LLM_MODEL ||
    process.env.AUDITEYE_PRIMARY_MODEL ||
    'gemini-3.1-pro-preview';

  const fallbackModelsRaw =
    process.env.SAILGUARD_LLM_FALLBACK_MODELS ||
    process.env.LLM_FALLBACK_MODELS ||
    process.env.LLM_FALLBACK_MODEL ||
    process.env.AUDITEYE_FALLBACK_MODELS ||
    'gemini-3-flash-preview';

  const fallbackModels = fallbackModelsRaw
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  const provider = openAiCompatibleKey
    ? 'openai-compatible'
    : geminiKey
      ? 'gemini'
      : 'mock';

  return {
    provider,
    configured: Boolean(apiKey),
    apiKey,
    baseUrl,
    model,
    fallbackModels,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendSse = (payload: any) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const finishSse = () => {
    res.write('data: [DONE]\n\n');
    res.end();
  };

  if (req.method !== 'POST') {
    sendSse({ error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' });
    finishSse();
    return;
  }

  const userId = authenticateFromRequest(req);
  if (!userId) {
    sendSse({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    finishSse();
    return;
  }

  const { prisma, error: prismaError } = await loadPrisma();
  if (!prisma) {
    sendSse({ error: 'Prisma client failed to load', code: 'PRISMA_CLIENT_LOAD_FAILED' });
    finishSse();
    return;
  }

  const { prompt, systemInstruction, attachmentFileId, sessionId, title, topic } = req.body;

  try {
    let databaseConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch {
       // Let the actual query catch block handle DB down
    }

    const membership = await prisma.membership.findUnique({ where: { userId } });
    if (!membership || (membership.status !== 'active' && membership.status !== 'trial')) {
      sendSse({ error: "Membership inactive or expired", code: "MEMBERSHIP_INACTIVE" });
      finishSse();
      return;
    }
    
    const llmConfig = getLLMConfigLocal();

    const plan = membership.plan || 'free';
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS['free'];
    
    if (attachmentFileId && !limits.allowAttachment) {
      sendSse({ error: "File analysis requires Startup or Pro plan", code: "ATTACHMENT_REQUIRES_STARTUP" });
      finishSse();
      return;
    }
    
    const isEci = topic === 'ECI' || (systemInstruction && systemInstruction.includes('Employee Striver Index')) || (systemInstruction && systemInstruction.includes('ECI'));
    if (isEci && !limits.allowEci) {
        sendSse({ error: "ECI analysis requires Pro", code: "ECI_REQUIRES_PRO" });
        finishSse();
        return;
    }
    
    if (limits.dailyAiLimit !== null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const usageCount = await prisma.usageRecord.count({
            where: {
                userId,
                featureType: 'ai_chat',
                createdAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        
        if (usageCount >= limits.dailyAiLimit) {
            const code = plan === 'free' ? 'FREE_DAILY_LIMIT_REACHED' : 'STARTUP_DAILY_LIMIT_REACHED';
            sendSse({ error: "Daily limit reached", code });
            finishSse();
            return;
        }
    }
    
    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const generatedTitle = title || (prompt && prompt.substring(0, 30)) || 'New Chat';
        const session = await prisma.aiChatSession.create({
            data: { userId, title: generatedTitle, topic }
        });
        currentSessionId = session.id;
    }
    
    if (prompt) {
        await prisma.aiChatMessage.create({
            data: { sessionId: currentSessionId, role: 'user', content: prompt, attachmentFileId }
        });
    }

    const historyMessages = await prisma.aiChatMessage.findMany({
        where: { sessionId: currentSessionId },
        orderBy: { createdAt: 'asc' }
    });
    
    if (membership.plan === "free") {
        await prisma.membership.update({
            where: { userId },
            data: { trialRemaining: Math.max(0, membership.trialRemaining - 1) }
        });
    }

    if (!llmConfig.configured) {
        sendSse({ text: "AI provider is not configured. This is a demo response.", code: "AI_PROVIDER_NOT_CONFIGURED" });
        finishSse();
        return;
    }

    sendSse({ type: 'ack' });
    sendSse({ sessionId: currentSessionId });

    const oaiMessages = [];
    if (systemInstruction) {
      oaiMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const msg of historyMessages) {
       const role = msg.role === "model" ? "assistant" : msg.role;
       oaiMessages.push({ role, content: msg.content });
    }

    let fullResponse = "";
    if (llmConfig.provider === 'openai-compatible' || llmConfig.provider === 'gemini') {
      try {
        const requestBody = {
          model: llmConfig.model,
          messages: oaiMessages,
          stream: true,
          temperature: 0.3
        };

        const response = await fetch(`${llmConfig.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmConfig.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
           const errText = await response.text();
           throw new Error(errText || response.statusText);
        }

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";

          while(true) {
             const { value, done } = await reader.read();
             if (done) break;
             buffer += decoder.decode(value, { stream: true });
             const lines = buffer.split('\n');
             buffer = lines.pop() || "";
             for (const line of lines) {
                if (line.startsWith('data: ')) {
                   const dataStr = line.slice(6).trim();
                   if (dataStr === '[DONE]') continue;
                   try {
                     const data = JSON.parse(dataStr);
                     const content = data.choices?.[0]?.delta?.content;
                     if (content) {
                       fullResponse += content;
                       sendSse({ text: content });
                     }
                   } catch {
                     // ignore malformed parse
                   }
                }
             }
          }
        }
      } catch (err: any) {
        console.error("LLM Provider Error:", err);
        sendSse({ error: err.message || "Failed to generate AI response", code: "AI_PROVIDER_ERROR" });
        finishSse();
        return;
      }
    }

    if (fullResponse) {
       await prisma.aiChatMessage.create({
           data: { sessionId: currentSessionId, role: 'model', content: fullResponse }
       });
       
       await prisma.aiChatSession.update({
           where: { id: currentSessionId },
           data: { updatedAt: new Date() }
       });
       
       await prisma.usageRecord.create({
           data: { userId, featureType: "ai_chat", fileId: attachmentFileId }
       });
    }

    finishSse();
  } catch (error: any) {
    console.error("Database connection failed:", error);
    sendSse({ error: "Database connection failed", code: "DATABASE_CONNECTION_FAILED" });
    finishSse();
  }
}
