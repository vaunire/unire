import { Router } from "express";
import { ProtectRoute } from "../middleware/auth";

import { getMe, authCallback } from "../controllers/authController";

const router = Router();

router.get("/me", ProtectRoute, getMe);
router.post("/callback", ProtectRoute, authCallback);

export default router;
