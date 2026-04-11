import { Router} from "express";
const router: Router = Router();

import * as filmController from "../controllers/film.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";
import { validateCreateFilm, validateUpdateFilm } from "../validators/film.validator";


 router.get("/", optionalAuthMiddleware, filmController.index);

//--- PUBLIC ---

//[GET] DETAIL: /api/v1/films/slug/:slug
 router.get("/slug/:slug",  filmController.getBySlug);

//[GET] GET BY ID: /api/v1/films/:id
router.get("/:id", authMiddleware(UserRole.ADMIN), filmController.getById);

//[POST] CREATE: /api/v1/films
router.post("/", authMiddleware(UserRole.ADMIN),validateCreateFilm, filmController.create);

//[PATCH] EDIT: /api/v1/films/:id
router.patch("/:id", authMiddleware(UserRole.ADMIN),validateUpdateFilm, filmController.edit);

//[DELETE] DELETE: /api/v1/films/:id
router.delete("/:id", authMiddleware(UserRole.ADMIN), filmController.remove);



export default router;