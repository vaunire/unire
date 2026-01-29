import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { ProtectRoute } from "../middleware/auth";

import { getMe, authCallback } from "../controllers/authController";

const router = Router();

router.get("/me", ProtectRoute, getMe);
router.post("/callback", requireAuth(), authCallback);

export default router;
