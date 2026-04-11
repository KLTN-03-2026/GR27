import bcrypt from "bcryptjs";

/**
 * Hash password bằng bcrypt với salt rounds = 12
 * Salt rounds cao hơn = bảo mật hơn nhưng chậm hơn
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Khuyến nghị cho production
  return await bcrypt.hash(password, saltRounds);
};

/**
 * So sánh password plain text với password đã hash
 * @param plainPassword - Password người dùng nhập vào
 * @param hashedPassword - Password đã hash từ database
 */
export const comparePassword = async (
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};