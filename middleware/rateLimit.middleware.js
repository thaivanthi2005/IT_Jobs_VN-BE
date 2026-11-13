import rateLimit from "express-rate-limit";

const messageTooManyRequest = {
  code: "error",
  message: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau!",
};

// Giới hạn chung cho toàn bộ API (chống spam / DDoS mức cơ bản)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: messageTooManyRequest,
});

// Giới hạn riêng cho đăng nhập / đăng ký (chống brute-force mật khẩu)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "error",
    message: "Bạn đã thử quá nhiều lần, vui lòng thử lại sau 15 phút!",
  },
});

// Giới hạn cho các API upload file
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: messageTooManyRequest,
});
