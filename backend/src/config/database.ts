import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Избегаем дубликатов клиента при перезагрузке сервера в dev-режиме
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Создаем менеджер очереди соединений с PostgreSQL
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Подключаем драйвер к Prisma через адаптер
const adapter = new PrismaPg(pool);

// Инициализируем клиент
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  } as any);

// Сохраняем экземпляр для повторного использования
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Функция для проверки подключения
export const connectDB = async () => {
  try {
    await db.$connect();
    console.log("🐘 База данных (PostgreSQL) успешно подключена");
  } catch (error) {
    console.error("💥 Ошибка подключения к БД:", error);
    process.exit(1);
  }
};
