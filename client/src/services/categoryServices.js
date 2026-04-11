import { API_ENDPOINTS } from "../constants";
import { get } from "../utils";

export const getCategories = () => get(API_ENDPOINTS.CATEGORIES.LIST);