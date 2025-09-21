# 🏢 BIDV Intranet Portal - Hệ Thống Quản Lý Tài Liệu Nội Bộ

Portal nội bộ chuyên nghiệp dành cho ngân hàng BIDV, hỗ trợ quản lý tài liệu và thông tin nội bộ.

## ✨ Tính Năng Chính

### 🔐 **Hệ Thống Đăng Nhập**

- Xác thực người dùng với session
- Phân quyền Admin/User
- Quản lý trạng thái tài khoản

### 👥 **Quản Lý Người Dùng** (Admin)

- Thêm/xóa/khóa tài khoản người dùng
- Phân quyền đăng bài
- Quản lý vai trò (Admin/User)

### 📂 **Quản Lý Tài Liệu**

- Upload file: PDF, DOC, DOCX, TXT, hình ảnh, file nén (tối đa 50MB)
- Đăng bài với nội dung và file đính kèm
- Chỉnh sửa tiêu đề và mô tả sau khi đăng
- Lưu lịch sử chỉnh sửa chi tiết

### 🏠 **Trang Chủ**

- Hiển thị danh sách tài liệu mới nhất
- Thông tin người đăng và thời gian
- Tải file trực tiếp

### 🔔 **Thông Báo Hệ Thống**

- Admin cấu hình thông báo quan trọng
- Hiển thị nổi bật trên trang chủ

### 🎨 **Giao Diện**

- Thiết kế theo phong cách ngân hàng truyền thống
- Màu sắc chuyên nghiệp (xanh navy, trắng, xám)
- Responsive, tương thích mobile

## 🚀 Cài Đặt & Chạy

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Chạy server

```bash
npm start
```

Hoặc chạy trực tiếp:

```bash
node server.js
```

### Bước 3: Truy cập

Mở trình duyệt và vào: <http://localhost:3000>

## 📁 Cấu Trúc Project

```
intranet-portal/
├── server.js          # Server chính
├── package.json       # Dependencies
├── intranet.db        # SQLite database (tự tạo)
├── uploads/           # Thư mục chứa file upload (tự tạo)
├── public/
│   └── styles.css     # CSS styles
└── README.md          # Hướng dẫn này
```

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js + Express.js
- **Authentication**: Express-session + bcryptjs
- **Database**: SQLite3 (với tables: users, posts, post_history, settings)
- **Upload**: Multer
- **Frontend**: HTML5 + CSS3 + Vanilla JS
- **UI**: Corporate banking design, responsive

## 📋 Routes

### Authentication

- `GET /login` - Trang đăng nhập
- `POST /login` - Xử lý đăng nhập
- `POST /logout` - Đăng xuất

### Main Features

- `GET /` - Trang chủ (danh sách tài liệu)
- `GET /upload` - Trang đăng tài liệu
- `POST /upload` - Xử lý upload
- `GET /download/:id` - Tải file
- `POST /delete/:id` - Xóa tài liệu

### Post Management

- `GET /edit/:id` - Trang chỉnh sửa tài liệu
- `POST /edit/:id` - Lưu chỉnh sửa
- `GET /history/:id` - Xem lịch sử chỉnh sửa

### Admin Features

- `GET /admin` - Trang quản trị
- `POST /admin/announcement` - Cập nhật thông báo
- `GET /users` - Quản lý người dùng
- `POST /users/add` - Thêm người dùng
- `POST /users/toggle/:id` - Khóa/mở khóa tài khoản

## 🔧 Cấu Hình

### Thay đổi port

Sửa trong `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

### Thay đổi giới hạn file

Sửa trong `server.js`:

```javascript
limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
}
```

### Thêm loại file mới

Sửa `fileFilter` trong `server.js`:

```javascript
const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|gif|zip|rar|xlsx/;
```

## 🎯 Hướng Dẫn Sử Dụng

### 🔑 Đăng Nhập

1. Truy cập <http://localhost:3000>
2. Đăng nhập với tài khoản:
   - **Admin**: username `admin`, password `admin123`
   - **User**: Được tạo bởi Admin

### 📝 Đăng Tài Liệu

1. Vào trang "Đăng bài"
2. Nhập tiêu đề và mô tả
3. Chọn loại (Tài liệu thường/Thông báo)
4. Đính kèm file (tùy chọn)
5. Click "Đăng tài liệu"

### ✏️ Chỉnh Sửa

1. Click nút "Sửa" trên tài liệu của bạn
2. Thay đổi tiêu đề/mô tả
3. Lưu thay đổi (lịch sử sẽ được ghi lại)

### 👥 Quản Lý User (Admin)

1. Vào trang "Người dùng"
2. Click "Thêm người dùng" để tạo tài khoản mới
3. Cấu hình quyền đăng bài và vai trò
4. Khóa/mở khóa tài khoản khi cần

### 📢 Cấu Hình Thông Báo (Admin)

1. Vào trang "Quản trị"
2. Nhập nội dung thông báo
3. Lưu - thông báo sẽ hiển thị trên trang chủ

## 🔒 Bảo Mật

- File upload được kiểm tra loại và kích thước
- SQL injection được ngăn chặn bằng prepared statements
- Path traversal được ngăn chặn

## 🐛 Troubleshooting

### Lỗi "Cannot find module"

```bash
npm install
```

### Lỗi permission denied

```bash
chmod +x server.js
```

### Database locked

Đóng tất cả kết nối database và restart server

## 📞 Hỗ Trợ

- Kiểm tra console log để debug
- Database file: `intranet.db`
- Upload folder: `uploads/`
- Port mặc định: 3000

---

🎉 **Chúc bạn sử dụng vui vẻ!**
