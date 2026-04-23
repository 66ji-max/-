import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import prisma from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const genAI = new GoogleGenAI({ apiKey });

export const config = { maxDuration: 60 }; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const userId = authenticate(req, res);
  if (!userId) return;

  const { prompt, systemInstruction, attachmentFileId, sessionId, title, topic } = req.body;

  try {
    const membership = await prisma.membership.findUnique({ where: { userId } });
    if (!membership || (membership.plan === "free" && membership.trialRemaining <= 0)) {
        res.status(403).json({ error: "Trial limit reached. Please upgrade your plan." });
        return;
    }
    
    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const generatedTitle = title || prompt.substring(0, 30) || 'New Chat';
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

    const parts: any[] = [];
    
    if (attachmentFileId) {
        const fileRecord = await prisma.uploadedFile.findUnique({ where: { id: attachmentFileId } });
        if (!fileRecord || fileRecord.userId !== userId) {
            res.status(404).json({ error: "Attached file unauthorized" });
            return;
        }

        const blobResp = await fetch(fileRecord.blobUrl);
        const arrayBuffer = await blobResp.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        parts.push({
            inlineData: { mimeType: fileRecord.mimeType, data: base64Data }
        });
    }

    parts.push({ text: prompt || "Hello" });
    
    const historyMessages = await prisma.aiChatMessage.findMany({
        where: { sessionId: currentSessionId },
        orderBy: { createdAt: 'asc' }
    });
    
    const contents: any[] = historyMessages.map(msg => ({
        role: msg.role,
        parts: msg.role === 'user' && msg.id === historyMessages[historyMessages.length - 1].id ? parts : [{ text: msg.content }]
    }));
    
    if (contents.length === 0) {
        contents.push({ role: 'user', parts });
    }

    const responseStream = await genAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction: systemInstruction || "Keep it concise." }
    });

    if (membership.plan === "free") {
        await prisma.membership.update({
            where: { userId },
            data: { trialRemaining: membership.trialRemaining - 1 }
        });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    res.write(`data: ${JSON.stringify({ sessionId: currentSessionId })}\n\n`);

    let fullResponse = "";
    for await (const chunk of responseStream) {
        if (chunk.text) {
           fullResponse += chunk.text;
           res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
    }
    
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

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("AI Error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`); 
    res.end();
  }
}
