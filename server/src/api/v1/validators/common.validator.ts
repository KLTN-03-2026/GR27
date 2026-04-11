
export const validatePassword = (password: string): string | null => {
  const letterRegex = /[a-zA-Z]/; // có ít nhất 1 chữ
  const numberRegex = /[0-9]/; // có ít nhất 1 số

  if (password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự";
  }

  if (password.length > 20) {
    return "Mật khẩu không được vượt quá 20 ký tự";
  }

  if (/\s/.test(password)) {
    return "Mật khẩu không được chứa ký tự trống (space)";
  }

  if (!letterRegex.test(password)) {
    return "Mật khẩu phải chứa ít nhất một chữ cái";
  }

  if (!numberRegex.test(password)) {
    return "Mật khẩu phải chứa ít nhất một số";
  }

  return null; // hợp lệ
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return "Email không được để trống";
  }

  if (/\s/.test(email)) {
    return "Email không được chứa ký tự trống (space)";
  }

  if (!emailRegex.test(email)) {
    return "Email không hợp lệ";
  }

  return null; // hợp lệ
};

export const validateUsername = (username: string): string | null => {
  if (!username) {
    return "Tên người dùng không được để trống";
  }
  if(username.length < 4) {
    return "Tên người dùng tối thiểu phải 4 ký tự";
  }
  if (username.length > 25) {
    return "Tên người dùng không được vượt quá 25 ký tự";
  }

  if (/\s/.test(username)) {
    return "Tên người dùng không được chứa ký tự trống (space)";
  }

  if (/[A-Z]/.test(username)) {
    return "Tên người dùng không được chứa chữ hoa";
  }

  return null; // hợp lệ
};

export const validatePhone = (phone: string): string | null => {
  // Chuẩn VN: 10 hoặc 11 số, bắt đầu bằng 0
  const phoneRegex = /^0\d{9,10}$/;

  if (!phone) return "Số điện thoại không được để trống";
  if (!phoneRegex.test(phone)) return "Số điện thoại không hợp lệ";

  return null; // hợp lệ
};
