import type { Request, Response, NextFunction } from "express";
import { getAuth, requireAuth } from "@clerk/express";
import { db } from "../config/database";
import { AppError } from "./appError";

export type AuthRequest = Request & { userId?: string };

export const ProtectRoute = [
  requireAuth(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: clerkId } = getAuth(req);
      if (!clerkId) {
        throw new AppError("💥 Ошибка авторизации: отсутствует Clerk ID", 401);
      }
      const user = await db.user.findUnique({ where: { clerkId } });

      if (!user) {
        throw new AppError("⚠️ Пользователь не найден", 404);
      }
      req.userId = user.id;
      next();
    } catch (error) {
      next(error);
    }
  },
];
