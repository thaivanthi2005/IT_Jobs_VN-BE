import express from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./router/index.route.js";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import cookieParser from "cookie-parser";
import * as rateLimitMiddleware from "./middleware/rateLimit.middleware.js";
import * as sanitizeMiddleware from "./middleware/sanitize.middleware.js";

// Load biến môi trường
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Khi chạy sau reverse proxy (Render, Railway, Nginx, ...), cần bật để
// Express đọc đúng IP thật của client trong header X-Forwarded-For.
// Không bật thì express-rate-limit sẽ thấy mọi request cùng 1 IP và chặn nhầm.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Không cho lộ thông tin server ra ngoài header
app.disable("x-powered-by");

// Kiểm tra biến môi trường bắt buộc, tránh chạy với secret rỗng
if (!process.env.JWT_SECRET) {
  console.error("Thiếu biến môi trường JWT_SECRET trong file .env !");
  process.exit(1);
}

// Kết nối cơ sở dữ liệu MongoDB Atlas
connectDB();

// Cấu hình CORS cho phép Frontend truy cập và gửi cookie
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép Postman / server-to-server (không có origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin không được phép truy cập!"));
    },
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Cho phép gửi cookie phiên đăng nhập
  })
);

// Thiết lập các HTTP header bảo mật (CSP, X-Frame-Options, ...)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Giới hạn dung lượng body để tránh payload quá lớn
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Chặn NoSQL Injection cơ bản
app.use(sanitizeMiddleware.sanitizeBody);

// Giới hạn số request để chống spam
app.use(rateLimitMiddleware.apiLimiter);

// Định tuyến API
app.use("/", router);

// Route không tồn tại
app.use((req, res) => {
  res.status(404).json({
    code: "error",
    message: "Đường dẫn không tồn tại!",
  });
});

// Middleware xử lý lỗi tập trung (không trả stack trace ra ngoài)
app.use((err, req, res, next) => {
  console.error(err);

  // Lỗi upload file (multer)
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      code: "error",
      message: "File tải lên vượt quá dung lượng cho phép!",
    });
    return;
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    res.status(400).json({
      code: "error",
      message: "Số lượng file tải lên vượt quá cho phép!",
    });
    return;
  }

  if (err.code === "LIMIT_FIELD_COUNT" || err.code === "LIMIT_FIELD_VALUE") {
    res.status(400).json({
      code: "error",
      message: "Dữ liệu gửi lên vượt quá giới hạn cho phép!",
    });
    return;
  }

  // Định dạng file không hợp lệ (fileFilter)
  if (err.message === "Định dạng file không được phép!") {
    res.status(400).json({
      code: "error",
      message: err.message,
    });
    return;
  }

  // Body gửi lên quá lớn
  if (err.type === "entity.too.large") {
    res.status(413).json({
      code: "error",
      message: "Dữ liệu gửi lên quá lớn!",
    });
    return;
  }

  // JSON không đúng định dạng
  if (err.type === "entity.parse.failed") {
    res.status(400).json({
      code: "error",
      message: "Dữ liệu gửi lên không đúng định dạng JSON!",
    });
    return;
  }

  // CORS chặn domain lạ
  if (err.message === "Origin không được phép truy cập!") {
    res.status(403).json({
      code: "error",
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    code: "error",
    message: "Có lỗi xảy ra, vui lòng thử lại sau!",
  });
});

app.listen(port, () => {
  console.log(`Website ITJobs Backend (Express.js) đang chạy trên cổng ${port}`);
});
