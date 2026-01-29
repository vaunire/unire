import type { Request, Response, NextFunction } from "express";
import { AppError } from "./appError";
import { Prisma } from "../generated/prisma/client";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`💥 [${req.method} ${req.originalUrl}]:`, err.message);

  // Если заголовки уже отправлены, передаем обработку Express
  if (res.headersSent) {
    return next(err);
  }

  // Значения по умолчанию (Внутренняя ошибка сервера)
  let statusCode = 500;
  let message = "Что-то пошло не так. Пожалуйста, попробуйте позже.";

  // Обработка ошибки приложения (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Обработка ошибок Prisma
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Нарушение уникальности (например, такой email уже занят)
    if (err.code === "P2002") {
      statusCode = 409;
      const target = (err.meta?.target as string[])?.join(", ") || "поле";
      message = `Ошибка: Данные в поле '${target}' уже существуют.`;
    }
    // P2025: Запись не найдена (например при обновлении)
    else if (err.code === "P2025") {
      statusCode = 404;
      message = "Запрашиваемая запись не найдена.";
    }
  }

  // Ошибка синтаксиса JSON в теле запроса
  else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    message = "Некорректный формат JSON.";
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
