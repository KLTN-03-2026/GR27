// utils/random.ts

/**
 * Sinh token ngẫu nhiên gồm chữ và số
 * @param length Độ dài token (mặc định: 20)
 * @returns Chuỗi token
 */
export const generateToken = (length: number = 20): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }

  return token;
};

/**
 * Sinh số ngẫu nhiên dạng chuỗi số (OTP)
 * @param length Độ dài số (mặc định: 6)
 * @returns Chuỗi số OTP
 */
export const generateRandomNumber = (length: number = 6): string => {
  const digits = '0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    result += digits.charAt(randomIndex);
  }

  return result;
};
