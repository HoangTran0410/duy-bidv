const moment = require("moment");

// Exchange rates data (normally this would come from an API)
function getExchangeRates() {
  return [
    {
      code: "USD",
      buy: "25,140",
      sell: "25,140",
      transfer: "25,500",
      flag: "🇺🇸",
    },
    { code: "USD-HM-2H", buy: "25,090", sell: "0", transfer: "0", flag: "🇺🇸" },
    { code: "USD-M-5-9", buy: "25,090", sell: "0", transfer: "0", flag: "🇺🇸" },
    {
      code: "EUR",
      buy: "30,195",
      sell: "30,239",
      transfer: "31,430",
      flag: "🇪🇺",
    },
    {
      code: "GBP",
      buy: "35,038",
      sell: "35,131",
      transfer: "36,021",
      flag: "🇬🇧",
    },
    { code: "HKD", buy: "3,212", sell: "3,232", transfer: "3,322", flag: "🇭🇰" },
    {
      code: "CHF",
      buy: "29,160",
      sell: "32,580",
      transfer: "33,564",
      flag: "🇨🇭",
    },
    {
      code: "JPY",
      buy: "178,13",
      sell: "178,43",
      transfer: "182,8",
      flag: "🇯🇵",
    },
    {
      code: "THB",
      buy: "768,82",
      sell: "779,12",
      transfer: "812,47",
      flag: "🇹🇭",
    },
    {
      code: "AUD",
      buy: "16,208",
      sell: "16,769",
      transfer: "17,326",
      flag: "🇦🇺",
    },
    {
      code: "CAD",
      buy: "18,457",
      sell: "18,717",
      transfer: "19,254",
      flag: "🇨🇦",
    },
    {
      code: "SGD",
      buy: "20,084",
      sell: "20,146",
      transfer: "20,819",
      flag: "🇸🇬",
    },
    { code: "KRW", buy: "0", sell: "2,684", transfer: "2,767", flag: "🇰🇷" },
    { code: "LAK", buy: "0", sell: "0,93", transfer: "1,29", flag: "🇱🇦" },
    { code: "DKK", buy: "0", sell: "4,034", transfer: "4,173", flag: "🇩🇰" },
  ];
}

