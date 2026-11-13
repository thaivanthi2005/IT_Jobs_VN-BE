# Bảo mật khi deploy — ITJobs Backend

> Tài liệu dành cho đồ án cá nhân. Mức độ: **cơ bản nhưng đủ dùng**, không cần học bảo mật chuyên sâu.
> Mọi mục đều có 3 phần: **Vì sao** – **Làm gì** – **Kiểm tra**.

---

## 0. Checklist nhanh (in ra dán bàn học)

- [ ] `.env` không nằm trên GitHub / không nằm trong repo
- [ ] `JWT_SECRET` là chuỗi random ≥ 32 ký tự, khác giữa local và server
- [ ] `NODE_ENV=production` trên server
- [ ] `CORS_ORIGIN` là domain frontend thật (không phải `http://localhost:3000`)
- [ ] Đã bật HTTPS (dùng domain của Vercel/Render tự có)
- [ ] Chạy `npm audit` không còn lỗi **high / critical**
- [ ] MongoDB Atlas đã **giới hạn IP** (Network Access)
- [ ] Mật khẩu tài khoản demo trên server **không** trùng mật khẩu thật của bạn
- [ ] Đã thử gọi API bằng Postman từ máy khác → vẫn chạy đúng
- [ ] Không để `console.log(password)` hay `res.json(user)` lộ `password`

---

## 1. File `.env` — điều quan trọng nhất

### Vì sao
`.env` chứa mật khẩu MongoDB và khóa JWT. Nếu đẩy lên GitHub (kể cả repo private) coi như mất toàn bộ hệ thống.

### Làm gì

**Kiểm tra `.gitignore`** đã có 3 dòng này chưa:

```gitignore
node_modules
.env
*.log
```

**Nếu lỡ commit `.env` rồi**, phải làm 2 việc:

```bash
# 1. Xóa .env khỏi lịch sử git
git rm --cached .env
git commit -m "remove .env"
```

```text
# 2. Đổi lại TOÀN BỘ key đã lộ
- Vào MongoDB Atlas -> Database Access -> Edit user -> đổi password
- Vào Cloudinary -> Settings -> API Keys -> Generate new key
- Đổi JWT_SECRET (mọi token cũ sẽ tự hết hiệu lực — đúng ý muốn)
```

**Kiểm tra repo đã sạch chưa:**

```bash
git log --all --full-history -- .env
# Không có kết quả = sạch
```

### Nội dung `.env` trên server

```env
PORT=4000
NODE_ENV=production
DATABASE=mongodb+srv://user:pass@cluster.mongodb.net/itjobs
JWT_SECRET=<chuỗi random 96 ký tự>
CORS_ORIGIN=https://itjobs-frontend.vercel.app
cloud_name=...
api_key_image=...
api_secret_image=...
```

**Tạo `JWT_SECRET` random:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Không dùng lại `JWT_SECRET` của máy local. Nếu commit nhầm file .env cũ, kẻ tấn công biết secret sẽ tự tạo được token của bất kỳ user nào.

**Kiểm tra:** `git status` không thấy `.env`; trang GitHub của repo không có file `.env`.

---

## 2. HTTPS + `NODE_ENV=production`

### Vì sao
Code hiện tại có dòng:

```js
secure: process.env.NODE_ENV === "production"
```

Nếu trên server để `NODE_ENV=development` thì cookie **không** bật cờ `secure` → token có thể bị gửi qua HTTP thường → bị nghe lén.

### Làm gì

```env
NODE_ENV=production
```

Nếu deploy bằng **Render / Railway / Vercel** thì HTTPS có sẵn, không cần làm gì thêm.

Nếu deploy **VPS riêng**, cần thêm Nginx + chứng chỉ miễn phí:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.tenmien.com
```

### Kiểm tra

```bash
curl -I https://api.tenmien.com/city/list
# Phải thấy dòng access-control-allow-origin, không có lỗi SSL
```

Mở DevTools → Application → Cookies → cookie `token` phải có dấu ✅ ở cột **Secure** và **HttpOnly**.

---

## 3. CORS — chỉ cho domain của mình gọi

### Vì sao
Code hiện tại đọc `CORS_ORIGIN` từ `.env`. Nếu quên khai báo, nó mặc định về `http://localhost:3000` → frontend thật sẽ bị chặn (403).

### Làm gì

