import express, { Express } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import * as database from "./config/database";
import mainV1Routes from "./api/v1/routes/index.route";
import { startOrderCleanupJob } from "./jobs/orderCleanup.job";
import { errorHandler } from "./middlewares/error.middleware";
import { registerWebhook } from "./helpers/payos.helper";

const app: Express = express();
const port: number | string = process.env.PORT || 3000;
const clientUrl: string = process.env.CLIENT_URL || "http://localhost:3000";
const isProduction = process.env.NODE_ENV === "production";

database.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [clientUrl, "http://localhost:4000"],
    credentials: true,
  })
);
app.use(cookieParser());

mainV1Routes(app);

// ── Background jobs & Webhook ─────────────────────────────────────────────
if (isProduction) {
  // Production: dùng webhook làm chính, cleanup job làm safety net
  // Tự động đăng ký webhook với PayOS khi server khởi động
  const webhookUrl = process.env.PAYOS_WEBHOOK_URL!;
  if (webhookUrl) {
    registerWebhook(webhookUrl)
      .then(() => console.log("✅ PayOS webhook registered:", webhookUrl))
      .catch((err) => console.error("❌ PayOS webhook registration failed:", err));
  }

  // Vẫn giữ cleanup job nhưng chạy thưa hơn (mỗi 15 phút thay vì 5 phút)
  // để xử lý các order bị bỏ quên
  startOrderCleanupJob({ interval: "*/15 * * * *" });
  console.log("🚀 Production mode: Webhook + Cleanup job (every 15 min)");
} else {
  // Development: chỉ dùng cleanup job + polling từ client
  startOrderCleanupJob({ interval: "*/5 * * * *" });
  console.log("🛠️  Development mode: Cleanup job only (every 5 min)");
}

app.use(errorHandler);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});