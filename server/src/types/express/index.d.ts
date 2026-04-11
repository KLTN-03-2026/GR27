import { IUser } from "../../api/v1/models/user.model"; // hoặc kiểu user bạn đang sử dụng

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser; // Kiểu của user, có thể là Document, IUser,... tùy vào model của bạn
  }
}
