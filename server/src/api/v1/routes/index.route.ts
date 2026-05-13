// src/api/v1/routes/index.route.ts
import { Express } from "express";
import categoryRoutes from "./category.route";
import cityRoutes from "./city.route";
import comboFoodRoutes from "./comboFood.route";
import userRoutes from "./user.route";
import authRoutes from "./auth.route";
import filmRoutes from "./film.route";
import cinemaRoutes from "./cinema.route";
import uploadRoutes from "./upload.route";
import roomRoutes from "./room.route";
import showTimeRoutes from "./showTime.route";
import commentRoutes from "./comment.route";
import orderRoutes from "./order.route";
import dashboardRoutes from "./dashboard.route"; 
import chatbotRoutes from "./chatbot.route";
import tmdbRoutes from "./tmdb.route";

const mainV1Routes = (app: Express) => {
  const version = "/api/v1";

  // [API] Public
  app.use(version + "/categories", categoryRoutes);
  app.use(version + "/cities", cityRoutes);
  app.use(version + "/combofoods", comboFoodRoutes);

  // [API] Private
  app.use(version + "/users", userRoutes);
  app.use(version + "/auth", authRoutes);
  app.use(version + "/films", filmRoutes);
  app.use(version + "/cinemas", cinemaRoutes);
  app.use(version + "/rooms", roomRoutes);
  app.use(version + "/show-times", showTimeRoutes);
  app.use(version + "/comments", commentRoutes);
  app.use(version + "/orders", orderRoutes);
  app.use(version + "/upload", uploadRoutes);
  app.use(version + "/dashboard", dashboardRoutes); 
  app.use(version + "/chatbot", chatbotRoutes);
  app.use(version + "/tmdb", tmdbRoutes);
};

export default mainV1Routes;