```env
# 1 domain
CORS_ORIGIN=https://itjobs-frontend.vercel.app

# Nhiều domain: cách nhau dấu phẩy (kể cả local để dev)
CORS_ORIGIN=https://itjobs-frontend.vercel.app,http://localhost:3000
```

> Không bao giờ dùng `CORS_ORIGIN=*` khi đã bật `credentials: true` — vừa sai về mặt kỹ thuật (trình duyệt chặn), vừa mất tác dụng bảo vệ.

### Kiểm tra

```bash
# Phải trả 403
curl -H "Origin: http://evil.com" https://api.tenmien.com/city/list

# Phải trả 200
curl -H "Origin: https://itjobs-frontend.vercel.app" https://api.tenmien.com/city/list
```

---

## 4. Rate limit khi chạy sau proxy (rất dễ sai)

### Vì sao
Khi deploy Render/Railway/Nginx, server nhận request qua **reverse proxy**. Nếu không khai báo `trust proxy`, Express đọc IP là IP của proxy cho **mọi** request → `express-rate-limit` thấy "1 người gọi 300 lần" và **chặn toàn bộ người dùng thật**.

### Làm gì
Đã thêm sẵn vào `index.js`:

```js
// Chạy sau reverse proxy (Render, Railway, Nginx...) thì cần bật để lấy đúng IP
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
```

> `1` = tin 1 lớp proxy phía trước. Nếu dùng **Cloudflare** (2 lớp: Cloudflare → Nginx → Node) thì đổi thành `2`.

### Kiểm tra

```bash
# Gọi liên tiếp 25 lần, lần 21 trở đi phải trả 429
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.tenmien.com/user/login \
    -H "Content-Type: application/json" \
    -d '{"email":"a@a.com","password":"Abcdef1@"}'
done
```

Sau đó dùng **điện thoại (4G)** gọi thử 1 lần → phải trả 200 (chứng tỏ không bị dính chung IP).

---

## 5. Kiểm tra thư viện có lỗ hổng

### Vì sao
Thư viện cũ có thể có lỗ hổng đã công bố. Đây là bước nhanh nhất để có số liệu đưa vào phần bảo mật của báo cáo.

### Làm gì

```bash
npm audit
```

Nếu có lỗi mức **high** hoặc **critical**:

```bash
npm audit fix
```

Nếu `npm audit fix` không xử lý được (do thư viện phụ thuộc):

```bash
npm audit fix --force   # cẩn thận: có thể nâng major version, chạy xong phải test lại
```

### Kiểm tra

```bash
npm audit --omit=dev
```

### Kết quả audit thực tế của dự án

Sau khi cài `helmet` + `express-rate-limit` và chạy `npm audit fix`, còn **2 lỗ hổng high**:

```text
cloudinary  <2.7.0  (high)
  Arbitrary Argument Injection qua tham số có dấu &
  Fix available via `npm audit fix --force` -> cloudinary@2.11.0 (BREAKING CHANGE)
  Kéo theo: multer-storage-cloudinary
```

**Xử lý khuyến nghị cho đồ án: KHÔNG chạy `--force`.**

Lý do:
- `cloudinary@2.x` thay đổi API, `multer-storage-cloudinary@4` có thể không còn tương thích → hỏng toàn bộ chức năng upload (avatar, logo, ảnh job, CV) ngay trước ngày bảo vệ
- Lỗ hổng khai thác được khi **tham số** (public_id, folder, transformation) do người dùng kiểm soát chứa dấu `&`. Code hiện tại **không** truyền tham số người dùng vào Cloudinary — chỉ dùng `CloudinaryStorage` mặc định để upload file
- Kiểm chứng: `helper/cloudinary.helper.js` không có `public_id`, `folder`, `transformation` nào lấy từ `req.body`

**Cách ghi vào báo cáo:**

> Hệ thống đã chạy `npm audit` và xử lý các lỗ hổng có bản vá an toàn (Joi nâng lên 18.3.1). Còn 2 cảnh báo mức high thuộc thư viện `cloudinary@1.41.3`; lỗ hổng này khai thác qua tham số transformation/public_id do người dùng nhập, trong khi hệ thống chỉ dùng Cloudinary để upload file với cấu hình mặc định, không truyền tham số từ client. Việc nâng lên `cloudinary@2.x` là breaking change gây ảnh hưởng toàn bộ chức năng upload nên được ghi nhận là rủi ro chấp nhận được trong phạm vi đồ án.

Nếu giảng viên yêu cầu phải sạch 100%, khi đó mới chạy:

