import { API_ENDPOINTS } from "../constants";
import { get } from "../utils";

export const getAllCity = () => get(API_ENDPOINTS.CITIES.LIST);