import { Router } from "express";
import { ProtectRoute } from "../middleware/auth";

import { getUsers } from "../controllers/userController";

const router = Router();

router.get("/", ProtectRoute, getUsers);

export default router;
