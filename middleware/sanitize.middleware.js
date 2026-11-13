// Chặn tấn công NoSQL Injection (gửi $gt, $ne, ... trong body)
// và loại bỏ các key bẩn trước khi controller xử lý.
const removeDirtyKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => removeDirtyKeys(item));
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const dataFinal = {};
    for (const key of Object.keys(value)) {
      // Key bắt đầu bằng "$" hoặc chứa "." là đặc trưng của toán tử MongoDB
      if (key.startsWith("$") || key.includes(".")) continue;
      dataFinal[key] = removeDirtyKeys(value[key]);
    }
    return dataFinal;
  }

  return value;
};

export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = removeDirtyKeys(req.body);
  }
  next();
};
