import { Router } from "express";
const router: Router = Router();

import * as orderController from "../controllers/order.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";
import { validateCreateOrder } from "../validators/order.validator";


// ============== ADMIN ROUTES (đặt trước) ==============
// [GET] ALL ORDERS (ADMIN): /api/v1/orders/admin
router.get(
  "/admin",
  authMiddleware(UserRole.ADMIN),
  orderController.index
);

// [GET] ORDER DETAIL (ADMIN): /api/v1/orders/admin/:id
router.get(
  "/admin/:id",
  authMiddleware(UserRole.ADMIN),
  orderController.getOrderDetailAdmin
);

// ============== USER ROUTES ==============
// [POST] CREATE ORDER (USER): /api/v1/orders
router.post(
  "/",
  authMiddleware(UserRole.USER),
  validateCreateOrder,
  orderController.createOrder
);

router.get("/webhook", (req, res) => {
  res.status(200).json({ code: 200, message: "Webhook endpoint is active" });
});


// [POST] WEBHOOK FROM PAYOS (PUBLIC): /api/v1/orders/webhook
router.post("/webhook", orderController.paymentWebhook);

// [GET] MY ORDERS (USER): /api/v1/orders/me
router.get(
  "/me",
  authMiddleware(UserRole.USER),
  orderController.getMyOrders
);

// [GET] CHECK PAYMENT STATUS (USER): /api/v1/orders/:id/check-payment
router.get(
  "/:id/check-payment",
  authMiddleware(UserRole.USER),
  orderController.checkPaymentStatus
);

// [PATCH] CANCEL ORDER (USER): /api/v1/orders/:id/cancel
router.patch(
  "/:id/cancel",
  authMiddleware(UserRole.USER),
  orderController.cancelOrder
);

// [GET] ORDER DETAIL (USER): /api/v1/orders/:id
router.get(
  "/:id",
  authMiddleware(UserRole.USER),
  orderController.getOrderDetail
);

export default router;