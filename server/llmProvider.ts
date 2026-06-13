type ProviderType = 'openai-compatible' | 'gemini' | 'mock';

type LLMConfig = {
  provider: ProviderType;
  configured: boolean;
  baseUrlConfigured: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  fallbackModels: string[];
};

type StreamTextParams = {
  messages?: any[];
  prompt?: string;
  systemInstruction?: string;
};

type StreamChunk = {
  text: string;
};

export const getLLMConfig = (): LLMConfig => {
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
    .map((item) => item.trim())
    .filter(Boolean);

  let provider: ProviderType = 'mock';

  if (openAiCompatibleKey) {
    provider = 'openai-compatible';
  } else if (geminiKey) {
    provider = 'gemini';
  }

  return {
    provider,
    configured: Boolean(apiKey),
    baseUrlConfigured: Boolean(baseUrl),
    apiKey,
    baseUrl,
    model,
    fallbackModels,
  };
};

export const checkStatus = async (): Promise<{ status: 'ok' | 'not_configured' | 'error' }> => {
  try {
    const config = getLLMConfig();

    if (!config.configured) {
      return { status: 'not_configured' };
    }

    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
};

const normalizeMessageContent = (message: any): string => {
  if (!message) return '';

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (typeof message.text === 'string') {
    return message.text;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part: any) => {
        if (typeof part?.text === 'string') return part.text;
        if (part?.inlineData) return '[Attached file]';
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const normalizeOpenAIMessages = (
  messages: any[] = [],
  systemInstruction?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  const result: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemInstruction) {
    result.push({
      role: 'system',
      content: systemInstruction,
    });
  }

  for (const message of messages) {
    const role =
      message.role === 'model' || message.role === 'assistant'
        ? 'assistant'
        : 'user';

    const content = normalizeMessageContent(message);

    if (content) {
      result.push({
        role,
        content,
      });
    }
  }

  if (result.length === 0) {
    result.push({
      role: 'user',
      content: 'Hello',
    });
  }

  return result;
};

async function* streamOpenAICompatible(
  params: StreamTextParams,
  config: LLMConfig
): AsyncGenerator<StreamChunk> {
  const modelCandidates = [config.model, ...config.fallbackModels].filter(Boolean);
  const messages = normalizeOpenAIMessages(params.messages, params.systemInstruction);

  let lastError = '';

  for (const model of modelCandidates) {
    try {
      const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        lastError = `Provider returned ${response.status}`;
        continue;
      }

      if (!response.body) {
        const data = await response.json().catch(() => null);
        const text =
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.text ||
          '';

        if (text) {
          yield { text };
        }

        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const payload = trimmed.replace(/^data:\s*/, '');

          if (payload === '[DONE]') {
            return;
          }

          try {
            const json = JSON.parse(payload);
            const text =
              json?.choices?.[0]?.delta?.content ||
              json?.choices?.[0]?.message?.content ||
              json?.choices?.[0]?.text ||
              '';

            if (text) {
              yield { text };
            }
          } catch {
            continue;
          }
        }
      }

      return;
    } catch (error: any) {
      lastError = error?.message || 'Provider request failed';
      continue;
    }
  }

  throw new Error(lastError || 'All LLM models failed');
}

async function* streamGemini(
  params: StreamTextParams,
  config: LLMConfig
): AsyncGenerator<StreamChunk> {
  try {
    const { GoogleGenAI } = await import('@google/genai');

    const genAI = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    const contents =
      params.messages && params.messages.length > 0
        ? params.messages.map((message: any) => {
            if (Array.isArray(message.parts)) {
              return {
                role: message.role === 'assistant' ? 'model' : message.role,
                parts: message.parts,
              };
            }

            return {
              role:
                message.role === 'assistant' || message.role === 'model'
                  ? 'model'
                  : 'user',
              parts: [{ text: normalizeMessageContent(message) }],
            };
          })
        : [
            {
              role: 'user',
              parts: [{ text: params.prompt || 'Hello' }],
            },
          ];

    const responseStream = await genAI.models.generateContentStream({
      model: config.model,
      contents,
      config: {
        systemInstruction: params.systemInstruction || 'Keep it concise.',
      },
    });

    for await (const chunk of responseStream as any) {
      const text = typeof chunk?.text === 'string' ? chunk.text : '';
      if (text) {
        yield { text };
      }
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini provider failed');
  }
}

export async function* streamText(
  params: StreamTextParams
): AsyncGenerator<StreamChunk> {
  const config = getLLMConfig();

  if (!config.configured || config.provider === 'mock') {
    yield {
      text: 'AI provider is not configured. This is a demo response.',
    };
    return;
  }

  if (config.provider === 'openai-compatible') {
    yield* streamOpenAICompatible(params, config);
    return;
  }

  if (config.provider === 'gemini') {
    yield* streamGemini(params, config);
    return;
  }

  yield {
    text: 'AI provider is not configured. This is a demo response.',
  };
}
