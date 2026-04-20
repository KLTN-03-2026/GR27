import { Router } from "express";
const router: Router = Router();

import * as roomController from "../controllers/room.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";
import { validateCreateRoom, validateUpdateRoom } from "../validators/room.validator";

// [GET] /api/v1/rooms
router.get("/", optionalAuthMiddleware, roomController.index);

// [GET] /api/v1/rooms/trash  (admin) — đặt TRƯỚC /:id
router.get("/trash", authMiddleware(UserRole.ADMIN), roomController.getTrash);

// [GET] /api/v1/rooms/:id  (admin)
router.get("/:id", authMiddleware(UserRole.ADMIN), roomController.getById);

// [POST] /api/v1/rooms
router.post("/", authMiddleware(UserRole.ADMIN), validateCreateRoom, roomController.create);

// [PATCH] /api/v1/rooms/:id  — edit hoặc khôi phục ({ deleted: false })
router.patch("/:id", authMiddleware(UserRole.ADMIN), validateUpdateRoom, roomController.edit);

// [DELETE] /api/v1/rooms/:id/permanent  — xóa vĩnh viễn (đặt TRƯỚC /:id)
router.delete("/:id/permanent", authMiddleware(UserRole.ADMIN), roomController.permanentDelete);

// [DELETE] /api/v1/rooms/:id  — xóa mềm
router.delete("/:id", authMiddleware(UserRole.ADMIN), roomController.remove);

export default router;