```bash
npm audit fix --force
# Rồi test lại TOÀN BỘ: upload avatar, logo, ảnh job, nộp CV
```

> Lưu ý: `nodemon` (devDependency) cũng có cảnh báo nhưng **không lên production** nên không tính vào `--omit=dev`.

---

## 6. MongoDB Atlas — chặn IP

### Vì sao
Mặc định Atlas mở `0.0.0.0/0` (ai biết connection string cũng vào được). Nếu lộ chuỗi kết nối là mất DB.

### Làm gì
1. Vào **Atlas → Network Access**
2. Xóa rule `0.0.0.0/0` nếu có
3. Add IP của server:
   - **Render**: dùng *Static Outbound IP* (gói trả phí), hoặc giữ `0.0.0.0/0` nhưng **bắt buộc** phải đổi password mạnh
   - **VPS riêng**: add đúng IP public của VPS
   - **Máy cá nhân** khi dev: add IP nhà mạng
4. Vào **Database Access** → user chỉ cấp quyền `readWrite` trên database của mình, **không** dùng `Atlas admin`

### Kiểm tra
Từ máy tính cá nhân (không nằm trong whitelist) thử kết nối → phải bị timeout/refused.

---

## 7. Log và thông tin rò rỉ

### Vì sao
Lỗi phổ biến của đồ án sinh viên: `console.log(req.body)` khi debug rồi quên xóa → log trên server chứa mật khẩu dạng plaintext.

### Làm gì

**Tìm các chỗ nguy hiểm:**

```bash
grep -rn "console.log" --include="*.js" . | grep -v node_modules
```

**Quy tắc:**
- Trong `catch` dùng `console.error("Lỗi khi ...:", error.message)` — không log cả `error` object (có thể kèm query, kèm dữ liệu)
- Không bao giờ trả nguyên document Mongo về client:

```js
// SAI: trả về cả password đã hash
res.json({ user: existAccount });

// ĐÚNG: chỉ trả field cần thiết
res.json({
  user: {
    id: existAccount.id,
    fullName: existAccount.fullName,
    email: existAccount.email,
  },
});
```

> Ghi chú: dự án hiện tại **đã** làm đúng ở `auth.controller.js` (map từng field thủ công) và ở `loginPost` (chỉ trả `message`). Chỗ cần xem lại: `editJob` trả `jobDetail: jobDetail` là document, nhưng model Job không có field nhạy cảm nên chấp nhận được cho đồ án.

---

## 8. Tài khoản demo / dữ liệu thật

### Vì sao
Nếu bạn dùng email thật + mật khẩu thật để test rồi deploy, ai đó đăng nhập được vào tài khoản đó (và thử lại mật khẩu đó ở Facebook, Gmail...).

### Làm gì
- Tài khoản admin/company demo trên server: dùng email giả `demo@itjobs.local`, mật khẩu riêng chỉ dùng cho đồ án
- Xóa hết CV test có số điện thoại thật
- Không upload ảnh chứa giấy tờ cá nhân

---

## 9. Những thứ KHÔNG cần làm (đồ án cá nhân)

Để bạn không mất thời gian học mấy thứ quá sức:

| Không cần | Lý do |
|---|---|
| WAF (ModSecurity, Cloudflare Pro) | Quá mức, đồ án không có traffic thật |
| Mã hóa dữ liệu DB ở tầng ứng dụng | Atlas đã mã hóa ổ đĩa |
| Refresh token + rotation | JWT 1 ngày hiện tại là đủ |
| OWASP ZAP full scan | Chỉ cần `npm audit` + test Postman |
| CSRF token riêng | Đã có `sameSite: "lax"` chống được mức cơ bản |
| MFA / 2FA | Không cần cho đồ án |
| Redis để lưu rate-limit | Bộ nhớ RAM hiện tại đủ (1 instance) |

---

## 10. Lệnh kiểm tra tổng hợp trước khi bảo vệ

Chạy đủ 6 lệnh này, tất cả pass là yên tâm:

