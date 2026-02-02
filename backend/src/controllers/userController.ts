import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { db } from "../config/database";
import { AppError } from "../middleware/appError";

// Получает список пользователей
export async function getUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new AppError("⚠️ Пользователь не авторизован", 401);
    }

    const users = await db.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: 50,
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
}
