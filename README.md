# ITJobs — Backend RESTful API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/JWT-HS256-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Cloudinary-Integrated-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

Backend RESTful API cho nền tảng tuyển dụng việc làm IT trực tuyến (**ITJobs**), được xây dựng trên nền tảng **Node.js, Express.js 5 (ES Modules)**, kết nối cơ sở dữ liệu **MongoDB Atlas (Mongoose 9)** và lưu trữ file media trên **Cloudinary**.

---

## 📑 Mục lục
- [1. Kiến trúc & Công nghệ](#1-kiến-trúc--công-nghệ)
- [2. Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
- [3. Tính năng & Bảo mật](#3-tính-năng--bảo-mật)
- [4. Cài đặt & Khởi chạy](#4-cài-đặt--khởi-chạy)
  - [Chạy với Node.js](#cách-1-chạy-trực-tiếp-với-nodejs)
  - [Chạy với Docker](#cách-2-chạy-với-docker-khuyên-dùng-cho-production)
- [5. Biến môi trường (.env)](#5-biến-môi-trường-env)
- [6. Danh sách API Endpoints](#6-danh-sách-api-endpoints)
- [7. Hướng dẫn Triển khai Production](#7-hướng-dẫn-triển-khai-production)

---

## 1. Kiến trúc & Công nghệ

- **Runtime:** Node.js `>= 22.0.0` (ES Modules)
- **Framework:** Express.js `5.2.1`
- **Database:** MongoDB Atlas (Mongoose `9.x`)
- **Authentication:** JSON Web Token (JWT) qua `httpOnly`, `secure`, `sameSite: "lax"` Cookie
- **Media Storage:** Cloudinary (Multer Cloudinary Storage)
- **Validation & Sanitization:** Joi, MongoDB body sanitization chống NoSQL Injection
- **Security:** Helmet, Express Rate Limit, CORS Whitelist, CSRF Protection via SameSite Cookies
- **Containerization:** Docker Multi-stage Build (`node:22-alpine`), Non-root user `node`, `dumb-init`

---

## 2. Cấu trúc thư mục

```text
Product_JOB_BE_JS/
├── config/                  # Cấu hình kết nối CSDL (database.js)
├── controller/              # Xử lý logic nghiệp vụ API
│   ├── auth.controller.js   # Kiểm tra token phiên, đăng xuất
│   ├── city.controller.js   # Danh mục tỉnh/thành phố
│   ├── company.controller.js# Nghiệp vụ Nhà tuyển dụng & Quản lý hồ sơ CV
│   ├── job.controller.js    # Chi tiết việc làm & Ứng tuyển CV
│   ├── search.controller.js # Tìm kiếm & lọc đa điều kiện (kỹ năng, địa điểm, lương)
│   └── user.controller.js   # Đăng ký, đăng nhập, cập nhật hồ sơ Ứng viên
├── helper/                  # Cấu hình Cloudinary & Multer Storage
├── middleware/              # Các tầng bảo vệ request
│   ├── auth.middleware.js   # Xác thực JWT Token & Phân quyền User/Company
│   ├── rateLimit.middleware.js # Giới hạn tần suất request (chống DDoS/Brute-force)
│   ├── sanitize.middleware.js  # Lọc NoSQL injection trong body
│   ├── upload.middleware.js    # Kiểm tra kích thước và định dạng file upload
│   └── validateObjectId.middleware.js # Kiểm tra tính hợp lệ của MongoDB ObjectId
├── model/                   # Mongoose Schemas (AccountUser, AccountCompany, Job, CV, City)
├── router/                  # Định tuyến API
│   ├── auth.route.js
│   ├── city.route.js
│   ├── company.route.js
│   ├── index.route.js       # Router tổng hợp
│   ├── job.route.js
│   ├── search.route.js
│   └── user.route.js
├── validates/               # Schema validation bằng Joi
├── .dockerignore            # Loại bỏ file thừa khi build Docker
├── .env.example             # File mẫu biến môi trường
├── Dockerfile               # Dockerfile multi-stage production
├── docker-compose.yml       # Docker Compose khởi chạy độc lập
├── index.js                 # Điểm khởi chạy server Express
└── package.json
```

---

## 3. Tính năng & Bảo mật

Hệ thống được thiết kế theo các tiêu chuẩn bảo mật OWASP:

| # | Biện pháp | Công cụ / Thực hiện | Ngăn chặn |
|---|---|---|---|
| 1 | **Mã hóa mật khẩu** | `bcryptjs` (salt 10) | Rò rỉ mật khẩu người dùng |
| 2 | **Xác thực JWT an toàn** | Cookie `httpOnly`, `secure`, `sameSite` | Đánh cắp token qua tấn công XSS |
| 3 | **Cố định thuật toán ký** | Thuật toán `HS256` cố định | Lỗ hổng `alg: none` JWT |
| 4 | **Bảo vệ HTTP Header** | `helmet` (CSP, X-Frame-Options...) | Clickjacking, MIME-sniffing |
| 5 | **Chống NoSQL Injection** | Sanitize loại bỏ các operator `$gt`, `$ne`, `$regex` | Khai thác cơ sở dữ liệu MongoDB |
| 6 | **Giới hạn tốc độ request** | `express-rate-limit` | Tấn công Brute-force & DDoS |
| 7 | **Kiểm tra dữ liệu đầu vào** | `Joi` schema validation | Dữ liệu rác, sai kiểu dữ liệu |
| 8 | **Chống Mass-Assignment** | Whitelist các field cho phép cập nhật | Ghi đè quyền hạn `role`, `email`, `_id` |
| 9 | **Kiểm tra upload nghiêm ngặt** | Giới hạn dung lượng và đuôi file hợp lệ | Tải lên mã độc / Web shell |
| 10 | **CORS Whitelist** | Chỉ chấp nhận domain Frontend được khai báo | Truy cập trái phép từ domain lạ |
| 11 | **Bảo mật Container** | Non-root user `node`, `dumb-init` PID 1 | Container escape & lỗi Zombie process |

---

## 4. Cài đặt & Khởi chạy

### Yêu cầu hệ thống
- **Node.js** `>= 18.0.0` (Khuyên dùng Node 22)
- **MongoDB** (MongoDB Atlas URI hoặc MongoDB 7 local)

### Cách 1: Chạy trực tiếp với Node.js

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường:**
   Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env
   # Sửa các thông số trong .env (xem mục 5)
   ```

3. **Khởi chạy ứng dụng:**
   ```bash
   # Chế độ phát triển (auto-reload):
   npm run dev

   # Chế độ thông thường:
   npm start
   ```
   Server sẽ lắng nghe tại: `http://localhost:4000`

---

### Cách 2: Chạy với Docker (Khuyên dùng cho Production)

Backend đã được đóng gói sẵn Docker multi-stage tối ưu với Alpine Linux:

```bash
# 1. Build và chạy container ngầm:
docker compose up -d --build

# 2. Xem log ứng dụng:
docker compose logs -f

# 3. Kiểm tra trạng thái và Healthcheck:
docker compose ps

# 4. Tắt container:
docker compose down
```

---

## 5. Biến môi trường (.env)

Sao chép `.env.example` thành `.env` và điền các giá trị thực tế:

```ini
# Cổng chạy server
PORT=4000

# development | production
NODE_ENV=production

# Chuỗi kết nối MongoDB Atlas
DATABASE=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# Khóa bí mật ký JWT - bắt buộc trùng khớp với Frontend
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars

# Domain Frontend được phép gọi API (cách nhau bởi dấu phẩy nếu có nhiều domain)
CORS_ORIGIN=https://devjobs.click,https://www.devjobs.click

# Cloudinary (Quản lý ảnh công ty và avatar ứng viên)
cloud_name=your_cloud_name
api_key_image=your_api_key
api_secret_image=your_api_secret
```

---

## 6. Danh sách API Endpoints

### 🔐 Xác thực & Phiên làm việc (Auth)
| Phương thức | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/auth/check` | Public | Xác thực token cookie & trả thông tin người dùng |
| `GET` | `/auth/logout` | Logged In | Xóa cookie token, đăng xuất phiên |

### 👤 Ứng viên (User)
| Phương thức | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/user/register` | Public | Đăng ký tài khoản ứng viên |
| `POST` | `/user/login` | Public | Đăng nhập ứng viên, tạo cookie `token` |
| `PATCH` | `/user/profile` | User | Cập nhật thông tin cá nhân & avatar |
| `GET` | `/user/cv/list` | User | Danh sách các hồ sơ CV đã nộp |

### 🏢 Doanh nghiệp / Nhà tuyển dụng (Company)
| Phương thức | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/company/register` | Public | Đăng ký tài khoản nhà tuyển dụng |
| `POST` | `/company/login` | Public | Đăng nhập nhà tuyển dụng, tạo cookie `token` |
| `PATCH` | `/company/profile` | Company | Cập nhật thông tin công ty & logo |
| `POST` | `/company/job/create` | Company | Đăng tin tuyển dụng mới kèm tối đa 8 ảnh |
| `GET` | `/company/job/list` | Company | Danh sách tin tuyển dụng đã đăng (phân trang) |
| `GET` | `/company/job/edit/:id` | Company | Lấy thông tin tin tuyển dụng để chỉnh sửa |
| `PATCH` | `/company/job/edit/:id` | Company | Cập nhật thông tin tin tuyển dụng |
| `DELETE` | `/company/job/delete/:id` | Company | Xóa tin tuyển dụng |
| `GET` | `/company/cv/list` | Company | Danh sách hồ sơ ứng viên nộp vào công ty |
| `GET` | `/company/cv/detail/:id` | Company | Xem chi tiết CV (tự đánh dấu đã xem) |
| `PATCH` | `/company/cv/change-status` | Company | Phê duyệt hoặc từ chối hồ sơ ứng viên |
| `DELETE` | `/company/cv/delete/:id` | Company | Xóa hồ sơ ứng viên |

### 💼 Việc làm & Tìm kiếm (Public)
| Phương thức | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/job/detail/:id` | Public | Xem chi tiết việc làm & thông tin công ty |
| `POST` | `/job/apply` | Public | Nộp hồ sơ ứng tuyển kèm file CV (.pdf, .doc, .docx) |
| `GET` | `/search` | Public | Tìm kiếm việc làm đa tiêu chí (keyword, city, level...) |
| `GET` | `/company/list` | Public | Danh sách công ty công khai (phân trang) |
| `GET` | `/company/detail/:id` | Public | Chi tiết hồ sơ công ty và các job đang tuyển |
| `GET` | `/city/list` | Public | Lấy danh mục tỉnh / thành phố |

---

## 7. Hướng dẫn Triển khai Production

1. Đặt `NODE_ENV=production` để bật các cờ bảo mật `secure` cho Cookie và `trust proxy` cho Express Rate Limit.
2. Thiết lập Nginx Reverse Proxy chuyển tiếp domain `api.yourdomain.com` vào `http://127.0.0.1:4000`.
3. Bật SSL/TLS (Let's Encrypt / Cloudflare Full Strict) để mã hóa toàn bộ dữ liệu truyền tải.