```bash
# 1. Không có connection string trong code
grep -rn "mongodb+srv://" --include="*.js" . | grep -v node_modules
# Kết quả mong đợi: rỗng

# 2. Không có password hard-code
grep -rniE "password\s*=\s*['\"]" --include="*.js" . | grep -v node_modules
# Kết quả mong đợi: rỗng

# 3. Thư viện an toàn (không tính devDependencies)
npm audit --omit=dev

# 4. .env không bị track
git ls-files | grep -c "^\.env$"
# Kết quả mong đợi: 0

# 5. Server trả đúng header bảo mật
curl -sI https://api.tenmien.com/city/list | grep -iE "x-powered-by|content-security|x-frame"
# Kết quả mong đợi: KHÔNG có x-powered-by, CÓ content-security-policy

# 6. Domain lạ bị chặn
curl -s -o /dev/null -w "%{http_code}\n" -H "Origin: http://evil.com" https://api.tenmien.com/city/list
# Kết quả mong đợi: 403
```

---

## 11. Bảng đối chiếu: code phòng thủ cái gì

Dùng bảng này để viết phần "Giải pháp bảo mật" trong báo cáo:

| Tấn công | Code chặn ở đâu | Cách chặn |
|---|---|---|
| Đọc trộm mật khẩu trong DB | `controller/user.controller.js` | `bcrypt.hash()` salt 10 |
| Giả mạo token | `middleware/auth.middleware.js` | `jwt.verify(..., { algorithms: ["HS256"] })` |
| Đánh cắp token qua XSS | `controller/*.controller.js` | cookie `httpOnly` |
| Dò mật khẩu hàng loạt | `middleware/rateLimit.middleware.js` | 20 lần / 15 phút |
| Payload `{"email":{"$ne":null}}` | `middleware/sanitize.middleware.js` | xóa key bắt đầu bằng `$` |
| Làm treo server bằng regex | `controller/search.controller.js` | `escapeRegex()` + giới hạn 100 ký tự |
| Sửa `password` qua API profile | `controller/user.controller.js` | chỉ nhận `fullName`, `phone` |
| Upload file `.exe` | `middleware/upload.middleware.js` | whitelist MIME + giới hạn 5/10MB |
| Id rác gây lỗi 500 | `middleware/validateObjectId.middleware.js` | kiểm tra `ObjectId.isValid` |
| Đọc stack trace | `index.js` | error handler tập trung |
| Payload 100MB | `index.js` | `express.json({ limit: "1mb" })` |
| Dò email đã đăng ký | `controller/user.controller.js` | message chung "Email hoặc mật khẩu không đúng" |
| Website khác gọi API | `index.js` | CORS whitelist từ `CORS_ORIGIN` |

---

## 12. Nếu được hỏi khi bảo vệ

Câu hỏi hay gặp và câu trả lời ngắn:

**"Tại sao dùng JWT mà không dùng session?"**
→ JWT không cần lưu state trên server, phù hợp khi deploy nhiều instance. Token được lưu trong cookie `httpOnly` nên JavaScript không đọc được, giảm rủi ro XSS.

**"Tại sao rate limit 20 lần mà không phải 5?"**
→ Đủ chặt để chống brute-force (thử mật khẩu có chữ hoa + số + ký tự đặc biệt trong 20 lần là bất khả thi), nhưng không chặn nhầm người dùng gõ sai mật khẩu vài lần.

**"Nếu kẻ tấn công có được JWT_SECRET thì sao?"**
→ Họ tự tạo được token. Vì vậy `JWT_SECRET` chỉ nằm trong `.env` (đã gitignore), là chuỗi 96 ký tự random, và khác nhau giữa local với server. Khi nghi ngờ lộ thì đổi secret, mọi token cũ mất hiệu lực ngay.

**"Cookie `sameSite: lax` chống được CSRF không?"**
→ Chống được phần lớn trường hợp: trình duyệt không gửi cookie khi form từ site khác POST sang. Với đồ án mức này là đủ; hệ thống lớn hơn thường dùng `strict` hoặc CSRF token riêng.

**"Làm sao biết đã an toàn?"**
→ Chạy mục 10 ở trên, 6 lệnh đều pass. Ngoài ra `npm audit` không còn lỗi high/critical.

---

## 13. Việc cần làm ngay (theo thứ tự)

1. **Hôm nay**: đổi `JWT_SECRET` trong `.env` local bằng lệnh `crypto.randomBytes` ở mục 1
2. **Hôm nay**: `git ls-files | grep .env` → nếu có kết quả thì làm mục 1 ngay
3. **Trước khi deploy**: tạo `.env` trên server với `NODE_ENV=production` + `CORS_ORIGIN` thật
4. **Sau khi deploy**: chạy 6 lệnh ở mục 10
5. **Trước bảo vệ**: chạy `npm audit` và chụp ảnh màn hình kết quả để đưa vào báo cáo



