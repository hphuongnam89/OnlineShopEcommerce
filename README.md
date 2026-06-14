# ThinkTank Online Store

Hệ thống cửa hàng trực tuyến bán balo, vali, túi máy ảnh cao cấp của thương hiệu **Think Tank**. Dự án được thiết kế gồm hai phân hệ chính: trang dành cho khách hàng mua sắm (Public Storefront) và trang quản trị hệ thống (Admin Dashboard).

---

## 📌 Các Tính Năng Chính của Dự Án

### 1. Phân hệ Khách hàng (Public Storefront)
*   **Trang chủ & Danh mục**: Hiển thị danh mục sản phẩm (Balo máy ảnh, Vali máy ảnh, Túi máy ảnh...) và các sản phẩm nổi bật.
*   **Chi tiết sản phẩm**: Xem thông tin chi tiết, hình ảnh, thông số kỹ thuật, các biến thể (màu sắc, kích thước) và đánh giá của người dùng.
*   **Giỏ hàng & Thanh toán**: Thêm sản phẩm vào giỏ hàng, áp dụng giảm giá theo hạng thành viên (Bronze, VIP, Silver, Gold, Platinum) và đặt hàng.
*   **Theo dõi đơn hàng**: Kiểm tra trạng thái đơn hàng thời gian thực qua tính năng `Track Order`.
*   **Đăng ký & Đăng nhập**: Hỗ trợ đăng nhập tài khoản khách hàng để thực hiện mua sắm và lưu lại lịch sử.

### 2. Phân hệ Quản trị (Admin Dashboard)
*   **Bảng điều khiển**: Thống kê doanh thu, số lượng khách hàng và báo cáo doanh thu theo tháng dưới dạng biểu đồ trực quan.
*   **Quản lý sản phẩm**: CRUD sản phẩm & biến thể, tích hợp tìm kiếm, phân trang và tính năng xóa mềm (soft delete).
*   **Quản lý đơn hàng**: Theo dõi và cập nhật trạng thái đơn hàng (Pending, Processing, Shipped, Delivered, Cancelled).
*   **Quản lý khách hàng**: Danh sách khách hàng kèm tính năng tìm kiếm, phân hạng thành viên dựa trên tổng mức chi tiêu.
*   **Quản lý đánh giá**: Xem toàn bộ đánh giá từ khách hàng và trả lời hoặc xóa các đánh giá không phù hợp.
*   **Xuất báo cáo**: Hỗ trợ xuất dữ liệu đơn hàng và khách hàng ra file Excel (`.xlsx`).

---

## 🛠️ Công Nghệ Áp Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS 4, React Router 7, Lucide React, Chart.js / Recharts |
| **Backend** | Java 21, Spring Boot 3.5, Spring Security, JWT (Json Web Token), JPA / Hibernate, Apache POI |
| **Database** | MySQL 8.x |

---

## 🚀 Hướng Dẫn Cài Đặt và Khởi Chạy Dự Án

### Yêu cầu hệ thống
*   **Node.js**: Phiên bản 18 hoặc 20 trở lên.
*   **JDK**: Phiên bản 21.
*   **MySQL Server**: Phiên bản 8.0 hoặc cao hơn (Cổng mặc định: `3306`).

---

### Bước 1: Thiết lập Cơ sở dữ liệu (MySQL)
1. Khởi động MySQL Server.
2. Tạo một cơ sở dữ liệu mới tên là `thinktank`:
   ```sql
   CREATE DATABASE thinktank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import file dữ liệu mẫu [thinktank_full_setup.sql](file:///c:/Users/Admin/Downloads/new-shop/new-shop/thinktank_full_setup.sql) vào cơ sở dữ liệu `thinktank` vừa tạo.

---

### Bước 2: Khởi chạy Backend (Spring Boot)
1. Mở terminal và di chuyển vào thư mục backend:
   ```bash
   cd backend/thinktank
   ```
2. Cấu hình thông tin kết nối MySQL trong file [application.properties](file:///c:/Users/Admin/Downloads/new-shop/new-shop/backend/thinktank/src/main/resources/application.properties) (username và password của MySQL trên máy bạn).
3. Chạy ứng dụng bằng Maven Wrapper:
   *   **Windows (PowerShell)**:
       ```powershell
       .\mvnw.cmd spring-boot:run
       ```
   *   **Linux / macOS**:
       ```bash
       ./mvnw spring-boot:run
       ```
4. Backend sẽ chạy tại cổng **`8080`**.

---

### Bước 3: Khởi chạy Frontend (React + Vite)
1. Mở một cửa sổ terminal mới tại thư mục gốc của dự án (`new-shop`).
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Khởi chạy server development:
   ```bash
   npm run dev
   ```
4. Giao diện người dùng sẽ chạy tại: **[http://localhost:5173/](http://localhost:5173/)**

---

## 🔑 Tài Khoản Thử Nghiệm Mặc Định

| Vai trò | Email đăng nhập | Mật khẩu mặc định |
| :--- | :--- | :--- |
| **Admin** | `admin@thinktank.com` | `password` (hoặc `admin123`) |
| **Customer** | `customer@thinktank.com` | `password` (hoặc `customer123`) |
