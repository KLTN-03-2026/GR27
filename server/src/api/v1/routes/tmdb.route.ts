import { Router } from "express";
import * as tmdbController from "../controllers/tmdb.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";

const router: Router = Router();

// Chỉ admin mới được dùng TMDb API
router.get("/search", authMiddleware(UserRole.ADMIN), tmdbController.searchFilms);
router.get("/:tmdbId", authMiddleware(UserRole.ADMIN), tmdbController.getFilmDetail);

export default router;