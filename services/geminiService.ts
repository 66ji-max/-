export interface FileData {
  mimeType: string;
  data: string;
  file?: File;
}

export const streamBackendChat = async (
  prompt: string, 
  onChunk: (text: string) => void,
  systemInstruction?: string,
  attachedFile?: File
): Promise<string> => {
  try {
    let attachmentFileId = null;

    // 1. Upload file if it exists
    if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        const upRes = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });
        if (!upRes.ok) {
            const err = await upRes.json();
            throw new Error(err.error || "Failed to upload file");
        }
        const upData = await upRes.json();
        attachmentFileId = upData.file.id;
    }

    // 2. Start Chat
    const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            systemInstruction,
            attachmentFileId
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate chat");
    }

    // Read SSE stream
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        // chunk can be multiple SSE messages like: data: {"text":"hello"}\n\ndata: {"text":"world"}\n\n
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.text) {
                        fullText += parsed.text;
                        onChunk(parsed.text);
                    } else if (parsed.error) {
                        throw new Error(parsed.error);
                    }
                } catch (e) {
                    // Ignore parse errors for incomplete chunks, though properly framed SSE should be fine
                }
            }
        }
    }
    
    return fullText;

  } catch (error: any) {
    console.error("Backend Chat Error:", error);
    const errorMsg = `[System Error] ${error.message || 'Connection interrupted'}`;
    onChunk('\n' + errorMsg);
    return errorMsg;
  }
};