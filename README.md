# Balomayanh · Online Store

Nền tảng thương mại điện tử chuyên về balo, vali và phụ kiện máy ảnh. Dự án gồm storefront cho khách hàng và trang quản trị cho vận hành sản phẩm, đơn hàng, khách hàng và đánh giá.

## Tổng quan

- **Khách hàng:** duyệt sản phẩm, tìm kiếm/lọc, giỏ hàng, thanh toán, theo dõi đơn hàng và quản lý tài khoản.
- **Quản trị viên:** dashboard, CRUD sản phẩm/biến thể, quản lý khách hàng, duyệt trạng thái đơn hàng, đánh giá và xuất báo cáo.
- **Bảo mật:** Spring Security, JWT access/refresh token, phân quyền ADMIN/CUSTOMER, chuẩn hóa dữ liệu đầu vào và bảo vệ nội dung HTML.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS, Axios, React Router |
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA, Hibernate |
| Database | MySQL 8+ và Flyway migrations |
| Kiểm thử | Maven Surefire, Spring Boot Test, ESLint, Vite production build |

## Cấu trúc dự án

```text
.
├── src/                         # React storefront và admin UI
├── public/                      # Tài nguyên tĩnh
├── backend/thinktank/           # Spring Boot API
│   └── src/main/resources/db/   # Flyway migrations
├── thinktank_full_setup.sql     # Schema và dữ liệu khởi tạo
└── .env.example                 # Mẫu biến môi trường frontend
```

## Yêu cầu

- Node.js 20+
- Java 21+
- MySQL 8+
- Maven Wrapper đi kèm trong `backend/thinktank`

## Cài đặt và chạy local

### 1. Database

Tạo database rồi import `thinktank_full_setup.sql`:

```sql
CREATE DATABASE thinktank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend/thinktank
export DB_URL='jdbc:mysql://localhost:3306/thinktank?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
export DB_USERNAME='root'
export DB_PASSWORD='your-password'
export JWT_SECRET="$(openssl rand -base64 48)"
export AUTH_SECURE_COOKIE=false # chỉ dùng cho HTTP local
./mvnw spring-boot:run
```

API mặc định chạy tại `http://localhost:8080`.

Muốn tạo tài khoản admin ban đầu, đặt thêm `ADMIN_BOOTSTRAP_EMAIL` và `ADMIN_BOOTSTRAP_PASSWORD` khi khởi động backend. Không commit các giá trị này vào Git.

### 3. Frontend

```bash
cd ../..
npm install
cp .env.example .env
npm run dev
```

Frontend chạy tại `http://localhost:5173`. Đặt `VITE_API_URL` trong `.env` nếu API không chạy ở địa chỉ mặc định.

## Kiểm tra chất lượng

```bash
# Frontend
npm run lint
npm run build

# Backend
cd backend/thinktank
./mvnw test
```

## Migration và triển khai

Flyway tự động áp dụng migration khi backend khởi động. Production nên dùng profile `prod`, bật HTTPS và `AUTH_SECURE_COOKIE=true`; các secret như JWT, database password và thông tin bootstrap admin phải được cấp qua secret manager hoặc biến môi trường.

## Giấy phép

Dự án nội bộ Balomayanh. Không phát hành lại hoặc sử dụng thương mại nếu chưa có sự cho phép của chủ sở hữu.
