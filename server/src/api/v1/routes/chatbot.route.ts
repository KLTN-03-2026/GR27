import { Router } from "express";
const router: Router = Router();

import * as chatbotController from "../controllers/chatbot.controller";

// [POST] /api/v1/chatbot
router.post("/", chatbotController.chat);

export default router;