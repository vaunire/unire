import { Role, MessageType, ChatType } from "../generated/prisma/enums.ts";

// 1. Перевод ролей
export const ROLE_LABELS: Record<Role, string> = {
  [Role.MEMBER]: "Участник",
  [Role.ADMIN]: "Администратор",
  [Role.OWNER]: "Владелец",
};

// 2. Перевод типов чатов
export const CHAT_TYPE_LABELS: Record<ChatType, string> = {
  [ChatType.DIRECT]: "Личные сообщения",
  [ChatType.GROUP]: "Группа",
  [ChatType.CHANNEL]: "Канал",
};

// 3. Перевод типов сообщений
export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  [MessageType.TEXT]: "Текстовое сообщение",
  [MessageType.IMAGE]: "Фотография",
  [MessageType.VIDEO]: "Видеозапись",
  [MessageType.AUDIO]: "Голосовое сообщение",
  [MessageType.FILE]: "Файл",
  [MessageType.SYSTEM]: "Системное уведомление",
};
