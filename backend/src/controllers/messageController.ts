import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { db } from "../config/database";
import { AppError } from "../middleware/appError";

// Получает историю сообщений конкретного чата
export async function getMessages(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    if (!userId || !chatId) {
      throw new AppError("⚠️ Недостаточно данных для выполнения запроса", 400);
    }

    // Проверяем, существует ли чат и состоит ли в нем пользователь
    const chat = await db.chat.findFirst({
      where: {
        id: chatId as string,
        members: {
          some: { userId },
        },
      },
    });

    if (!chat) {
      throw new AppError("⚠️ Чат не найден или у Вас недостаточно прав", 404);
    }

    // Получаем сообщения
    const messages = await db.message.findMany({
      where: {
        chatId: chatId as string,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        attachments: true,
        reactions: true,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
}

// Отправка сообщения
export async function sendMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { chatId, text, type, replyToId, attachments } = req.body;

    if (!chatId) {
      throw new AppError("Не указан ID чата", 400);
    }

    if (!text && (!attachments || attachments.length === 0)) {
      throw new AppError("Сообщение не может быть пустым", 400);
    }

    // Проверяем доступ к чату
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });

    if (!chat || !chat.members.some((m) => m.userId === userId)) {
      throw new AppError("Чат не найден или доступ запрещен", 403);
    }

    // Создаем сообщение
    const message = await db.message.create({
      data: {
        chatId,
        senderId: userId,
        text,
        type: type || "TEXT",
        replyToId,
        attachments: {
          create: attachments?.map((att: any) => ({
            url: att.url,
            name: att.name,
            size: att.size,
            mimeType: att.mimeType,
          })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        attachments: true,
        replyTo: {
          include: {
            sender: { select: { name: true } }
          }
        }
      },
    });

    // Обновляем время последнего сообщения в чате
    await db.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    res.json(message);
  } catch (error) {
    next(error);
  }
}

// Реакция на сообщение
export async function toggleReaction(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      throw new AppError("Не указан эмодзи", 400);
    }

    const existingReaction = await db.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: messageId as string,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      await db.reaction.delete({
        where: { id: existingReaction.id },
      });
      res.json({ status: "removed" });
    } else {
      const reaction = await db.reaction.create({
        data: {
          messageId: messageId as string,
          userId,
          emoji,
        },
      });
      res.json({ status: "added", reaction });
    }
  } catch (error) {
    next(error);
  }
}
