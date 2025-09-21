const moment = require("moment");

// Login Page Template
function generateLoginPage(error = "") {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body class="login-body">
    <div class="login-container">
        <div class="login-header">
            <div class="logo-section">
                <h1>BIDV</h1>
                <h2>INTRANET PORTAL</h2>
            </div>
            <p>Hệ thống quản lý tài liệu nội bộ</p>
        </div>

        <form class="login-form" action="/login" method="POST">
            ${error ? `<div class="error-message">${error}</div>` : ""}

            <div class="form-group">
                <label for="username">Tên đăng nhập</label>
                <input type="text" id="username" name="username" required>
            </div>

            <div class="form-group">
                <label for="password">Mật khẩu</label>
                <input type="password" id="password" name="password" required>
            </div>

            <button type="submit" class="login-btn">Đăng nhập</button>
        </form>

        <div class="login-footer">
            <p>© 2024 Ngân hàng TMCP Đầu tư và Phát triển Việt Nam</p>
            <p><small>Phiên bản 1.0 - Chỉ dành cho nội bộ</small></p>
        </div>
    </div>
</body>
</html>
  `;
}

// Navigation Component
function generateNavigation(session, currentPage = "") {
  return `
    <nav class="main-nav">
      <div class="nav-left">
        <h1 class="system-title">BIDV Intranet Portal</h1>
      </div>
      <div class="nav-center">
        <a href="/" class="nav-link ${
          currentPage === "home" ? "active" : ""
        }">Trang chủ</a>
        <a href="/upload" class="nav-link ${
          currentPage === "upload" ? "active" : ""
        }">Đăng bài</a>
        ${
          session.userRole === "admin"
            ? `
          <a href="/admin" class="nav-link ${
            currentPage === "admin" ? "active" : ""
          }">Quản trị</a>
          <a href="/users" class="nav-link ${
            currentPage === "users" ? "active" : ""
          }">Người dùng</a>
        `
            : ""
        }
      </div>
      <div class="nav-right">
        <span class="user-info">
          <span class="user-name">${session.userName}</span>
          <span class="user-role">(${
            session.userRole === "admin" ? "Quản trị viên" : "Người dùng"
          })</span>
        </span>
        <form action="/logout" method="POST" style="display: inline;">
          <button type="submit" class="logout-btn">Đăng xuất</button>
        </form>
      </div>
    </nav>
  `;
}

// Home Page Template
function generateHomePage(posts, announcement, session) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trang chủ - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "home")}

    <div class="container">
        ${
          announcement
            ? `
        <div class="announcement">
            <h3>📢 Thông báo quan trọng</h3>
            <p>${announcement}</p>
        </div>
        `
            : ""
        }

        <main class="main-content">
            <div class="page-header">
                <h2>Danh sách tài liệu gần đây</h2>
                <div class="page-actions">
                    <a href="/upload" class="btn btn-primary">+ Đăng tài liệu mới</a>
                </div>
            </div>

            ${
              posts.length === 0
                ? '<div class="no-posts">Chưa có tài liệu nào được đăng.</div>'
                : ""
            }

            <div class="posts-list">
                ${posts
                  .map(
                    (post) => `
                <div class="post-item">
                    <div class="post-header">
                        <div class="post-info">
                            <h3 class="post-title">${post.title}</h3>
                            <div class="post-meta">
                                <span class="post-author">Đăng bởi: ${
                                  post.author_name || "Không xác định"
                                }</span>
                                <span class="post-date">${moment(
                                  post.created_at
                                ).format("DD/MM/YYYY HH:mm")}</span>
                                <span class="post-type ${post.type}">${
                      post.type === "announcement" ? "Thông báo" : "Tài liệu"
                    }</span>
                            </div>
                        </div>
                        <div class="post-actions">
                            ${
                              session.userRole === "admin" ||
                              post.user_id === session.userId
                                ? `
                                <a href="/edit/${post.id}" class="btn btn-sm">Sửa</a>
                            `
                                : ""
                            }
                            <a href="/history/${
                              post.id
                            }" class="btn btn-sm">Lịch sử</a>
                            ${
                              session.userRole === "admin"
                                ? `
                                <button onclick="deletePost(${post.id})" class="btn btn-sm btn-danger">Xóa</button>
                            `
                                : ""
                            }
                        </div>
                    </div>

                    ${
                      post.content
                        ? `<div class="post-content">${post.content}</div>`
                        : ""
                    }

                    ${
                      post.file_name
                        ? `
                    <div class="file-attachment">
                        <div class="file-info">
                            <span class="file-icon">📎</span>
                            <span class="file-name">${post.file_name}</span>
                            <span class="file-size">(${
                              post.file_size
                                ? (post.file_size / (1024 * 1024)).toFixed(2)
                                : "0"
                            } MB)</span>
                        </div>
                        <a href="/download/${
                          post.id
                        }" class="btn btn-sm btn-download">Tải về</a>
                    </div>
                    `
                        : ""
                    }
                </div>
                `
                  )
                  .join("")}
            </div>
        </main>
    </div>

    <script>
        function deletePost(id) {
            if (confirm('Bạn có chắc muốn xóa tài liệu này?')) {
                fetch('/delete/' + id, { method: 'POST' })
                    .then(() => location.reload());
            }
        }
    </script>
</body>
</html>
  `;
}

