import { Router } from "express";
const router: Router = Router();

import * as showTimeController from "../controllers/showTime.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";
import {
  validateCreateShowTime,
  validateUpdateShowTime,
  validateBulkCreateShowTime,
} from "../validators/showTime.validator";

// [GET] /api/v1/show-times
router.get("/", optionalAuthMiddleware, showTimeController.index);

// [GET] /api/v1/show-times/trash  (admin) — đặt TRƯỚC /:id
router.get("/trash", authMiddleware(UserRole.ADMIN), showTimeController.getTrash);

// [GET] /api/v1/show-times/film/:filmId
router.get("/film/:filmId", optionalAuthMiddleware, showTimeController.getByFilmId);

// [GET] /api/v1/show-times/cinema/:cinemaId
router.get("/cinema/:cinemaId", showTimeController.getByCinemaId);

// [GET] /api/v1/show-times/:id
router.get("/:id", optionalAuthMiddleware, showTimeController.getById);

// [POST] /api/v1/show-times/bulk  — tạo hàng loạt (đặt TRƯỚC / để tránh conflict route)
router.post(
  "/bulk",
  authMiddleware(UserRole.ADMIN),
  validateBulkCreateShowTime,
  showTimeController.createBulk
);

// [POST] /api/v1/show-times
router.post("/", authMiddleware(UserRole.ADMIN), validateCreateShowTime, showTimeController.create);

// [PATCH] /api/v1/show-times/:id
router.patch("/:id", authMiddleware(UserRole.ADMIN), validateUpdateShowTime, showTimeController.edit);

// [DELETE] /api/v1/show-times/:id/permanent  — xóa vĩnh viễn (đặt TRƯỚC /:id)
router.delete("/:id/permanent", authMiddleware(UserRole.ADMIN), showTimeController.permanentDelete);

// [DELETE] /api/v1/show-times/:id  — xóa mềm
router.delete("/:id", authMiddleware(UserRole.ADMIN), showTimeController.remove);

export default router;