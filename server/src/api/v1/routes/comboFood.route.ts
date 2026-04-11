import { Router} from "express";
const router: Router = Router();

import * as comboFoodController from "../controllers/comboFood.controller";

router.get("/", comboFoodController.index);

export default router;