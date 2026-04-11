import { Router } from "express";
import multer from "multer";
const router: Router = Router();
const upload = multer();
import * as uploadCloud from "../../../middlewares/uploadCloud.middlewares";
import * as uploadController from "../controllers/upload.controller";

router.post(
  "/",
  upload.single("file"),
  uploadCloud.uploadSingle,
  uploadController.index
);

router.post("/image", upload.single("file"), uploadController.uploadImage);

export default router;
