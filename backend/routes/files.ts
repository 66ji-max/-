import { Router, Response } from "express";
import multer from "multer";
import prisma from "../prisma.js";
import { authenticate, AuthRequest } from "../middlewares/authMiddleware.js";

const router = Router();

// Store files in memory to save them as binary array to DB
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post("/upload", authenticate, upload.single("file"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const file = await prisma.uploadedFile.create({
      data: {
        userId: req.user!.id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        binaryData: req.file.buffer, // Save bytes to DB
      }
    });

    res.json({ 
        message: "File uploaded successfully", 
        file: {
            id: file.id,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            createdAt: file.createdAt
        } 
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = await prisma.uploadedFile.findMany({
      where: { userId: req.user!.id },
      select: {
          id: true,
          originalName: true,
          mimeType: true,
          size: true,
          createdAt: true
          // explicitly omitting binaryData so we don't send large buffers back in listing
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve files" });
  }
});

router.delete("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const file = await prisma.uploadedFile.findUnique({ where: { id } });
    
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    if (file.userId !== req.user!.id) {
      res.status(403).json({ error: "Unauthorized to delete this file" });
      return;
    }

    await prisma.uploadedFile.delete({ where: { id } });
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
