export const streamBackendChat = async (
  prompt: string, 
  onChunk: (text: string) => void,
  systemInstruction?: string,
  attachedFile?: File,
  token?: string | null,
  sessionId?: string,
  onSessionCreated?: (sessionId: string) => void,
  title?: string,
  topic?: string,
  onStatus?: (status: any) => void,
  abortController?: AbortController
): Promise<string> => {
  try {
    let attachmentFileId = null;
    
    const controller = abortController || new AbortController();
    
    if (attachedFile && token) {
        // Upload immediately before query
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
            reader.readAsDataURL(attachedFile);
        });
        const base64Buffer = await base64Promise;
        const upRes = await fetch('/api/files?action=upload', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                filename: attachedFile.name,
                contentType: attachedFile.type,
                size: attachedFile.size,
                base64Buffer
            })
        });
        const upResData = await upRes.json();
        if (!upRes.ok) {
            const errObj = new Error(upResData.error || "Failed to upload");
            (errObj as any).code = upResData.code;
            throw errObj;
        }
        attachmentFileId = upResData.file?.id;
    }

    const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt, systemInstruction, attachmentFileId, sessionId, title, topic }),
        signal: controller.signal
    });

    if (!res.ok) {
        let responseData: any = {};
        const textData = await res.text();
        try {
            responseData = JSON.parse(textData);
        } catch (e) {
            console.error("Vercel or Network Error:", textData);
            responseData = { error: "AI service is temporarily unavailable. Please try again later.", code: "VERCEL_ERROR" };
        }
        const errObj = new Error(responseData.error || "Failed");
        (errObj as any).code = responseData.code;
        throw errObj;
    }

    const reader = res.body?.getReader();
    if (!reader) {
        throw new Error("No response body");
    }
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';
            
            for (const event of events) {
                const lines = event.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const rawData = line.slice(6).trim();
                        if (!rawData) continue;
                        if (rawData === '[DONE]') {
                            return fullText;
                        }
                        
                        try {
                            const parsed = JSON.parse(rawData);
                            if (parsed.type === 'ack') {
                                continue;
                            }
                            if (parsed.type === 'warning') {
                                console.warn("Backend warning:", parsed);
                                const warningAsTextCodes = [
                                  'PDF_PARSE_EMPTY',
                                  'PDF_PARSE_FAILED_WITH_GUIDANCE',
                                  'PDF_TOO_LARGE',
                                  'PROVIDER_PDF_UNSUPPORTED',
                                  'UNSUPPORTED_FILE_ANALYSIS_TYPE',
                                  'VISION_MODEL_UNSUPPORTED',
                                  'PDF_DIRECT_PROVIDER_FAILED'
                                ];
                                if (warningAsTextCodes.includes(parsed.code) && parsed.message) {
                                  fullText += parsed.message;
                                  onChunk(parsed.message);
                                }
                                continue;
                            }
                            if (parsed.type === 'status') {
                                if (onStatus) onStatus(parsed);
                                console.info("Backend status:", parsed);
                                continue;
                            }
                            if (parsed.sessionId && onSessionCreated) {
                                onSessionCreated(parsed.sessionId);
                            }
                            if (parsed.text) {
                                fullText += parsed.text;
                                onChunk(parsed.text);
                            } else if (parsed.error) {
                                if (parsed.code === 'OUT_OF_SCOPE') {
                                    fullText += parsed.error;
                                    onChunk(parsed.error);
                                } else {
                                    const err = new Error(parsed.error);
                                    (err as any).code = parsed.code;
                                    throw err;
                                }
                            }
                        } catch (e: any) {
                            if (e.code) throw e;
                            console.error("Failed to parse SSE event:", rawData, e);
                            if (rawData.includes("A server error") || rawData.includes("<!DOCTYPE html")) {
                                const errObj = new Error("AI service is temporarily unavailable. Please try again later.");
                                (errObj as any).code = "VERCEL_ERROR";
                                throw errObj;
                            }
                        }
                    }
                }
            }
        }
    } finally {
        // cleanup if needed
    }
    
    return fullText;
  } catch (error: any) {
    if (error.name === 'AbortError') {
        const errObj = new Error("Generation stopped.");
        (errObj as any).code = "ABORTED_BY_USER";
        throw errObj;
    }
    if (error.code) {
        throw error;
    }
    onChunk(`\n[System Error] ${error.message}`);
    throw error;
  }
};
