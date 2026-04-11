import { Router } from "express";
const router: Router = Router();

import * as roomController from "../controllers/room.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";
import { validateCreateRoom, validateUpdateRoom } from "../validators/room.validator";

//[GET] LIST: /api/v1/rooms
router.get("/", optionalAuthMiddleware, roomController.index);

//[GET] DETAIL BY ID (ADMIN): /api/v1/rooms/:id  
// Trả về room cho admin (chỉ cần chưa bị xóa)
router.get("/:id", authMiddleware(UserRole.ADMIN), roomController.getById);

//[POST] CREATE: /api/v1/rooms
router.post("/", authMiddleware(UserRole.ADMIN), validateCreateRoom, roomController.create);

//[PATCH] EDIT: /api/v1/rooms/:id
router.patch("/:id", authMiddleware(UserRole.ADMIN), validateUpdateRoom, roomController.edit);

//[DELETE] DELETE: /api/v1/rooms/:id
router.delete("/:id", authMiddleware(UserRole.ADMIN), roomController.remove);

export default router;