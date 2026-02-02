import { Router } from "express";
import { ProtectRoute } from "../middleware/auth";

import { getMessages, sendMessage, toggleReaction } from "../controllers/messageController";

const router = Router();

router.get("/chat/:chatId", ProtectRoute, getMessages);
router.post("/", ProtectRoute, sendMessage);
router.post("/:messageId/react", ProtectRoute, toggleReaction);

export default router;
