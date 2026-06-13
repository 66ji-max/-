import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLLMConfig, checkStatus } from './utils/llmProvider.js';
import prisma from './utils/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const config = getLLMConfig();
    const aiStatus = await checkStatus();

    let databaseConfigured = false;
    try {
        await prisma.$queryRaw`SELECT 1`;
        databaseConfigured = true;
    } catch {
        databaseConfigured = false;
    }

    const blobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

    res.status(200).json({
        status: "ok",
        ai: {
            provider: config.provider,
            configured: config.configured,
            baseUrlConfigured: config.baseUrlConfigured,
            model: config.model,
            fallbackModels: config.fallbackModels,
            status: aiStatus.status
        },
        databaseConfigured,
        blobConfigured
    });
}
