import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { db } from "../config/database";
import { getAuth, clerkClient } from "@clerk/express";
import { AppError } from "../middleware/appError";

// Получает профиль текущего авторизованного пользователя из БД
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await db.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      throw new AppError("⚠️ Пользователь не найден", 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
}

// Синхронизирует пользователя с БД при callback от Clerk
export async function authCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      throw new AppError("💥 Ошибка авторизации: отсутствует Clerk ID", 401);
    }

    // Проверяем, есть ли пользователь в базе
    let user = await db.user.findUnique({ where: { clerkId: clerkId } });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      user = await db.user.create({
        data: {
          clerkId,
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
              "Пользователь",
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          avatar: clerkUser.imageUrl,
        },
      });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
}
