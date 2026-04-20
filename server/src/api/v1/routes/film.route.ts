import { Router } from "express";
const router: Router = Router();

import * as filmController from "../controllers/film.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";
import { validateCreateFilm, validateUpdateFilm } from "../validators/film.validator";

// [GET] /api/v1/films
router.get("/", optionalAuthMiddleware, filmController.index);

// [GET] /api/v1/films/trash  (admin) — phải đặt TRƯỚC /:id để không bị match nhầm
router.get("/trash", authMiddleware(UserRole.ADMIN), filmController.getTrash);

// [GET] /api/v1/films/slug/:slug  (public)
router.get("/slug/:slug", filmController.getBySlug);

// [GET] /api/v1/films/:id  (admin)
router.get("/:id", authMiddleware(UserRole.ADMIN), filmController.getById);

// [POST] /api/v1/films
router.post("/", authMiddleware(UserRole.ADMIN), validateCreateFilm, filmController.create);

// [PATCH] /api/v1/films/:id  — edit hoặc khôi phục ({ deleted: false })
router.patch("/:id", authMiddleware(UserRole.ADMIN), validateUpdateFilm, filmController.edit);

// [DELETE] /api/v1/films/:id/permanent  — xóa vĩnh viễn (đặt TRƯỚC /:id)
router.delete("/:id/permanent", authMiddleware(UserRole.ADMIN), filmController.permanentDelete);

// [DELETE] /api/v1/films/:id  — xóa mềm
router.delete("/:id", authMiddleware(UserRole.ADMIN), filmController.remove);

export default router;