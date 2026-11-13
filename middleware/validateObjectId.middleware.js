import mongoose from "mongoose";

// Kiểm tra tham số :id trên URL có đúng định dạng ObjectId của MongoDB
export const validateObjectId = (paramName = "id") => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(value)) {
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
    return;
  }

  next();
};
