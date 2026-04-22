import { Router, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import prisma from "../prisma.js";
import { authenticate, AuthRequest } from "../middlewares/authMiddleware.js";

const router = Router();
const apiKey = process.env.GEMINI_API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

router.post("/chat", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { prompt, systemInstruction, attachmentFileId } = req.body;
  const userId = req.user!.id;

  try {
    // 1. Check membership and quota
    const membership = await prisma.membership.findUnique({ where: { userId } });
    if (!membership) {
        res.status(403).json({ error: "Membership not found." });
        return;
    }

    if (membership.plan === "free" && membership.trialRemaining <= 0) {
        res.status(403).json({ error: "Trial limit reached. Please upgrade your plan." });
        return;
    }

    // 2. Prepare payload
    const parts: any[] = [];
    
    // Check if there is an attachment file in DB
    if (attachmentFileId) {
        const fileRecord = await prisma.uploadedFile.findUnique({
             where: { id: attachmentFileId }
        });
        if (!fileRecord || fileRecord.userId !== userId) {
            res.status(404).json({ error: "Attached file not found or unauthorized" });
            return;
        }

        // Convert the binary ArrayBuffer/Buffer to base64 for Gemini API
        const base64Data = Buffer.from(fileRecord.binaryData).toString("base64");
        parts.push({
            inlineData: {
                mimeType: fileRecord.mimeType,
                data: base64Data
            }
        });
    }

    parts.push({ text: prompt || "Hello" });

    // 3. Initiate AI stream
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents: [{ role: 'user', parts }],
        config: {
            systemInstruction: systemInstruction || "You are 'xLab AI'. Keep answers concise.",
        }
    });

    // Deduct quota if free plan
    if (membership.plan === "free") {
        await prisma.membership.update({
            where: { userId },
            data: { trialRemaining: membership.trialRemaining - 1 }
        });
    }

    // Record usage
    await prisma.usageRecord.create({
        data: {
            userId,
            featureType: "chat",
            fileId: attachmentFileId || null
        }
    });

    // 4. Stream back to client
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
            // Write to SSE
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error) {
    console.error("AI API Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Interrupted" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Interrupted" })}\n\n`);
      res.end();
    }
  }
});

// Endpoint to just check usage stats
router.get("/usage/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const usages = await prisma.usageRecord.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ usages });
    } catch(err) {
        res.status(500).json({ error: "Failed to fetch usage" });
    }
});

export default router;
