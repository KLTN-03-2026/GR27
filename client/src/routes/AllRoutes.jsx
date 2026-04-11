import { useRoutes } from "react-router-dom";
import routes from "./index";

const  AllRoutes = () => {
  return useRoutes(routes);
}

export default AllRoutes;
