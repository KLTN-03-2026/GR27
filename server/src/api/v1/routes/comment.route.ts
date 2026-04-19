import { Router } from "express";
const router: Router = Router();

import * as commentController from "../controllers/comment.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";
import {
  validateCreateComment,
  validateUpdateComment,
} from "../validators/comment.validator";

// [GET] LIST ALL COMMENTS (ADMIN): /api/v1/comments
// Query params: ?page=1&isReported=true&filmId=xxx
router.get("/", authMiddleware(UserRole.ADMIN), commentController.index);

// [GET] COMMENTS BY FILM SLUG (PUBLIC): /api/v1/comments/film/:slug
// Query params: ?page=1
router.get("/film/:id", commentController.getByFilmId);

// [POST] CREATE COMMENT (USER): /api/v1/comments
router.post(
  "/",
  authMiddleware(UserRole.USER),
  validateCreateComment,
  commentController.create
);

// [PATCH] UPDATE COMMENT (USER - OWN COMMENT): /api/v1/comments/:id
router.patch(
  "/:id",
  authMiddleware(UserRole.USER),
  validateUpdateComment,
  commentController.edit
);

// [DELETE] DELETE COMMENT (USER - OWN COMMENT or ADMIN): /api/v1/comments/:id
router.delete("/:id", authMiddleware([UserRole.ADMIN, UserRole.USER]), commentController.remove);

// [PATCH] REPORT COMMENT (USER): /api/v1/comments/:id/report
router.patch("/:id/report", authMiddleware(UserRole.USER), commentController.report);

// [PATCH] UNREPORT COMMENT (ADMIN ONLY): /api/v1/comments/:id/unreport
router.patch("/:id/unreport", authMiddleware(UserRole.ADMIN), commentController.unreport);

export default router;