// Upload Page Template
function generateUploadPage(session) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng tài liệu - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "upload")}

    <div class="container">
        <main class="main-content">
            <div class="page-header">
                <h2>Đăng tài liệu mới</h2>
            </div>

            <form action="/upload" method="POST" enctype="multipart/form-data" class="upload-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="title">Tiêu đề tài liệu *</label>
                        <input type="text" id="title" name="title" required placeholder="Nhập tiêu đề tài liệu...">
                    </div>

                    <div class="form-group">
                        <label for="type">Loại tài liệu</label>
                        <select id="type" name="type">
                            <option value="post">Tài liệu thường</option>
                            <option value="announcement">Thông báo</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="content">Mô tả nội dung</label>
                    <textarea id="content" name="content" rows="4" placeholder="Nhập mô tả nội dung tài liệu (tùy chọn)..."></textarea>
                </div>

                <div class="form-group">
                    <label for="file">File đính kèm</label>
                    <input type="file" id="file" name="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar">
                    <small>Hỗ trợ: PDF, DOC, DOCX, TXT, hình ảnh, file nén (tối đa 50MB)</small>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Đăng tài liệu</button>
                    <a href="/" class="btn btn-secondary">Hủy</a>
                </div>
            </form>
        </main>
    </div>
</body>
</html>
  `;
}

// Admin Page Template
function generateAdminPage(announcement, session) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản trị - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "admin")}

    <div class="container">
        <main class="main-content">
            <div class="page-header">
                <h2>Quản trị hệ thống</h2>
            </div>

            <div class="admin-section">
                <h3>Cấu hình thông báo</h3>
                <p>Thông báo này sẽ hiển thị ở đầu trang chủ cho tất cả người dùng.</p>

                <form action="/admin/announcement" method="POST" class="admin-form">
                    <div class="form-group">
                        <label for="announcement">Nội dung thông báo</label>
                        <textarea id="announcement" name="announcement" rows="4"
                                  placeholder="Nhập thông báo quan trọng...">${announcement}</textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Lưu thông báo</button>
                    </div>
                </form>
            </div>

            <div class="system-info">
                <h3>Thông tin hệ thống</h3>
                <table class="info-table">
                    <tr><td>Database:</td><td>SQLite (intranet.db)</td></tr>
                    <tr><td>Upload folder:</td><td>uploads/</td></tr>
                    <tr><td>Giới hạn file:</td><td>50MB</td></tr>
                    <tr><td>Server:</td><td>Node.js + Express</td></tr>
                </table>
            </div>
        </main>
    </div>
</body>
</html>
  `;
}

// Users Management Page Template
function generateUsersPage(users, session) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản lý người dùng - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "users")}

    <div class="container">
        <main class="main-content">
            <div class="page-header">
                <h2>Quản lý người dùng</h2>
                <div class="page-actions">
                    <button onclick="showAddUserForm()" class="btn btn-primary">+ Thêm người dùng</button>
                </div>
            </div>

            <!-- Add User Form (Hidden by default) -->
            <div id="addUserForm" class="add-user-form" style="display: none;">
                <h3>Thêm người dùng mới</h3>
                <form action="/users/add" method="POST">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="username">Tên đăng nhập *</label>
                            <input type="text" id="username" name="username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Mật khẩu *</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="full_name">Họ và tên *</label>
                            <input type="text" id="full_name" name="full_name" required>
                        </div>
                        <div class="form-group">
                            <label for="role">Vai trò</label>
                            <select id="role" name="role">
                                <option value="user">Người dùng</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="can_post" value="1" checked>
                            Được phép đăng tài liệu
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Tạo người dùng</button>
                        <button type="button" onclick="hideAddUserForm()" class="btn btn-secondary">Hủy</button>
                    </div>
                </form>
            </div>

            <!-- Users Table -->
            <div class="users-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên đăng nhập</th>
                            <th>Họ và tên</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Quyền đăng bài</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users
                          .map(
                            (user) => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.full_name}</td>
                            <td><span class="role-badge ${user.role}">${
                              user.role === "admin"
                                ? "Quản trị viên"
                                : "Người dùng"
                            }</span></td>
                            <td><span class="status-badge ${user.status}">${
                              user.status === "active"
                                ? "Hoạt động"
                                : "Tạm khóa"
                            }</span></td>
                            <td>${user.can_post ? "Có" : "Không"}</td>
                            <td>${moment(user.created_at).format(
                              "DD/MM/YYYY"
                            )}</td>
                            <td>
                                <form action="/users/toggle/${
                                  user.id
                                }" method="POST" style="display: inline;">
                                    <button type="submit" class="btn btn-sm ${
                                      user.status === "active"
                                        ? "btn-warning"
                                        : "btn-success"
                                    }">
                                        ${
                                          user.status === "active"
                                            ? "Khóa"
                                            : "Mở khóa"
                                        }
                                    </button>
                                </form>
                            </td>
                        </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <script>
        function showAddUserForm() {
            document.getElementById('addUserForm').style.display = 'block';
        }

        function hideAddUserForm() {
            document.getElementById('addUserForm').style.display = 'none';
        }
    </script>