// Generate exchange rates widget
function generateExchangeRatesWidget() {
  const rates = getExchangeRates();
  const currentDate = moment().format("DD/MM/YYYY");

  return `
    <div class="exchange-rates">
      <div class="rates-header">
        BẢNG TỶ GIÁ NGOẠI TỆ
      </div>
      <div class="rates-date">
        Thông báo lần 1 - ngày: ${currentDate}
      </div>
      <table class="rates-table">
        <thead>
          <tr>
            <th>Mã ngoại tệ<br>Currency</th>
            <th>Mua TM<br>Cash</th>
            <th>Mua CK<br>Transfer/Cheque</th>
            <th>Bán<br>Selling</th>
          </tr>
        </thead>
        <tbody>
          ${rates
            .map(
              (rate) => `
            <tr>
              <td>
                <span class="currency-flag">${rate.flag}</span>
                <span class="currency-code">${rate.code}</span>
              </td>
              <td class="rate-value">${rate.buy}</td>
              <td class="rate-value">${rate.sell}</td>
              <td class="rate-value">${rate.transfer}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

// Generate category dropdown menu
function generateCategoryDropdown(categories, selectedCategory = null) {
  return `
    <div class="dropdown" id="categoryDropdown">
      <button class="dropdown-toggle" onclick="toggleDropdown('categoryDropdown')">
        Danh mục
      </button>
      <div class="dropdown-menu">
        <a href="/?category=" class="dropdown-item ${
          !selectedCategory ? "active" : ""
        }">
          <span class="category-icon">📋</span>
          <span class="category-name">Tất cả</span>
          <span class="category-count"></span>
        </a>
        ${categories
          .map(
            (category) => `
          <a href="/?category=${category.id}" class="dropdown-item ${
              selectedCategory == category.id ? "active" : ""
            }">
            <span class="category-icon">${category.icon}</span>
            <span class="category-name">${category.name}</span>
            <span class="category-count">${category.post_count || 0}</span>
          </a>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

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
function generateNavigation(session, currentPage = "", categories = []) {
  return `
    <header class="bidv-header">
      <div class="bidv-header-content">
        <div class="bidv-logo-section">
          <div class="bidv-logo">BIDV</div>
          <div>
            <div class="bank-name">NGÂN HÀNG TMCP ĐẦU TƯ VÀ PHÁT TRIỂN VIỆT NAM</div>
            <div class="branch-name">CN QUẬN 7 SÀI GÒN</div>
          </div>
        </div>
        <div class="header-right">
          <div class="search-box">
            <input type="text" placeholder="Tìm tài liệu, văn bản..." style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; width: 250px;">
          </div>
        </div>
      </div>
    </header>
    <nav class="main-nav">
      <div class="main-nav-content">
        <div class="nav-left">
          <a href="/" class="nav-link ${
            currentPage === "home" ? "active" : ""
          }">Trang chủ</a>
          <a href="/upload" class="nav-link ${
            currentPage === "upload" ? "active" : ""
          }">Đăng bài</a>
          ${generateCategoryDropdown(categories)}
          ${
            session.userRole === "admin"
              ? `
            <a href="/admin" class="nav-link ${
              currentPage === "admin" ? "active" : ""
            }">Cấu hình</a>
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
      </div>
    </nav>
    <script>
      function toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        dropdown.classList.toggle('active');

        // Close other dropdowns
        document.querySelectorAll('.dropdown').forEach(d => {
          if (d.id !== dropdownId) {
            d.classList.remove('active');
          }
        });
      }

      // Close dropdowns when clicking outside
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
          document.querySelectorAll('.dropdown').forEach(d => {
            d.classList.remove('active');
          });
        }
      });
    </script>
  `;
}

// Home Page Template
function generateHomePage(posts, announcement, session, categories = []) {
  const currentPage = 1;
  const totalPages = Math.ceil(posts.length / 5);
  const displayPosts = posts.slice(0, 5); // Show only first 5 posts

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
    ${generateNavigation(session, "home", categories)}

    <div class="container">
        <main class="main-content">
            <div class="content-left">
                <div class="news-section">
                    <div class="section-header">
                        THÔNG TIN NỘI BẬT
                    </div>

                    ${
                      announcement
                        ? `
                    <div class="announcement" style="margin: 0 0 20px 0; background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px;">
                        <strong>📢 Thông báo quan trọng:</strong> ${announcement}
                    </div>
                    `
                        : ""
                    }

                    <div class="news-count">${posts.length} item</div>

                    <ul class="news-list">
                        ${displayPosts
                          .map(
                            (post) => `
                        <li class="news-item">
                            <div class="news-icon">${
                              post.category_icon || "📰"
                            }</div>
                            <div class="news-content">
                                <a href="/post/${post.id}" class="news-title">${
                              post.title
                            }</a>
                                <div class="news-meta">
                                    <span class="news-author">${
                                      post.author_name || "Không xác định"
                                    }</span>
                                    <span class="news-date">Ngày đăng tài: ${moment(
                                      post.created_at
                                    ).format("DD/MM/YYYY")}</span>
                                    <span class="news-views">👁 ${
                                      post.view_count || 0
                                    } lượt xem</span>
                                    ${
                                      post.category_name
                                        ? `<span class="news-category">${
                                            post.category_icon || "📋"
                                          } ${post.category_name}</span>`
                                        : ""
                                    }
                                </div>
                                ${
                                  post.content
                                    ? `<div style="margin-top: 8px; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">${post.content.substring(
                                        0,
                                        100
                                      )}${
                                        post.content.length > 100 ? "..." : ""
                                      }</div>`
                                    : ""
                                }
                                ${
                                  post.file_name
                                    ? `
                                <div style="margin-top: 8px; display: flex; gap: 10px; align-items: center;">
                                    <span style="font-size: 12px; color: var(--text-secondary);">📎 ${
                                      post.file_name
                                    }</span>
                                    <a href="/download/${
                                      post.id
                                    }" style="font-size: 12px; color: var(--bidv-green); text-decoration: none;">Tải về</a>
                                     ${
                                       session.userRole === "admin" ||
                                       post.user_id === session.userId
                                         ? `<a href="/edit/${post.id}" style="font-size: 12px; color: var(--bidv-green); text-decoration: none;">Sửa</a>`
                                         : ""
                                     }
                                     ${
                                       session.userRole === "admin"
                                         ? `<button onclick="deletePost(${post.id})" style="font-size: 12px; color: #dc3545; background: none; border: none; cursor: pointer;">Xóa</button>`
                                         : ""
                                     }
                                </div>
                                `
                                    : `
                                <div style="margin-top: 8px; display: flex; gap: 10px;">
                                    ${
                                      session.userRole === "admin" ||
                                      post.user_id === session.userId
                                        ? `<a href="/edit/${post.id}" style="font-size: 12px; color: var(--bidv-green); text-decoration: none;">Sửa</a>`
                                        : ""
                                    }
                                    <a href="/history/${
                                      post.id
                                    }" style="font-size: 12px; color: var(--bidv-green); text-decoration: none;">Lịch sử</a>
                                    ${
                                      session.userRole === "admin"
                                        ? `<button onclick="deletePost(${post.id})" style="font-size: 12px; color: var(--btn-danger); background: none; border: none; cursor: pointer;">Xóa</button>`
                                        : ""
                                    }
                                </div>
                                `
                                }
                            </div>
                        </li>
                        `
                          )
                          .join("")}
                    </ul>

                    ${
                      posts.length > 5
                        ? `
                    <div class="pagination-container">
                        <div class="pagination">
                            <a href="#" class="disabled">‹</a>
                            <span class="current">1</span>
                            <a href="#">2</a>
                            <a href="#">3</a>
                            <a href="#">4</a>
                            <a href="#">5</a>
                            <span>...</span>
                            <a href="#">45</a>
                            <a href="#">›</a>
                        </div>
                    </div>
                    `
                        : ""
                    }

                    ${
                      posts.length === 0
                        ? '<div style="text-align: center; color: var(--text-secondary); padding: 40px; font-style: italic;">Chưa có tài liệu nào được đăng.</div>'
                        : ""
                    }
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <a href="/upload" style="background: var(--bidv-green); color: var(--text-white); padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">+ Đăng tài liệu mới</a>
                </div>
            </div>

            <div class="content-right">
                ${generateExchangeRatesWidget()}

                <div style="margin-top: 30px;">
                    <div class="section-header">
                        THÔNG TIN CHUNG
                    </div>
                    <div style="padding: 15px 0;">
                        <p style="font-size: 13px; color: #666; line-height: 1.5;">
                            Portal nội bộ dành cho việc chia sẻ tài liệu, thông báo và thông tin quan trọng của ngân hàng.
                        </p>
                        <hr style="margin: 15px 0; border: none; border-top: 1px solid #f0f0f0;">
                        <p style="font-size: 12px; color: #999;">
                            © 2024 Ngân hàng TMCP Đầu tư và Phát triển Việt Nam<br>
                            Chi nhánh Quận 7 Sài Gòn
                        </p>
                    </div>
                </div>
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
function generateUploadPage(session, categories = []) {
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
    ${generateNavigation(session, "upload", categories)}

    <div class="container">
        <main class="normal-main-content">
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
                        <label for="category_id">Danh mục *</label>
                        <select id="category_id" name="category_id" required>
                            <option value="">Chọn danh mục...</option>
                            ${categories
                              .map(
                                (category) => `
                                <option value="${category.id}">${category.icon} ${category.name}</option>
                            `
                              )
                              .join("")}
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
        <main class="normal-main-content">
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
        <main class="normal-main-content">
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
        <main class="user-main-content">
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
        <main class="normal-main-content">
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
        <main class="normal-main-content">
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
