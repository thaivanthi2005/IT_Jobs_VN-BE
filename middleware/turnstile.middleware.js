/**
 * Middleware xác thực Cloudflare Turnstile Captcha
 * Chống bot và spam đăng ký tài khoản liên tục.
 */
export const verifyTurnstile = async (req, res, next) => {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY || "0x4AAAAAAF_MsWeGwCXBBfEwij46HthZCkw";

  const token =
    req.body.turnstileToken ||
    req.body["cf-turnstile-response"] ||
    req.headers["cf-turnstile-response"];

  if (!token) {
    return res.json({
      code: "error",
      message: "Vui lòng hoàn thành xác minh Captcha trước khi đăng ký!",
    });
  }

  try {
    const remoteIp =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress;

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const outcome = await response.json();

    if (!outcome.success) {
      console.warn("[Turnstile] Validation failed:", outcome);
      return res.json({
        code: "error",
        message: "Xác thực Captcha không hợp lệ hoặc đã hết hạn, vui lòng thử lại!",
      });
    }

    next();
  } catch (error) {
    console.error("[Turnstile] Error verifying token with Cloudflare:", error);
    return res.json({
      code: "error",
      message: "Không thể kết nối máy chủ xác thực Captcha. Vui lòng thử lại sau!",
    });
  }
};

