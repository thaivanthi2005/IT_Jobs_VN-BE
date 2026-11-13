/**
 * Trả về cấu hình Cookie chuẩn hóa cho toàn bộ Backend.
 * Trong môi trường production:
 * - Gán domain: .devjobs.click để cả devjobs.click (FE) và api.devjobs.click (BE) đều dùng chung cookie.
 * - secure: true (chỉ gửi qua HTTPS).
 * - sameSite: "lax" (cho phép gửi cookie khi điều hướng trang).
 * - httpOnly: true (chống tấn công XSS đánh cắp token).
 * - path: "/"
 */
export const getCookieOptions = (customMaxAge) => {
  const isProd = process.env.NODE_ENV === "production";
  const domain =
    process.env.COOKIE_DOMAIN || (isProd ? ".devjobs.click" : undefined);

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };

  if (customMaxAge !== undefined) {
    options.maxAge = customMaxAge;
  }

  if (domain) {
    options.domain = domain;
  }

  return options;
};
