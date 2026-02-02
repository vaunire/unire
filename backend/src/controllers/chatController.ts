import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { db } from "../config/database";
import { AppError } from "../middleware/appError";

// Получает список чатов пользователя
export async function getChats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new AppError("⚠️ Пользователь не авторизован", 401);
    }

    const chats = await db.chat.findMany({
      where: {
        members: { some: { userId } },
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const myMember = chat.members.find((m) => m.userId === userId);

        const otherMember =
          chat.members.find((m) => m.userId !== userId) || chat.members[0];
        const otherUser = otherMember?.user;

        const chatName = chat.type === "GROUP" ? chat.name : otherUser?.name;
        const chatAvatar =
          chat.type === "GROUP" ? chat.avatar : otherUser?.avatar;

        let unreadCount = 0;

        if (myMember) {
          const lastReadTime = myMember.lastReadAt;

          unreadCount = await db.message.count({
            where: {
              chatId: chat.id,
              createdAt: { gt: lastReadTime },
              senderId: { not: userId },
            },
          });
        }

        return {
          id: chat.id,
          type: chat.type,
          name: chatName,
          avatar: chatAvatar,
          lastMessage: chat.messages[0] || null,
          lastMessageAt: chat.lastMessageAt,
          unreadCount,
        };
      })
    );

    res.json(formattedChats);
  } catch (error) {
    next(error);
  }
}

// Создает новый личный чат или возвращает существующий
export async function getOrCreateChat(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      throw new AppError("Не указан ID собеседника", 400);
    }

    let chat = await db.chat.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { members: { some: { userId: userId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { name: true, email: true, avatar: true, isOnline: true },
            },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!chat) {
      chat = await db.chat.create({
        data: {
          type: "DIRECT",
          members: {
            create: [
              { userId: userId, role: "OWNER" },
              { userId: otherUserId, role: "MEMBER" },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  avatar: true,
                  isOnline: true,
                },
              },
            },
          },
          messages: true,
        },
      });
    }

    const otherMember = chat.members.find((m) => m.userId !== userId);
    const otherUser = otherMember?.user;

    res.json({
      id: chat.id,
      name: otherUser?.name,
      avatar: otherUser?.avatar,
      isOnline: otherUser?.isOnline,
      lastMessage: chat.messages[0] || null,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

// Создает групповой чат
export async function createGroup(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { name, description, members, avatar } = req.body;

    if (!name) {
      throw new AppError("Не указано название группы", 400);
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      throw new AppError("Не указаны участники группы", 400);
    }

    // Создаем список участников: владелец + выбранные пользователи
    const membersData = [
      { userId: userId, role: "OWNER" },
      ...members.map((memberId: string) => ({
        userId: memberId,
        role: "MEMBER",
      })),
    ];

    const chat = await db.chat.create({
      data: {
        type: "GROUP",
        name,
        description,
        avatar,
        members: {
          create: membersData.map(m => ({
            userId: m.userId,
            role: m.role as any
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
        },
        messages: true,
      },
    });

    res.json(chat);
  } catch (error) {
    next(error);
  }
}
