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

  const isClearlyOutOfScope = (text: string) => {
    if (!text) return false;
    const normalized = text.toLowerCase();
    
    const allowedKeywords = [
        'sailguard', '鹭起南洋', 'ai saas', 'compliance', '合规',
        'cross-border', '跨境', 'e-commerce', '电商',
        'trademark', '商标', 'patent', '专利', 'copyright', '版权',
        'infringement', '侵权', 'policy', '政策', 'logistics', '物流',
        'shopping assistant', '购物助手', 'eci', 'employee', '人才',
        'membership', '会员', 'startup', 'pro', 'free',
        'payment', '支付', 'order', '订单', 'report', '报告',
        'file', '文件', 'upload', '上传', 'risk', '风险',
        'amazon', 'shopee', 'lazada', 'tiktok', 'temu'
    ];
    
    const safeSmallTalk = [
        '你好', '您好', 'hello', 'hi', 'hey',
        '你是谁', 'who are you', 'help', '帮助', '怎么用', '功能'
    ];
    
    if (safeSmallTalk.some(k => normalized === k || normalized.startsWith(k) && normalized.length < k.length + 5)) {
        return 'SMALLTALK';
    }
    return !allowedKeywords.some(k => normalized.includes(k)) ? 'OUT_OF_SCOPE' : 'OK';
  };
  
  const scopeResult = prompt ? isClearlyOutOfScope(prompt) : 'OK';

  const projectSystemPrompt = `You are SailGuard AI, an AI compliance assistant for the SailGuard AI / 鹭起南洋 website.
You must only answer questions related to this project and its services:
- cross-border e-commerce compliance
- trademark, patent, copyright, brand infringement, product listing risk
- policy monitoring and regulatory updates
- smart logistics and e-commerce shopping assistant
- ECI talent index / employee analysis
- AI SaaS functions on this website
- file analysis and compliance reports
- membership plans, payments, orders, account usage, website support
- company information shown on this website

If the user asks an unrelated question, politely refuse and redirect them to ask about SailGuard AI services.
Do not answer general trivia, entertainment, homework, coding unrelated to this project, personal advice, medical/legal/financial advice outside platform compliance context, or random roleplay.
Keep answers concise, practical, and business-oriented.
If the user asks “你是谁 / are you Gemini / what model are you”, answer:
“I am SailGuard AI’s compliance assistant. The underlying model provider may vary by deployment, but I am configured to help with SailGuard AI project-related compliance and e-commerce questions.”`;

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
                    const generatedTitle = title && title !== 'AI Chat'
                        ? title
                        : prompt
                        ? prompt.replace(/\r?\n|\r/g, " ").trim().substring(0, 30)
                        : 'New Chat';
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

    if (scopeResult === 'OUT_OF_SCOPE') {
        sendSse({ type: 'warning', code: 'OUT_OF_SCOPE', message: 'Out of scope question detected. Falling back.' });
        const outOfScopeDesc = '抱歉，我只能回答与 SailGuard AI 项目、跨境电商合规、AI SaaS 功能、会员订单和相关业务有关的问题。您可以问我商标侵权、政策风险、物流优化、购物助手或平台使用问题。';
        
        if (dbAvailable && prisma && currentSessionId) {
             try {
                await prisma.aiChatMessage.create({
                    data: { sessionId: currentSessionId, role: 'model', content: outOfScopeDesc }
                });
             } catch (err) {
                console.error('Failed to log out of scope bot reply', err);
             }
        }
        sendSse({ text: outOfScopeDesc, code: 'OUT_OF_SCOPE' });
        finishSse();
        return;
    }
    
    if (scopeResult === 'SMALLTALK') {
        sendSse({ type: 'status', code: 'SMALLTALK', message: 'Greeting detected. Falling back.' });
        const greetingDesc = '你好，我是 SailGuard AI 合规助手，可以帮助您分析跨境电商合规、商标侵权、政策风险、物流优化、购物助手、会员订单和平台使用问题。';
        
        if (dbAvailable && prisma && currentSessionId) {
             try {
                await prisma.aiChatMessage.create({
                    data: { sessionId: currentSessionId, role: 'model', content: greetingDesc }
                });
             } catch (err) {
                console.error('Failed to log smalltalk bot reply', err);
             }
        }
        sendSse({ text: greetingDesc, code: 'SMALLTALK' });
        finishSse();
        return;
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
    oaiMessages.push({ role: 'system', content: projectSystemPrompt });
    
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
    
    let keepAliveInterval: any;
    let elapsedSeconds = 0;
    
    if (llmConfig.provider === 'openai-compatible' || llmConfig.provider === 'gemini') {
      sendSse({ type: 'status', code: 'LLM_REQUEST_STARTED' });
      
      keepAliveInterval = setInterval(() => {
          elapsedSeconds += 5;
          sendSse({ type: 'status', code: 'THINKING', elapsed: elapsedSeconds });
      }, 5000);
      
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
                                              clearInterval(keepAliveInterval);
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
                          clearInterval(keepAliveInterval);
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
          if (keepAliveInterval) clearInterval(keepAliveInterval);
          console.error("LLM Provider Error (all fallbacks exhausted):", lastError);
          sendSse({ error: "Failed to generate AI response", code: "AI_PROVIDER_ERROR" });
          finishSse();
          return;
      }
    }

    if (keepAliveInterval) clearInterval(keepAliveInterval);

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
    if (typeof keepAliveInterval !== 'undefined') clearInterval(keepAliveInterval);
    console.error("Unexpected Internal Error:", error);
    sendSse({ error: "Internal Error", code: "INTERNAL_ERROR" });
    finishSse();
  }
}
