import { Router } from "express";
const router: Router = Router();

import * as chatbotController from "../controllers/chatbot.controller";

// [POST] /api/v1/chatbot
// Không yêu cầu auth — chatbot có thể dùng không cần đăng nhập
router.post("/", chatbotController.chat);

export default router;