import express, { Express } from "express";
import dotenv from "dotenv";
// Cấu hình .env
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import * as database from "./config/database";
import mainV1Routes from "./api/v1/routes/index.route";
import { startOrderCleanupJob } from "./jobs/orderCleanup.job"; // ✅ THÊM MỚI

// Khởi động app và thiết lập port
const app: Express = express();
const port: number | string = process.env.PORT || 3000;

// Kết nối Database
database.connect();

// Middleware để đọc body từ client, không cần body-parser nâng cao
app.use(express.json()); // Đọc JSON từ client (axios/fetch gửi lên)
app.use(express.urlencoded({ extended: true })); // Nếu dùng form HTML gửi lên

// Cho phép CORS
app.use(
  cors({
    origin: ["http://localhost:3000"], // ✅ Chỉ cho phép React app
    credentials: true, //Cho phép gửi request với cookie, phải có
  })
); // cấu hình mặc định: cho phép tất cả origin

// Dùng để check cookie đăng nhập
app.use(cookieParser());

// Liên kết index API
mainV1Routes(app);

// ✅ THÊM MỚI: Khởi động background jobs
startOrderCleanupJob();

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});