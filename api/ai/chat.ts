import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import prisma from '../../api/utils/prisma';
import { authenticate } from '../../api/utils/auth';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const genAI = new GoogleGenAI({ apiKey });

export const config = { maxDuration: 60 }; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const userId = authenticate(req, res);
  if (!userId) return;

  const { prompt, systemInstruction, attachmentFileId } = req.body;

  try {
    const membership = await prisma.membership.findUnique({ where: { userId } });
    if (!membership || (membership.plan === "free" && membership.trialRemaining <= 0)) {
        res.status(403).json({ error: "Trial limit reached. Please upgrade your plan." });
        return;
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

    const responseStream = await genAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
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

    for await (const chunk of responseStream) {
        if (chunk.text) {
           res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
    }
    
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
