import { Router} from "express";
const router: Router = Router();

import * as cinemaController from "../controllers/cinema.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";

//[GET] LIST: /api/v1/cinemas
router.get("/", optionalAuthMiddleware, cinemaController.index);

//[GET] DETAIL BY SLUG (PUBLIC): /api/v1/cinemas/slug/:slug
// Chỉ trả về cinema active và chưa bị xóa
router.get("/slug/:slug", cinemaController.getBySlug);

//[GET] DETAIL BY ID (ADMIN): /api/v1/cinemas/:id  
// Trả về cinema cho admin (chỉ cần chưa bị xóa)
router.get("/:id", authMiddleware(UserRole.ADMIN), cinemaController.getById);

//[POST] CREATE: /api/v1/cinemas
router.post("/", authMiddleware(UserRole.ADMIN), cinemaController.create);

//[PATCH] EDIT: /api/v1/cinemas/:id
router.patch("/:id", authMiddleware(UserRole.ADMIN), cinemaController.edit);

//[DELETE] DELETE: /api/v1/cinemas/:id
router.delete("/:id", authMiddleware(UserRole.ADMIN), cinemaController.remove);

export default router;