</body>
</html>
  `;
}

// Edit Post Page Template
function generateEditPage(post, session) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chỉnh sửa tài liệu - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session)}

    <div class="container">
        <main class="main-content">
            <div class="page-header">
                <h2>Chỉnh sửa tài liệu</h2>
            </div>

            <form action="/edit/${post.id}" method="POST" class="edit-form">
                <div class="form-group">
                    <label for="title">Tiêu đề tài liệu *</label>
                    <input type="text" id="title" name="title" value="${
                      post.title
                    }" required>
                </div>

                <div class="form-group">
                    <label for="content">Mô tả nội dung</label>
                    <textarea id="content" name="content" rows="6">${
                      post.content || ""
                    }</textarea>
                </div>

                ${
                  post.file_name
                    ? `
                <div class="current-file">
                    <h4>File hiện tại:</h4>
                    <div class="file-info">
                        <span class="file-icon">📎</span>
                        <span class="file-name">${post.file_name}</span>
                        <a href="/download/${post.id}" class="btn btn-sm">Tải về</a>
                    </div>
                    <p><small>Lưu ý: Không thể thay đổi file đính kèm khi chỉnh sửa</small></p>
                </div>
                `
                    : ""
                }

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                    <a href="/" class="btn btn-secondary">Hủy</a>
                    <a href="/history/${
                      post.id
                    }" class="btn btn-info">Xem lịch sử</a>
                </div>
            </form>
        </main>
    </div>
</body>
</html>
  `;
}

// History Page Template
function generateHistoryPage(post, history, session) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lịch sử chỉnh sửa - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session)}

    <div class="container">
        <main class="main-content">
            <div class="page-header">
                <h2>Lịch sử chỉnh sửa: ${post.title}</h2>
                <div class="page-actions">
                    <a href="/" class="btn btn-secondary">Quay lại</a>
                </div>
            </div>

            ${
              history.length === 0
                ? '<div class="no-history">Chưa có lịch sử chỉnh sửa nào.</div>'
                : `<div class="history-list">
                    ${history
                      .map(
                        (item) => `
                    <div class="history-item">
                        <div class="history-header">
                            <span class="editor-name">Chỉnh sửa bởi: ${
                              item.editor_name || "Không xác định"
                            }</span>
                            <span class="edit-date">${moment(
                              item.edited_at
                            ).format("DD/MM/YYYY HH:mm:ss")}</span>
                        </div>
                        <div class="history-changes">
                            <div class="change-section">
                                <h4>Tiêu đề:</h4>
                                <div class="change-diff">
                                    <div class="old-value">Cũ: ${
                                      item.old_title
                                    }</div>
                                    <div class="new-value">Mới: ${
                                      item.new_title
                                    }</div>
                                </div>
                            </div>
                            ${
                              item.old_content !== item.new_content
                                ? `
                            <div class="change-section">
                                <h4>Nội dung:</h4>
                                <div class="change-diff">
                                    <div class="old-value">Cũ: ${
                                      item.old_content || "(Trống)"
                                    }</div>
                                    <div class="new-value">Mới: ${
                                      item.new_content || "(Trống)"
                                    }</div>
                                </div>
                            </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    `
                      )
                      .join("")}
                </div>`
            }
        </main>
    </div>
</body>
</html>
  `;
}

// No Permission Page Template
function generateNoPermissionPage(
  session,
  message = "Bạn không có quyền truy cập trang này!"
) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Không có quyền - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session)}

    <div class="container">
        <main class="main-content">
            <div class="no-permission-container">
                <div class="no-permission-icon">
                    🚫
                </div>
                <h2>Không có quyền truy cập</h2>
                <p class="no-permission-message">${message}</p>

                <div class="no-permission-info">
                    <h4>Thông tin tài khoản của bạn:</h4>
                    <ul>
                        <li><strong>Tên:</strong> ${session.userName}</li>
                        <li><strong>Vai trò:</strong> ${
                          session.userRole === "admin"
                            ? "Quản trị viên"
                            : "Người dùng"
                        }</li>
                        <li><strong>Trạng thái:</strong> Đang hoạt động</li>
                    </ul>
                </div>

                <div class="no-permission-actions">
                    <a href="/" class="btn btn-primary">Quay về trang chủ</a>
                    ${
                      session.userRole === "admin"
                        ? `
                        <a href="/users" class="btn btn-secondary">Quản lý người dùng</a>
                    `
                        : `
                        <p class="contact-admin">Vui lòng liên hệ quản trị viên để được cấp quyền đăng bài.</p>
                    `
                    }
                </div>
            </div>
        </main>
    </div>
</body>
</html>
  `;
}

module.exports = {
  generateLoginPage,
  generateHomePage,
  generateUploadPage,
  generateAdminPage,
  generateUsersPage,
  generateEditPage,
  generateHistoryPage,
  generateNoPermissionPage,
};
