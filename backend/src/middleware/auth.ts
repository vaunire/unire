import type { Request, Response, NextFunction } from "express";
import { getAuth, requireAuth } from "@clerk/express";
import { db } from "../config/database";

export type AuthRequest = Request & { userId?: string };

export const ProtectRoute = [
  requireAuth(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: clerkId } = getAuth(req);
      if (!clerkId) {
        return res
          .status(401)
          .json({ message: "💥 Ошибка авторизации: отсутствует Clerk ID" });
      }
      const user = await db.user.findUnique({ where: { clerkId: clerkId } });

      if (!user) {
        return res.status(404).json({ message: "⚠️ Пользователь не найден" });
      }
      req.userId = user.id;
      next();
    } catch (error) {
      console.error("💥 Ошибка в ProtectRoute", error);
      res.status(500).json({ message: "[500] Упс! Что-то пошло не так." });
    }
  },
];
