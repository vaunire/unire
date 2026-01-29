import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { db } from "../config/database";
import { getAuth, clerkClient } from "@clerk/express";

// Получает профиль текущего авторизованного пользователя из БД
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await db.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ message: "⚠️ Пользователь не найден" });
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
      return res
        .status(401)
        .json({ message: "💥 Ошибка авторизации: отсутствует Clerk ID" });
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
