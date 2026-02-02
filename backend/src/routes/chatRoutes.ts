import { Router } from "express";
import { ProtectRoute } from "../middleware/auth";

import { getChats, getOrCreateChat, createGroup } from "../controllers/chatController";

const router = Router();

router.use(ProtectRoute);

router.get("/", getChats);
router.post("/direct", getOrCreateChat);
router.post("/group", createGroup);

export default router;
