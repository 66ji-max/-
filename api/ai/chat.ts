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

  sendSse({ type: 'ack' });
  sendSse({ type: 'status', code: 'DB_CHECKING' });

  const { prisma, error: prismaError } = await loadPrisma();
  
  let dbAvailable = false;
  if (prisma) {
      try {
          await Promise.race([
              prisma.$queryRaw`SELECT 1`,
              new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3000))
          ]);
          dbAvailable = true;
          sendSse({ type: 'status', code: 'DATABASE_AVAILABLE', message: 'Chat history enabled.' });
      } catch (error) {
          console.error('AI chat database unavailable, continuing without history:', error);
          dbAvailable = false;
          sendSse({ type: 'warning', code: 'DATABASE_UNAVAILABLE_HISTORY_DISABLED', message: 'Chat history is disabled because database is unavailable.' });
      }
  }

  const { prompt, systemInstruction, attachmentFileId, sessionId, title, topic } = req.body;

  try {
    let membership: any = null;
    let plan = 'free';
    let limits: typeof PLAN_LIMITS[keyof typeof PLAN_LIMITS] = PLAN_LIMITS['free'];

    if (dbAvailable && prisma) {
      try {
        membership = await prisma.membership.findUnique({ where: { userId } });
      } catch (error) {
        console.error('Failed to find membership, using fallback:', error);
      }
    }

    if (dbAvailable && membership) {
      if (membership.status !== 'active' && membership.status !== 'trial') {
        sendSse({ error: "Membership inactive or expired", code: "MEMBERSHIP_INACTIVE" });
        finishSse();
        return;
      }
      plan = membership.plan || 'free';
      limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS['free'];
    } else {
      // Fallback
      membership = {
        plan: 'free',
        status: 'trial',
        trialRemaining: 10
      };
    }
    
    if (attachmentFileId && !dbAvailable) {
      sendSse({ error: "File analysis requires database connection. Please try again later.", code: "DATABASE_REQUIRED_FOR_FILE" });
      finishSse();
      return;
    }

    if (attachmentFileId && !limits.allowAttachment) {
      sendSse({ error: "File analysis requires Startup or Pro plan", code: "ATTACHMENT_REQUIRES_STARTUP" });
      finishSse();
      return;
    }
    
    const isEci = topic === 'ECI' || (systemInstruction && systemInstruction.includes('Employee Striver Index')) || (systemInstruction && systemInstruction.includes('ECI'));
    if (isEci && !dbAvailable) {
      sendSse({ error: "Unable to verify membership. Please try again later.", code: "MEMBERSHIP_CHECK_UNAVAILABLE" });
      finishSse();
      return;
    }
    if (isEci && !limits.allowEci) {
        sendSse({ error: "ECI analysis requires Pro", code: "ECI_REQUIRES_PRO" });
        finishSse();
        return;
    }
    
    if (dbAvailable && prisma && limits.dailyAiLimit !== null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        try {
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
        } catch (error) {
            console.error("Failed to check daily limit:", error);
        }
    }
    
    let currentSessionId = sessionId;
    if (dbAvailable && prisma) {
        const dbSavePromise = (async () => {
            let tempSessionId = currentSessionId;
            if (!tempSessionId) {
                try {
                    const generatedTitle = title || (prompt && prompt.substring(0, 30)) || 'New Chat';
                    const session = await prisma.aiChatSession.create({
                        data: { userId, title: generatedTitle, topic }
                    });
                    tempSessionId = session.id;
                    sendSse({ type: 'status', code: 'SESSION_CREATED', sessionId: tempSessionId });
                    sendSse({ sessionId: tempSessionId });
                } catch (error: any) {
                    console.error("Failed to create session:", error);
                    const code = error?.code === 'P2021' ? 'CHAT_TABLE_MISSING' : 'SESSION_SAVE_FAILED';
                    sendSse({ type: 'warning', code, message: 'Failed to create chat session.' });
                }
            }
            
            if (prompt && tempSessionId) {
                try {
                    await prisma.aiChatMessage.create({
                        data: { sessionId: tempSessionId, role: 'user', content: prompt, attachmentFileId }
                    });
                } catch (error: any) {
                    console.error("Failed to create user message log:", error);
                    const code = error?.code === 'P2021' ? 'CHAT_TABLE_MISSING' : 'USER_MESSAGE_SAVE_FAILED';
                    sendSse({ type: 'warning', code, message: 'Failed to save user message.' });
                }
            }
            return tempSessionId;
        })();
        
        try {
            const returnedSessionId = await Promise.race([
                dbSavePromise,
                new Promise<string | undefined>((resolve) => setTimeout(() => resolve(sessionId), 5000))
            ]);
            if (returnedSessionId) {
                currentSessionId = returnedSessionId;
            }
        } catch (error) {
            console.error("DB Save timed out:", error);
        }
    }

    let historyMessages: any[] = [];
    if (dbAvailable && prisma && currentSessionId) {
        try {
            historyMessages = await prisma.aiChatMessage.findMany({
                where: { sessionId: currentSessionId },
                orderBy: { createdAt: 'asc' }
            });
        } catch (error) {
            console.error("Failed to load history messages:", error);
        }
    }
    
    if (dbAvailable && prisma && membership.plan === "free" && membership.trialRemaining !== undefined) {
        try {
            await prisma.membership.update({
                where: { userId },
                data: { trialRemaining: Math.max(0, membership.trialRemaining - 1) }
            });
        } catch (error) {
           console.error("Failed to update membership trial:", error);
        }
    }

    const llmConfig = getLLMConfigLocal();

    if (!llmConfig.configured) {
        sendSse({ text: "AI provider is not configured. This is a demo response.", code: "AI_PROVIDER_NOT_CONFIGURED" });
        finishSse();
        return;
    }

    sendSse({ type: 'ack' });
    if (!dbAvailable) {
        sendSse({ type: 'warning', code: 'DATABASE_UNAVAILABLE_HISTORY_DISABLED', message: 'Chat history is disabled because database is unavailable.' });
    } else {
        sendSse({ type: 'status', code: 'DATABASE_AVAILABLE', message: 'Chat history enabled.' });
    }

    if (currentSessionId) {
        sendSse({ sessionId: currentSessionId });
    }

    const oaiMessages = [];
    if (systemInstruction) {
      oaiMessages.push({ role: 'system', content: systemInstruction });
    }

    if (historyMessages.length > 0) {
        for (const msg of historyMessages) {
           const role = msg.role === "model" ? "assistant" : msg.role;
           oaiMessages.push({ role, content: msg.content });
        }
    } else if (prompt) {
        oaiMessages.push({ role: 'user', content: prompt });
    }

    let fullResponse = "";
    if (llmConfig.provider === 'openai-compatible' || llmConfig.provider === 'gemini') {
      sendSse({ type: 'status', code: 'LLM_REQUEST_STARTED' });
      const modelsToTry = [llmConfig.model, ...llmConfig.fallbackModels].filter(Boolean);
      let success = false;
      let lastError: any = null;
      let firstTokenReceived = false;

      for (const currentModel of modelsToTry) {
          if (success) break;

          const requestBodyStream = {
              model: currentModel,
              messages: oaiMessages,
              stream: true,
              temperature: 0.3
          };

          try {
              const fetchPromise = fetch(`${llmConfig.baseUrl.replace(/\/$/, '')}/chat/completions`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${llmConfig.apiKey}`
                  },
                  body: JSON.stringify(requestBodyStream)
              });

              const response = await fetchPromise;

              if (!response.ok) {
                  const errText = await response.text();
                  throw new Error(errText || response.statusText);
              }

              if (response.body) {
                  const reader = response.body.getReader();
                  const decoder = new TextDecoder("utf-8");
                  let buffer = "";

                  let streamActive = true;
                  const readerPromise = (async () => {
                      while(streamActive) {
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
                                          if (!firstTokenReceived) {
                                              firstTokenReceived = true;
                                              sendSse({ type: 'status', code: 'LLM_FIRST_TOKEN_RECEIVED' });
                                          }
                                          fullResponse += content;
                                          sendSse({ text: content });
                                      }
                                  } catch {
                                      // ignore malformed parse
                                  }
                              }
                          }
                      }
                  })();

                  await Promise.race([
                      readerPromise,
                      new Promise((_, reject) => setTimeout(() => {
                          if (!firstTokenReceived) {
                              streamActive = false;
                              reader.cancel();
                              reject(new Error("Stream first token timeout"));
                          }
                      }, 20000))
                  ]);
                  await readerPromise; // Make sure it finishes if valid

                  if (fullResponse) {
                      success = true;
                  } else {
                      throw new Error("Empty response");
                  }
              }
          } catch (err: any) {
              console.warn(`Stream failed for ${currentModel}, falling back to non-stream...`, err.message);
              try {
                  const requestBodyNonStream = {
                      model: currentModel,
                      messages: oaiMessages,
                      stream: false,
                      temperature: 0.3
                  };

                  const response = await fetch(`${llmConfig.baseUrl.replace(/\/$/, '')}/chat/completions`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${llmConfig.apiKey}`
                      },
                      body: JSON.stringify(requestBodyNonStream)
                  });

                  if (!response.ok) {
                      const errText = await response.text();
                      throw new Error(errText || response.statusText);
                  }

                  const data = await response.json();
                  const content = data.choices?.[0]?.message?.content;
                  if (content) {
                      if (!firstTokenReceived) {
                          firstTokenReceived = true;
                          sendSse({ type: 'status', code: 'LLM_FIRST_TOKEN_RECEIVED' });
                      }
                      fullResponse += content;
                      sendSse({ text: content });
                      success = true;
                  } else {
                      throw new Error("Empty non-stream response");
                  }
              } catch (e2: any) {
                  console.warn(`Non-stream failed for ${currentModel}`, e2.message);
                  lastError = e2;
              }
          }
      }

      if (!success) {
          console.error("LLM Provider Error (all fallbacks exhausted):", lastError);
          sendSse({ error: "Failed to generate AI response", code: "AI_PROVIDER_ERROR" });
          finishSse();
          return;
      }
    }

    if (dbAvailable && prisma && fullResponse && currentSessionId) {
        try {
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
        } catch (error: any) {
           console.error("Failed to save AI reply or usage:", error);
           const code = error?.code === 'P2021' ? 'CHAT_TABLE_MISSING' : 'AI_MESSAGE_SAVE_FAILED';
           sendSse({ type: 'warning', code, message: 'Failed to save AI message.' });
        }
    }

    finishSse();
  } catch (error: any) {
    console.error("Unexpected Internal Error:", error);
    sendSse({ error: "Internal Error", code: "INTERNAL_ERROR" });
    finishSse();
  }
}
