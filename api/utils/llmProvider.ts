import { GoogleGenAI } from '@google/genai';

export interface LLMConfig {
    provider: 'openai-compatible' | 'gemini' | 'mock';
    configured: boolean;
    baseUrlConfigured: boolean;
    model: string;
    fallbackModels: string[];
}

export function getLLMConfig(): LLMConfig {
    const openaiKey = process.env.SAILGUARD_LLM_API_KEY || process.env.LLM_API_KEY || process.env.AUDITEYE_LLM_API_KEY;
    const baseUrl = process.env.SAILGUARD_LLM_BASE_URL || process.env.LLM_BASE_URL || process.env.AUDITEYE_LLM_BASE_URL || 'https://max.openai365.top/v1';
    
    let model = process.env.SAILGUARD_LLM_MODEL || process.env.LLM_MODEL || process.env.AUDITEYE_PRIMARY_MODEL || 'gemini-3.1-pro-preview';
    let fallbackStr = process.env.SAILGUARD_LLM_FALLBACK_MODELS || process.env.LLM_FALLBACK_MODELS || process.env.LLM_FALLBACK_MODEL || process.env.AUDITEYE_FALLBACK_MODELS || 'gemini-3-flash-preview';
    let fallbackModels = fallbackStr.split(',').map(s => s.trim()).filter(Boolean);

    if (openaiKey) {
        return {
            provider: 'openai-compatible',
            configured: true,
            baseUrlConfigured: !!baseUrl,
            model,
            fallbackModels
        };
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.API_KEY;
    if (geminiKey) {
        return {
            provider: 'gemini',
            configured: true,
            baseUrlConfigured: false,
            model: 'gemini-2.5-flash',
            fallbackModels: []
        };
    }

    return {
        provider: 'mock',
        configured: false,
        baseUrlConfigured: false,
        model: 'mock-model',
        fallbackModels: []
    };
}

export async function checkStatus(): Promise<{ status: string, error?: string }> {
    const config = getLLMConfig();
    if (!config.configured) {
        return { status: 'mock' };
    }

    try {
        if (config.provider === 'openai-compatible') {
            const openaiKey = process.env.SAILGUARD_LLM_API_KEY || process.env.LLM_API_KEY || process.env.AUDITEYE_LLM_API_KEY;
            const baseUrl = process.env.SAILGUARD_LLM_BASE_URL || process.env.LLM_BASE_URL || process.env.AUDITEYE_LLM_BASE_URL || 'https://max.openai365.top/v1';
            const res = await fetch(`${baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${openaiKey}`
                }
            });
            if (res.ok) {
                return { status: 'ok' };
            }
            return { status: 'error', error: await res.text() };
        } else if (config.provider === 'gemini') {
            // Simplified check for Gemini, usually if key is present it's ok, but we could try a small request.
            return { status: 'ok' };
        }
    } catch (e: any) {
        return { status: 'error', error: e.message };
    }
    return { status: 'unknown' };
}

export async function* streamText(params: { messages: any[], systemInstruction?: string, temperature?: number }) {
    const config = getLLMConfig();

    if (config.provider === 'mock') {
        yield { text: "AI provider is not configured. This is a demo response." };
        return;
    }

    if (config.provider === 'openai-compatible') {
        const openaiKey = process.env.SAILGUARD_LLM_API_KEY || process.env.LLM_API_KEY || process.env.AUDITEYE_LLM_API_KEY;
        const baseUrl = process.env.SAILGUARD_LLM_BASE_URL || process.env.LLM_BASE_URL || process.env.AUDITEYE_LLM_BASE_URL || 'https://max.openai365.top/v1';
        
        let oaiMessages = params.messages.map(m => {
            if (m.role === 'model') return { role: 'assistant', content: m.content || m.parts?.[0]?.text };
            if (m.role === 'user') {
                if (m.parts) {
                   // Handle mix of text and image/inlineData if needed in the future
                   // Currently our parts array has {text} or {inlineData}
                   let content: any[] = [];
                   for (const part of m.parts) {
                       if (part.text) content.push({ type: 'text', text: part.text });
                       if (part.inlineData) {
                           content.push({ type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } });
                       }
                   }
                   if (content.length === 1 && content[0].type === 'text') {
                       return { role: 'user', content: content[0].text };
                   }
                   return { role: 'user', content };
                }
                return { role: 'user', content: m.content || '' };
            }
            if (m.role === 'system') return { role: 'system', content: m.content || m.parts?.[0]?.text };
            return m;
        });

        if (params.systemInstruction) {
            oaiMessages.unshift({ role: 'system', content: params.systemInstruction });
        }

        let modelsToTry = [config.model, ...config.fallbackModels];
        let lastError = null;

        for (const model of modelsToTry) {
            try {
                const res = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: oaiMessages,
                        temperature: params.temperature ?? 0.7,
                        stream: true
                    })
                });

                if (!res.ok) {
                    const errText = await res.text();
                    lastError = new Error(`OpenAI API Error: ${res.status} ${errText}`);
                    continue; // try next model
                }

                if (!res.body) {
                    lastError = new Error("No response body");
                    continue;
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let done = false;

                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
                        for (const line of lines) {
                            const data = line.replace(/^data: /, '').trim();
                            if (data === '[DONE]') {
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.choices?.[0]?.delta?.content) {
                                    yield { text: parsed.choices[0].delta.content };
                                }
                            } catch (e) {
                                // ignore parse errors on incomplete chunks
                            }
                        }
                    }
                }
                return; // Succesfully streamed
            } catch (e) {
                lastError = e;
                // try next model
            }
        }
        
        throw lastError || new Error("All models failed");
    }

    if (config.provider === 'gemini') {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.API_KEY || '';
        const genAI = new GoogleGenAI({ apiKey: geminiKey });
        
        const contents = params.messages.map(m => {
            if (m.parts) return { role: m.role === 'model' ? 'model' : 'user', parts: m.parts };
            return { role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] };
        });

        const responseStream = await genAI.models.generateContentStream({
            model: config.model,
            contents,
            config: { systemInstruction: params.systemInstruction, temperature: params.temperature }
        });

        for await (const chunk of responseStream) {
            if (chunk.text) {
                yield { text: chunk.text };
            }
        }
    }
}
