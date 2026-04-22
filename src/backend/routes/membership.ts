import { Router, Response } from "express";
import prisma from "../prisma.js";
import { authenticate, AuthRequest } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const membership = await prisma.membership.findUnique({
      where: { userId: req.user!.id }
    });
    if (!membership) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }
    res.json({ membership });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
