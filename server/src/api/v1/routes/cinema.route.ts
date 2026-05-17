import { Router } from "express";
const router: Router = Router();

import * as cinemaController from "../controllers/cinema.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";

// [GET] /api/v1/cinemas
router.get("/", optionalAuthMiddleware, cinemaController.index);

// [GET] /api/v1/cinemas/trash  (admin) 
router.get("/trash", authMiddleware(UserRole.ADMIN), cinemaController.getTrash);

// [GET] /api/v1/cinemas/slug/:slug  (public)
router.get("/slug/:slug", cinemaController.getBySlug);

// [GET] /api/v1/cinemas/:id  (admin)
router.get("/:id", authMiddleware(UserRole.ADMIN), cinemaController.getById);

// [POST] /api/v1/cinemas
router.post("/", authMiddleware(UserRole.ADMIN), cinemaController.create);

// [PATCH] /api/v1/cinemas/:id  — edit hoặc khôi phục ({ deleted: false })
router.patch("/:id", authMiddleware(UserRole.ADMIN), cinemaController.edit);

// [DELETE] /api/v1/cinemas/:id/permanent  — xóa vĩnh viễn (đặt TRƯỚC /:id)
router.delete("/:id/permanent", authMiddleware(UserRole.ADMIN), cinemaController.permanentDelete);

// [DELETE] /api/v1/cinemas/:id  — xóa mềm
router.delete("/:id", authMiddleware(UserRole.ADMIN), cinemaController.remove);

export default router;