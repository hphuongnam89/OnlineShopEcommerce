# Balomayanh - Online Store Project

Dự án website bán hàng trực tuyến chuyên phân phối balo máy ảnh, tích hợp đầy đủ tính năng đặt hàng, quản trị sản phẩm, quản lý đơn hàng, và phân quyền người dùng. Hệ thống được thiết kế tối ưu hóa hiệu năng, bảo mật cao và trải nghiệm người dùng mượt mà.

---

## 🚀 Công Nghệ Sử Dụng

### Frontend
- **React 18** & **Vite 8**: Đảm bảo tốc độ render và hot-reload cực nhanh.
- **Tailwind CSS 4**: Thiết kế giao diện hiện đại, responsive hoàn toàn trên Mobile và Desktop.
- **DOMPurify**: Bảo mật chống tấn công chèn mã độc (XSS).

### Backend
- **Spring Boot 3.5.16** (Java 21): Framework backend mạnh mẽ và bảo mật.
- **Spring Security** & **JWT (JSON Web Token)**: Hệ thống xác thực và phân quyền (Admin & Customer).
- **Spring Data JPA** & **Hibernate 6**: Quản trị cơ sở dữ liệu quan hệ một cách tối ưu.

### Database
- **PostgreSQL / MySQL**: Hệ thống lưu trữ dữ liệu bền vững, hỗ trợ lưu trữ kiểu JSON nguyên bản.

---

## 🛠️ Các Cải Tiến Quan Trọng Gần Đây

Dự án đã được nâng cấp chuyên sâu để giải quyết các vấn đề về bảo mật và hiệu năng:

1. **Vá lỗi bảo mật XSS**: Tích hợp cơ chế lọc dữ liệu đầu vào và làm sạch mã HTML của mô tả sản phẩm thông qua thư viện `DOMPurify` trước khi render lên UI.
2. **Khắc phục lỗi N+1 Query**: Chuyển đổi toàn bộ cơ chế Fetch dữ liệu quan hệ từ `EAGER` sang `LAZY` trên các Entity chính (`Product`, `Order`, `OrderItem`, `Customer`). Tích hợp `@EntityGraph` để nạp dữ liệu liên quan tối ưu chỉ trong 1 câu truy vấn `JOIN FETCH`.
3. **Chặn lỗi nghẽn cổ chai (Deadlock)**: Cải tiến logic đặt hàng trong `OrderService` bằng cách tự động sắp xếp sản phẩm/biến thể theo ID tăng dần trước khi thực hiện Khóa bi quan (`Pessimistic Lock`), triệt tiêu hoàn toàn khả năng xảy ra deadlock khi nhiều người đặt hàng đồng thời.
4. **Tích hợp Refresh Token**: Phát triển cơ chế gia hạn phiên đăng nhập thông qua Refresh Token an toàn. Phía Frontend tự động đánh chặn lỗi `401` để xin cấp lại Access Token mới ngầm dưới nền giúp người dùng không bị gián đoạn trải nghiệm.
5. **Tối ưu hóa lưu trữ mảng (JSON Mapping)**: Sử dụng `@JdbcTypeCode(SqlTypes.JSON)` lưu trực tiếp danh sách chuỗi (như ảnh bổ sung, điểm nổi bật sản phẩm) dưới dạng JSON trong DB thay vì phải chuyển đổi thủ công sang text, tăng tốc độ xử lý I/O DB.

---

## 💻 Hướng Dẫn Cài Đặt và Khởi Chạy

### 1. Cấu hình Cơ sở dữ liệu
Import file script SQL khởi tạo dữ liệu vào DB của bạn:
- Đường dẫn file: `thinktank_full_setup.sql`

### 2. Chạy Backend (Spring Boot)
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend/thinktank
   ```
2. Thiết lập biến môi trường (không lưu secret vào Git):
   ```bash
   export JWT_SECRET="$(openssl rand -base64 48)"
   export AUTH_SECURE_COOKIE=false # chỉ dùng khi chạy HTTP local
   # Tuỳ chọn: tạo admin một lần khi DB chưa có tài khoản này
   export ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
   export ADMIN_BOOTSTRAP_PASSWORD="mat-khau-manh-toi-thieu-12-ky-tu"
   ```
   Khi production, bật profile `prod`, đặt `AUTH_SECURE_COOKIE=true`, chỉ nhận forwarded headers qua reverse proxy tin cậy và dùng `DB_URL` có TLS, ví dụ `useSSL=true&requireSSL=true&verifyServerCertificate=true`.
3. Khởi chạy ứng dụng bằng Maven:
   ```bash
   ./mvnw spring-boot:run
   ```

### 3. Chạy Frontend (React + Vite)
1. Di chuyển vào thư mục gốc dự án:
   ```bash
   cd ../..
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo `.env` từ `.env.example`; đặt `VITE_SUPPORT_EMAIL` nếu muốn hiển thị email hỗ trợ công khai.
4. Khởi chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
5. Truy cập website tại địa chỉ local: `http://localhost:5173`

---

## 👥 Phân Quyền Người Dùng
- **Khách hàng (Customer)**: Xem danh sách balo máy ảnh, bộ lọc sản phẩm, chi tiết sản phẩm, giỏ hàng, đặt hàng, theo dõi trạng thái đơn hàng và lịch sử mua sắm cá nhân.
- **Quản trị viên (Admin)**: Quản lý Dashboard thống kê, danh sách sản phẩm (CRUD kèm biến thể màu sắc/kích thước), quản lý đơn hàng (cập nhật trạng thái), danh sách khách hàng và các đánh giá từ người dùng.
