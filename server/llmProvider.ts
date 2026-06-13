export const getLLMConfig = () => {
  const apiKey =
    process.env.SAILGUARD_LLM_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.AUDITEYE_LLM_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.API_KEY ||
    '';

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

  let provider: 'openai-compatible' | 'gemini' | 'mock' = 'mock';

  if (
    process.env.SAILGUARD_LLM_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.AUDITEYE_LLM_API_KEY
  ) {
    provider = 'openai-compatible';
  } else if (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.API_KEY
  ) {
    provider = 'gemini';
  }

  return {
    provider,
    configured: Boolean(apiKey),
    baseUrlConfigured: Boolean(baseUrl),
    baseUrl,
    model,
    fallbackModels,
  };
};

export const checkStatus = async () => {
  const config = getLLMConfig();

  if (!config.configured) {
    return { status: 'not_configured' as const };
  }

  return { status: 'ok' as const };
};

export async function streamText(params: {
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  systemInstruction?: string;
  onToken?: (token: string) => void;
}) {
  const config = getLLMConfig();

  if (!config.configured) {
    const text = 'AI provider is not configured. This is a demo response.';
    params.onToken?.(text);
    return text;
  }

  const text = 'AI provider is configured, but streamText implementation should call the configured provider here.';
  params.onToken?.(text);
  return text;
}
