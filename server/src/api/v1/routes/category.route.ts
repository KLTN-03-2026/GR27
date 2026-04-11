import { Router} from "express";
const router: Router = Router();

import * as categoryController from "../controllers/category.controller";

router.get("/", categoryController.index);

export default router;