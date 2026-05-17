import { get } from "../utils";

// Lấy tất cả combo food đang active
export const getAllCombos = () => get("/combofoods");