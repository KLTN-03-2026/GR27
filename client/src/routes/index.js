import commonRoutes from "./commonRoutes";
import userRoutes from "./userRoutes";
import adminRoutes from "./adminRoutes";

const routes = [
  ...commonRoutes,
  ...userRoutes,
  ...adminRoutes,
];

export default routes;




