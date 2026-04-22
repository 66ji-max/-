export const streamBackendChat = async (
  prompt: string, 
  onChunk: (text: string) => void,
  systemInstruction?: string,
  attachedFile?: File,
  token?: string | null
): Promise<string> => {
  try {
    let attachmentFileId = null;

    if (attachedFile && token) {
        // Upload immediately before query
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
            reader.readAsDataURL(attachedFile);
        });
        const base64Buffer = await base64Promise;
        const upRes = await fetch('/api/files/upload', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                filename: attachedFile.name,
                contentType: attachedFile.type,
                size: attachedFile.size,
                base64Buffer
            })
        });
        if (!upRes.ok) throw new Error((await upRes.json()).error || "Failed to upload");
        attachmentFileId = (await upRes.json()).file.id;
    }

    const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt, systemInstruction, attachmentFileId })
    });

    if (!res.ok) throw new Error((await res.json()).error || "Failed");

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.text) {
                        fullText += parsed.text;
                        onChunk(parsed.text);
                    } else if (parsed.error) throw new Error(parsed.error);
                } catch (e) {} 
            }
        }
    }
    return fullText;
  } catch (error: any) {
    onChunk(`\n[System Error] ${error.message}`);
    return error.message;
  }
};
