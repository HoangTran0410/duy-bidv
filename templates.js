const moment = require("moment");

// Markdown Editor Helper Functions
function generateMarkdownEditorIncludes() {
  return `
    <link rel="stylesheet" href="/libs/easymde.min.css">
    <script src="/libs/easymde.min.js"></script>`;
}

function generateMarkdownEditorScript(
  formClass = "upload-form",
  uniqueId = "bidv-content"
) {
  return `
    <script>
        // Initialize EasyMDE markdown editor
        const easyMDE = new EasyMDE({
            element: document.getElementById('content'),
            spellChecker: false,
            placeholder: 'Nhập mô tả nội dung tài liệu (hỗ trợ Markdown)...',
            status: false,
            autosave: {
                enabled: true,
                uniqueId: "${uniqueId}",
                delay: 1000,
            },
        });

        // Ensure the form submits the markdown content
        document.querySelector('.${formClass}').addEventListener('submit', function() {
            document.getElementById('content').value = easyMDE.value();
        });
    </script>`;
}

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
      <button class="dropdown-toggle">
        📋 Danh mục
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
            ${error ? `<div class="login-error-message">${error}</div>` : ""}

            <div class="form-group">
                <label for="username">Tên đăng nhập</label>
                <input type="text" id="username" name="username" required>
            </div>

            <div class="form-group">
                <label for="password">Mật khẩu</label>
                <input type="password" id="password" name="password" required>
            </div>

            <div class="form-group remember-me">
                <label class="remember-checkbox">
                    <input type="checkbox" name="remember_me" value="1">
                    <span class="checkmark"></span>
                    Ghi nhớ đăng nhập (30 ngày)
                </label>
            </div>

            <button type="submit" class="login-btn">🔑 Đăng nhập</button>
        </form>

        <div class="login-footer">
            <p>© 2025 Ngân hàng TMCP Đầu tư và Phát triển Việt Nam</p>
            <p><small>Phiên bản 1.0 - Chỉ dành cho nội bộ</small></p>
        </div>
    </div>
</body>
</html>
  `;
}

// Footer Component
function generateFooter() {
  return `
    <footer class="bidv-footer">
      <div class="footer-content">
        <div class="footer-info">
          <div class="footer-logo">
            <div class="footer-bank-name">NGÂN HÀNG TMCP ĐẦU TƯ VÀ PHÁT TRIỂN VIỆT NAM</div>
            <div class="footer-branch-name">CHI NHÁNH QUẬN 7 SÀI GÒN</div>
          </div>
          <div class="footer-description">
            Portal nội bộ dành cho việc chia sẻ tài liệu, thông báo và thông tin quan trọng của ngân hàng.
          </div>
        </div>
        <div class="footer-contact">
          <div class="contact-item">
            <strong>📍 Địa chỉ:</strong> Tầng 4, Tòa nhà Central Park, 208 Nguyễn Thị Thập, Quận 7, TP.HCM
          </div>
          <div class="contact-item">
            <strong>📞 Điện thoại:</strong> (028) 3975 1234
          </div>
          <div class="contact-item">
            <strong>✉️ Email:</strong> bidvq7@bidv.com.vn
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copyright">
          © 2025 Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - Chi nhánh Quận 7 Sài Gòn
        </div>
        <div class="footer-time">
          Cập nhật lần cuối: 09/2025
        </div>
      </div>
    </footer>
  `;
}

// Navigation Component
function generateNavigation(session, currentPage = "", categories = []) {
  return `
    <header class="bidv-header">
      <div class="bidv-header-content">
        <div class="bidv-logo-section">
          <img src="/logo.png" alt="BIDV Logo" class="bidv-logo">
          <div>
            <div class="bank-name">NGÂN HÀNG TMCP ĐẦU TƯ VÀ PHÁT TRIỂN VIỆT NAM</div>
            <div class="branch-name">CHI NHÁNH SỞ GIAO DỊCH 2</div>
          </div>
        </div>
        <div class="header-right">
          <span class="user-info">
            <span class="user-avatar-icon">👤</span>
            <span class="user-name">${session.userName}</span>
          </span>
          <form action="/logout" method="POST" style="display: inline;">
            <button type="submit" class="logout-btn">🚪 Đăng xuất</button>
          </form>
        </div>
      </div>
    </header>
    <nav class="main-nav">
      <div class="main-nav-content">
        <!-- Mobile Logo (Mobile Only) -->
        <div class="mobile-logo">
          <img src="/logo.png" alt="BIDV" class="mobile-logo-img">
        </div>

        <!-- Desktop Navigation -->
        <div class="nav-left desktop-nav">
          <a href="/" class="nav-link ${
            currentPage === "home" ? "active" : ""
          }">🏠 Trang chủ</a>
          ${generateCategoryDropdown(categories)}
          <a href="/upload" class="nav-link ${
            currentPage === "upload" ? "active" : ""
          }">📤 Đăng bài</a>
          ${
            session.userRole === "admin"
              ? `
            <a href="/admin" class="nav-link ${
              currentPage === "admin" ? "active" : ""
            }">⚙️ Cấu hình</a>
            <a href="/users" class="nav-link ${
              currentPage === "users" ? "active" : ""
            }">👥 Người dùng</a>
          `
              : ""
          }
        </div>
        <div class="nav-right desktop-nav">
          <div class="nav-search-box">
            <form action="/search" method="GET" class="search-form">
              <input type="text" name="q" placeholder="Tìm tài liệu..." class="search-input" required>
            </form>
          </div>
        </div>

        <!-- Hamburger Menu Button (Mobile Only) -->
        <button class="hamburger-menu" id="hamburgerMenu" aria-label="Menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>

      <!-- Mobile Drawer Menu -->
      <div class="mobile-drawer" id="mobileDrawer">
        <div class="mobile-drawer-overlay" id="drawerOverlay"></div>
        <div class="mobile-drawer-content">
          <div class="mobile-drawer-header">
            <div class="mobile-user-info">
              <div class="mobile-user-avatar">👤</div>
              <div class="mobile-user-details">
                <div class="mobile-user-name">${session.userName}</div>
                <div class="mobile-user-role">${
                  session.userRole === "admin" ? "Quản trị viên" : "Người dùng"
                }</div>
              </div>
            </div>
            <button class="mobile-drawer-close" id="drawerClose" aria-label="Đóng menu">✕</button>
          </div>

          <div class="mobile-drawer-search">
            <form action="/search" method="GET" class="mobile-search-form">
              <input type="text" name="q" placeholder="Tìm tài liệu..." class="mobile-search-input" required>
              <button type="submit" class="mobile-search-btn">🔍</button>
            </form>
          </div>

          <div class="mobile-drawer-nav">
            <a href="/" class="mobile-nav-link ${
              currentPage === "home" ? "active" : ""
            }">
              <span class="mobile-nav-icon">🏠</span>
              Trang chủ
            </a>

            <div class="mobile-categories-section">
              <div class="mobile-section-title">Danh mục</div>
              <a href="/?category=" class="mobile-nav-link mobile-category-link">
                <span class="mobile-nav-icon">📋</span>
                Tất cả
              </a>
              ${categories
                .map(
                  (category) => `
                <a href="/?category=${
                  category.id
                }" class="mobile-nav-link mobile-category-link">
                  <span class="mobile-nav-icon">${category.icon}</span>
                  ${category.name}
                  <span class="mobile-category-count">${
                    category.post_count || 0
                  }</span>
                </a>
              `
                )
                .join("")}
            </div>

            <a href="/upload" class="mobile-nav-link ${
              currentPage === "upload" ? "active" : ""
            }">
              <span class="mobile-nav-icon">📤</span>
              Đăng bài
            </a>

            ${
              session.userRole === "admin"
                ? `
            <a href="/admin" class="mobile-nav-link ${
              currentPage === "admin" ? "active" : ""
            }">
              <span class="mobile-nav-icon">⚙️</span>
              Cấu hình
            </a>
            <a href="/users" class="mobile-nav-link ${
              currentPage === "users" ? "active" : ""
            }">
              <span class="mobile-nav-icon">👥</span>
              Người dùng
            </a>
            `
                : ""
            }
          </div>

          <div class="mobile-drawer-footer">
            <form action="/logout" method="POST" class="mobile-logout-form">
              <button type="submit" class="mobile-logout-btn">🚪
                <span class="mobile-nav-icon">🚪</span>
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>

    <script>
      // Mobile hamburger menu functionality
      document.addEventListener('DOMContentLoaded', function() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const mobileDrawer = document.getElementById('mobileDrawer');
        const drawerOverlay = document.getElementById('drawerOverlay');
        const drawerClose = document.getElementById('drawerClose');

        function openDrawer() {
          mobileDrawer.classList.add('active');
          document.body.classList.add('drawer-open');
          hamburgerMenu.classList.add('active');
        }

        function closeDrawer() {
          mobileDrawer.classList.remove('active');
          document.body.classList.remove('drawer-open');
          hamburgerMenu.classList.remove('active');
        }

        if (hamburgerMenu) {
          hamburgerMenu.addEventListener('click', openDrawer);
        }

        if (drawerClose) {
          drawerClose.addEventListener('click', closeDrawer);
        }

        if (drawerOverlay) {
          drawerOverlay.addEventListener('click', closeDrawer);
        }

        // Close drawer when clicking on nav links
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
          link.addEventListener('click', function() {
            // Small delay to allow navigation to start
            setTimeout(closeDrawer, 100);
          });
        });

        // Close drawer on escape key
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && mobileDrawer.classList.contains('active')) {
            closeDrawer();
          }
        });
      });
    </script>
  `;
}

// Home Page Template
function generateHomePage(
  posts,
  announcement,
  session,
  categories = [],
  currentPage = 1,
  selectedCategory = null,
  totalPosts = 0,
  postsPerPage = 3,
  searchTerm = null
) {
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const displayPosts = posts; // Posts already paginated from server

  // Build query string for pagination links
  const buildPageUrl = (page) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchTerm) params.set("q", searchTerm);
    params.set("page", page);
    const baseUrl = searchTerm ? "/search" : "/";
    return baseUrl + "?" + params.toString();
  };

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${
      searchTerm ? `Kết quả tìm kiếm: "${searchTerm}"` : "Trang chủ"
    } - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "home", categories)}

    <div class="container">
        <main class="main-content">
            <div class="content-left">
                <div class="news-section">
                    <div class="section-header">
                        ${searchTerm ? "KẾT QUẢ TÌM KIẾM" : "THÔNG TIN NỔI BẬT"}
                    </div>

                    ${
                      searchTerm
                        ? `
                        <div class="search-summary">
                            <p>Tìm kiếm cho: <strong>"${searchTerm}"</strong></p>
                            <p>Tìm thấy <strong>${totalPosts}</strong> kết quả</p>
                        </div>
                    `
                        : ""
                    }

                    ${
                      announcement && !searchTerm
                        ? `
                    <div class="announcement" style="margin: 0 0 20px 0; background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px;">
                        <strong>📢 Thông báo quan trọng:</strong> ${announcement}
                    </div>
                    `
                        : ""
                    }

                    ${
                      searchTerm && totalPosts === 0
                        ? `
                        <div class="no-results">
                            <div class="no-results-icon">🔍</div>
                            <h3>Không tìm thấy kết quả</h3>
                            <p>Không có tài liệu nào phù hợp với từ khóa "<strong>${searchTerm}</strong>"</p>
                            <div class="search-suggestions">
                                <h4>Gợi ý:</h4>
                                <ul>
                                    <li>Kiểm tra lại chính tả từ khóa</li>
                                    <li>Thử sử dụng từ khóa khác</li>
                                    <li>Sử dụng ít từ khóa hơn</li>
                                    <li>Thử tìm kiếm theo danh mục cụ thể</li>
                                </ul>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    ${
                      totalPosts > 0
                        ? `
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
                                <hr/>
                                <div class="news-meta">
                                    <span class="news-views">${
                                      post.view_count || 0
                                    } Lượt xem</span>
                                     <span class="news-date">Ngày đăng: ${moment(
                                       post.created_at
                                     ).format("DD/MM/YYYY")}</span>
                                        ${
                                          post.category_name
                                            ? `<span class="news-category">${
                                                post.category_icon || "📋"
                                              } ${post.category_name}</span>`
                                            : ""
                                        }
                                        ${
                                          searchTerm && post.file_name
                                            ? `<span class="news-file">📎 ${post.file_name}</span>`
                                            : ""
                                        }
                                    </div>
                                    ${
                                      searchTerm && post.content
                                        ? `<div class="search-snippet markdown-content">
                                            ${
                                              post.content_html
                                                ? post.content_html.length > 200
                                                  ? post.content_html.substring(
                                                      0,
                                                      200
                                                    ) + "..."
                                                  : post.content_html
                                                : post.content.length > 150
                                                ? post.content.substring(
                                                    0,
                                                    150
                                                  ) + "..."
                                                : post.content
                                            }
                                          </div>`
                                        : ""
                                    }
                                </div>
                        </li>
                        `
                          )
                          .join("")}
                    </ul>
                    `
                        : ""
                    }

                    ${
                      totalPages > 1
                        ? `
                    <div class="pagination-container">
                        <div class="post-count">
                            <strong>${totalPosts}</strong> bài viết
                        </div>
                        <div class="pagination">
                            ${
                              currentPage > 1
                                ? `<a href="${buildPageUrl(
                                    currentPage - 1
                                  )}">‹</a>`
                                : '<span class="disabled">‹</span>'
                            }
                            ${Array.from(
                              { length: Math.min(totalPages, 7) },
                              (_, i) => {
                                const pageNum = i + 1;
                                if (pageNum === currentPage) {
                                  return `<span class="current">${pageNum}</span>`;
                                } else {
                                  return `<a href="${buildPageUrl(
                                    pageNum
                                  )}">${pageNum}</a>`;
                                }
                              }
                            ).join("")}
                            ${
                              totalPages > 7 && currentPage < totalPages - 3
                                ? "<span>...</span>"
                                : ""
                            }
                            ${
                              totalPages > 7 && currentPage < totalPages - 2
                                ? `<a href="${buildPageUrl(
                                    totalPages
                                  )}">${totalPages}</a>`
                                : ""
                            }
                            ${
                              currentPage < totalPages
                                ? `<a href="${buildPageUrl(
                                    currentPage + 1
                                  )}">›</a>`
                                : '<span class="disabled">›</span>'
                            }
                        </div>
                    </div>
                    `
                        : ""
                    }

                    ${
                      totalPosts === 0 && !searchTerm
                        ? '<div style="text-align: center; color: var(--text-secondary); padding: 40px; font-style: italic;">Chưa có tài liệu nào được đăng.</div>'
                        : ""
                    }
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <a href="/upload" style="background: var(--bidv-green); color: var(--text-white); padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">📝 Đăng tài liệu mới</a>
                </div>
            </div>

            <div class="content-right">
                ${generateExchangeRatesWidget()}
            </div>
        </main>
    </div>

    ${generateFooter()}

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
    <link rel="stylesheet" href="/styles.css">${generateMarkdownEditorIncludes()}
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
                    <label for="content">Mô tả nội dung (hỗ trợ Markdown)</label>
                    <textarea id="content" name="content" rows="8" placeholder="Nhập mô tả nội dung tài liệu (tùy chọn)..."></textarea>
                </div>

                <div class="form-group">
                    <label for="files">Files đính kèm (tối đa 10 files)</label>
                    <input type="file" id="files" name="files" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.wav,.webm,.ogg,.zip,.rar,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                    <small>Hỗ trợ: PDF, DOC, DOCX, Excel (XLS/XLSX), TXT, hình ảnh, video, audio, file nén (mỗi file tối đa 500MB)</small>
                    <div id="file-list" class="file-list-preview"></div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">📤 Đăng tài liệu</button>
                    <a href="/" class="btn btn-secondary">❌ Hủy</a>
                </div>
            </form>
        </main>
    </div>

    ${generateFooter()}

    ${generateMarkdownEditorScript("upload-form", "bidv-upload-content")}

    <script>
        document.getElementById('files').addEventListener('change', function(e) {
            const fileList = document.getElementById('file-list');
            const files = Array.from(e.target.files);

            if (files.length > 10) {
                alert('Chỉ được chọn tối đa 10 files!');
                e.target.value = '';
                fileList.innerHTML = '';
                return;
            }

            fileList.innerHTML = '';

            files.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';
                fileItem.innerHTML = \`
                    <span class="file-icon">📎</span>
                    <span class="file-name">\${file.name}</span>
                    <span class="file-size">(\${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onclick="removeFile(\${index})" class="btn-remove-file">✕</button>
                \`;
                fileList.appendChild(fileItem);
            });
        });

        function removeFile(index) {
            const input = document.getElementById('files');
            const dt = new DataTransfer();
            const files = Array.from(input.files);

            files.forEach((file, i) => {
                if (i !== index) {
                    dt.items.add(file);
                }
            });

            input.files = dt.files;
            input.dispatchEvent(new Event('change'));
        }
    </script>
</body>
</html>
  `;
}

// Admin Page Template
function generateAdminPage(announcement, session, categories = []) {
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
    ${generateNavigation(session, "admin", categories)}

    <div class="container">
        <main class="normal-main-content">
            <div class="page-header">
                <h2>Quản trị hệ thống</h2>
                <div class="page-actions">
                    <a href="/admin/deleted" class="btn btn-info">🗑️ Quản lý file đã xóa</a>
                </div>
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
                        <button type="submit" class="btn btn-primary">💾 Lưu thông báo</button>
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

    ${generateFooter()}
</body>
</html>
  `;
}

// Users Management Page Template
function generateUsersPage(users, session, categories = []) {
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
    ${generateNavigation(session, "users", categories)}

    <div class="container">
        <main class="users-main-content">
            <div class="page-header">
                <h2>Quản lý người dùng</h2>
                <div class="page-actions">
                    <button onclick="showAddUserForm()" class="btn btn-primary">➕ Thêm người dùng</button>
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
                        <button type="submit" class="btn btn-primary">✅ Tạo người dùng</button>
                        <button type="button" onclick="hideAddUserForm()" class="btn btn-secondary">❌ Hủy</button>
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
                                            ? "🔒 Khóa"
                                            : "🔓 Mở khóa"
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

    ${generateFooter()}
</body>
</html>
  `;
}

// Edit Post Page Template
function generateEditPage(post, session, categories = []) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chỉnh sửa tài liệu - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">${generateMarkdownEditorIncludes()}
</head>
<body>
    ${generateNavigation(session, "edit", categories)}

    <div class="container">
        <main class="user-main-content">
            <div class="page-header">
                <h2>Chỉnh sửa tài liệu</h2>
            </div>

            <form action="/edit/${
              post.id
            }" method="POST" enctype="multipart/form-data" class="edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="title">Tiêu đề tài liệu *</label>
                        <input type="text" id="title" name="title" value="${
                          post.title
                        }" required>
                    </div>

                    <div class="form-group">
                        <label for="category_id">Danh mục *</label>
                        <select id="category_id" name="category_id" required>
                            <option value="">Chọn danh mục...</option>
                            ${categories
                              .map(
                                (category) => `
                                <option value="${category.id}" ${
                                  post.category_id == category.id
                                    ? "selected"
                                    : ""
                                }>${category.icon} ${category.name}</option>
                            `
                              )
                              .join("")}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="content">Mô tả nội dung (hỗ trợ Markdown)</label>
                    <textarea id="content" name="content" rows="8">${
                      post.content || ""
                    }</textarea>
                </div>

                ${
                  post.files && post.files.length > 0
                    ? `
                <div class="current-files">
                    <h4>Files hiện tại:</h4>
                    <div id="current-files-list">
                        ${
                          post.files && post.files.length > 0
                            ? post.files
                                .map(
                                  (file) => `
                        <div class="file-info" data-file-id="${file.id}">
                            <span class="file-icon">📎</span>
                            <span class="file-name">${file.file_name}</span>
                            <span class="file-size">(${(
                              file.file_size /
                              1024 /
                              1024
                            ).toFixed(2)} MB)</span>
                            <a href="/download/file/${
                              file.id
                            }" class="btn btn-sm">⬇️ Tải về</a>
                            <button type="button" onclick="removeCurrentFile(${
                              file.id
                            })" class="btn btn-sm btn-danger">🗑️ Xóa</button>
                            <input type="hidden" name="remove_files[]" id="remove_file_${
                              file.id
                            }" value="">
                        </div>
                        `
                                )
                                .join("")
                            : `
                        <div class="no-files">
                            <p>Chưa có file nào được đính kèm.</p>
                        </div>
                        `
                        }
                    </div>
                </div>
                `
                    : ""
                }

                <div class="form-group">
                    <label for="new_files">Thêm files mới (tối đa 10 files)</label>
                    <input type="file" id="new_files" name="new_files" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.wav,.webm,.ogg,.zip,.rar,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                    <small>Hỗ trợ: PDF, DOC, DOCX, Excel (XLS/XLSX), TXT, hình ảnh, video, audio, file nén (mỗi file tối đa 500MB)</small>
                    <div id="new-file-list" class="file-list-preview"></div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Lưu thay đổi</button>
                    <a href="/" class="btn btn-secondary">❌ Hủy</a>
                    <a href="/history/${
                      post.id
                    }" class="btn btn-info">📖 Xem lịch sử</a>
                </div>
            </form>
        </main>
    </div>

    ${generateFooter()}

    ${generateMarkdownEditorScript("edit-form", `bidv-edit-content-${post.id}`)}

    <script>
        // Handle new file selection
        document.getElementById('new_files').addEventListener('change', function(e) {
            const fileList = document.getElementById('new-file-list');
            const files = Array.from(e.target.files);

            if (files.length > 10) {
                alert('Chỉ được chọn tối đa 10 files!');
                e.target.value = '';
                fileList.innerHTML = '';
                return;
            }

            fileList.innerHTML = '';

            files.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';
                fileItem.innerHTML = \`
                    <span class="file-icon">📎</span>
                    <span class="file-name">\${file.name}</span>
                    <span class="file-size">(\${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onclick="removeNewFile(\${index})" class="btn-remove-file">✕</button>
                \`;
                fileList.appendChild(fileItem);
            });
        });

        function removeNewFile(index) {
            const input = document.getElementById('new_files');
            const dt = new DataTransfer();
            const files = Array.from(input.files);

            files.forEach((file, i) => {
                if (i !== index) {
                    dt.items.add(file);
                }
            });

            input.files = dt.files;
            input.dispatchEvent(new Event('change'));
        }

        // Handle current file removal
        function removeCurrentFile(fileId) {
            if (confirm('Bạn có chắc muốn xóa file này?')) {
                document.getElementById('remove_file_' + fileId).value = fileId;
                const fileDiv = document.querySelector('[data-file-id="' + fileId + '"]');
                fileDiv.style.opacity = '0.5';
                fileDiv.innerHTML += '<p class="text-info">File sẽ được xóa khi lưu thay đổi.</p>';
            }
        }
    </script>
</body>
</html>
  `;
}

// History Page Template
function generateHistoryPage(post, history, session, categories = []) {
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
    ${generateNavigation(session, "history", categories)}

    <div class="container">
        <main class="normal-main-content">
            <div class="page-header">
                <h2>Lịch sử chỉnh sửa: ${post.title}</h2>
                <div class="page-actions">
                    <a href="/post/${
                      post.id
                    }" class="btn btn-secondary">↩️ Quay lại</a>
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

    ${generateFooter()}
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
                    <a href="/" class="btn btn-primary">🏠 Quay về trang chủ</a>
                    ${
                      session.userRole === "admin"
                        ? `
                        <a href="/users" class="btn btn-secondary">👥 Quản lý người dùng</a>
                    `
                        : `
                        <p class="contact-admin">Vui lòng liên hệ quản trị viên để được cấp quyền đăng bài.</p>
                    `
                    }
                </div>
            </div>
        </main>
    </div>

    ${generateFooter()}
</body>
</html>
  `;
}

// Post Detail View Template
function generatePostDetailPage(post, session, categories = []) {
  // Determine file preview based on file extension
  const getFilePreview = (fileName, postId, fileId) => {
    if (!fileName) return "";

    const ext = fileName.toLowerCase().split(".").pop();
    const fileUrl = fileId ? `/download/file/${fileId}` : `/download/${postId}`;

    switch (ext) {
      case "pdf":
        return `
          <div class="file-preview">
            <iframe src="${fileUrl}" width="100%" height="600px" frameborder="0">
              <p>Trình duyệt không hỗ trợ xem PDF. <a href="${fileUrl}">⬇️ Tải về</a></p>
            </iframe>
          </div>
        `;

      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return `
          <div class="file-preview">
            <img src="${fileUrl}" alt="${fileName}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          </div>
        `;

      case "mp4":
      case "webm":
      case "ogg":
        return `
          <div class="file-preview">
            <video controls width="100%" style="border-radius: 8px; max-height: 600px; max-width: 400px">
              <source src="${fileUrl}" type="video/${ext}">
              Trình duyệt không hỗ trợ video này. <a href="${fileUrl}">⬇️ Tải về</a>
            </video>
          </div>
        `;

      case "mp3":
      case "wav":
      case "ogg":
        return `
          <div class="file-preview">
            <audio controls style="width: 100%;">
              <source src="${fileUrl}" type="audio/${ext}">
              Trình duyệt không hỗ trợ audio này. <a href="${fileUrl}">⬇️ Tải về</a>
            </audio>
          </div>
        `;

      case "xlsx":
      case "xls":
        return `
           <div class="file-preview">
             <div class="excel-preview">
               <div class="preview-header">
                 <span class="file-icon">📊</span>
                 <span class="file-name">${fileName}</span>
                 <div class="preview-actions">
                   <a href="${fileUrl}?download=true" class="btn btn-sm btn-download">⬇️ Tải về</a>
                 </div>
               </div>
               <div id="excel-container-${postId}" class="excel-container">
                 <div class="loading-message">Đang tải file Excel...</div>
               </div>
               <script>
                 let excelData_${postId} = null;
                 let currentStartRow_${postId} = 0;
                 const ROWS_PER_CHUNK = 50;

                 function loadExcelPreview_${postId}() {
                   fetch('/preview/excel/${postId}')
                     .then(response => response.json())
                     .then(data => {
                       excelData_${postId} = data;
                       const container = document.getElementById('excel-container-${postId}');
                       let html = '<div class="excel-info">';
                       html += '<div class="excel-stats">📊 ' + data.totalRows + ' hàng × ' + data.totalCols + ' cột</div>';
                       html += '<div class="excel-loaded">Hiển thị ' + data.loadedRows + ' hàng đầu tiên</div>';
                       html += '</div>';

                       if (data.sheets.length > 1) {
                         html += '<div class="sheet-tabs">';
                         data.sheets.forEach((sheetName, index) => {
                           html += '<button class="sheet-tab' + (index === 0 ? ' active' : '') + '" onclick="switchSheet_${postId}(\\''+sheetName+'\\', this)">' + sheetName + '</button>';
                         });
                         html += '</div>';
                       }

                       html += '<div class="excel-table-container">';
                       html += '<table class="excel-table">';
                       html += data.data.replace(/<table[^>]*>/g, '').replace('</table>', '');
                       html += '</table>';
                       html += '</div>';

                       if (data.hasMore) {
                         html += '<div class="load-more-container">';
                         html += '<button class="btn btn-primary load-more-btn" onclick="loadMoreRows_${postId}()">📄 Xem thêm ' + ROWS_PER_CHUNK + ' hàng</button>';
                         html += '<div class="load-more-info">Còn ' + (data.totalRows - data.loadedRows) + ' hàng chưa hiển thị</div>';
                         html += '</div>';
                       }

                       container.innerHTML = html;
                     })
                     .catch(error => {
                       document.getElementById('excel-container-${postId}').innerHTML =
                         '<div class="error-message">Không thể tải file Excel. <a href="${fileUrl}?download=true">⬇️ Tải về</a></div>';
                     });
                 }

                 function loadMoreRows_${postId}() {
                   if (!excelData_${postId}) return;

                   const loadBtn = document.querySelector('#excel-container-${postId} .load-more-btn');
                   const loadInfo = document.querySelector('#excel-container-${postId} .load-more-info');

                   if (loadBtn) loadBtn.textContent = '⏳ Đang tải...';

                   currentStartRow_${postId} += ROWS_PER_CHUNK;

                   fetch('/preview/excel/${postId}/load-more?startRow=' + currentStartRow_${postId} + '&rows=' + ROWS_PER_CHUNK + '&sheet=' + encodeURIComponent(excelData_${postId}.currentSheet))
                     .then(response => response.json())
                     .then(data => {
                       const table = document.querySelector('#excel-container-${postId} .excel-table');
                       if (table && data.data) {
                         // Thêm rows mới vào table
                         const newRows = data.data.replace(/<table[^>]*>/g, '').replace('</table>', '');
                         table.innerHTML += newRows;

                         // Cập nhật thông tin
                         const remainingRows = excelData_${postId}.totalRows - (currentStartRow_${postId} + ROWS_PER_CHUNK);
                         if (loadInfo) {
                           loadInfo.textContent = remainingRows > 0 ? 'Còn ' + remainingRows + ' hàng chưa hiển thị' : 'Đã hiển thị tất cả dữ liệu';
                         }

                         if (!data.hasMore) {
                           loadBtn.style.display = 'none';
                         } else {
                           loadBtn.textContent = '📄 Xem thêm ' + ROWS_PER_CHUNK + ' hàng';
                         }
                       }
                     })
                     .catch(error => {
                       console.error('Error loading more rows:', error);
                       if (loadBtn) loadBtn.textContent = '❌ Lỗi tải dữ liệu';
                     });
                 }

                 function switchSheet_${postId}(sheetName, button) {
                   if (!excelData_${postId}) return;

                   // Reset state
                   currentStartRow_${postId} = 0;
                   excelData_${postId}.currentSheet = sheetName;

                   // Update active tab
                   document.querySelectorAll('#excel-container-${postId} .sheet-tab').forEach(el => el.classList.remove('active'));
                   button.classList.add('active');

                   // Reload preview for new sheet
                   document.getElementById('excel-container-${postId}').innerHTML = '<div class="loading-message">Đang chuyển sheet...</div>';
                   loadExcelPreview_${postId}();
                 }

                 // Load initial preview
                 loadExcelPreview_${postId}();
               </script>
             </div>
           </div>
         `;

      case "docx":
      case "doc":
        return `
           <div class="file-preview">
             <div class="word-preview">
               <div class="preview-header">
                 <span class="file-icon">📄</span>
                 <span class="file-name">${fileName}</span>
                 <div class="preview-actions">
                   <a href="${fileUrl}?download=true" class="btn btn-sm btn-download">⬇️ Tải về</a>
                 </div>
               </div>
               <div id="word-container-${postId}" class="word-container">
                 <div class="loading-message">Đang tải file Word...</div>
               </div>
               <script>
                 fetch('/preview/word/${postId}')
                   .then(response => response.json())
                   .then(data => {
                     const container = document.getElementById('word-container-${postId}');
                     container.innerHTML = '<div class="word-content">' + data.html + '</div>';
                   })
                   .catch(error => {
                     document.getElementById('word-container-${postId}').innerHTML =
                       '<div class="error-message">Không thể tải file Word. <a href="${fileUrl}?download=true">⬇️ Tải về</a></div>';
                   });
               </script>
             </div>
           </div>
         `;

      default:
        return `
          <div class="file-preview">
            <div class="file-download-only">
              <div class="file-icon-large">📎</div>
              <div class="file-info">
                <div class="file-name">${fileName}</div>
                <div class="file-note">Loại file này không hỗ trợ xem trực tiếp</div>
              </div>
              <a href="${fileUrl}?download=true" class="btn btn-primary">⬇️ Tải về để xem</a>
            </div>
          </div>
        `;
    }
  };

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - BIDV Intranet Portal</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "home", categories)}

    <div class="container">
        <main class="post-detail-main">
            <div class="post-detail-header">
                <div class="breadcrumb">
                    <a href="/">Trang chủ</a> <span>›</span> <span>${
                      post.title
                    }</span>
                </div>

                <div class="post-detail-meta">
                    <div class="post-category">
                        <span class="category-icon">${
                          post.category_icon || "📋"
                        }</span>
                        <span class="category-name">${
                          post.category_name || "Không xác định"
                        }</span>
                    </div>
                    <div class="post-stats">
                        <span class="post-author">📝 ${
                          post.author_name || "Không xác định"
                        }</span>
                        <span class="post-date">📅 ${moment(
                          post.created_at
                        ).format("DD/MM/YYYY HH:mm")}</span>
                        <span class="post-views">👁 ${
                          post.view_count || 0
                        } lượt xem</span>
                    </div>
                </div>
            </div>

            <div class="post-detail-content">
                <h1 class="post-title">${post.title}</h1>

                ${
                  post.content
                    ? `
                <div class="post-description">
                    <h3>Mô tả:</h3>
                    <div class="post-content markdown-content">${
                      post.content_html || post.content.replace(/\\n/g, "<br>")
                    }</div>
                </div>
                `
                    : ""
                }

                ${
                  post.files && post.files.length > 0
                    ? `
                <div class="post-file-section">
                    <h3>Files đính kèm:</h3>
                    ${post.files
                      .map(
                        (file, index) => `
                    <div class="file-info-header">
                        <span class="file-icon">📎</span>
                        <span class="file-name">${file.file_name}</span>
                        <span class="file-size">(${(
                          file.file_size /
                          1024 /
                          1024
                        ).toFixed(2)} MB)</span>
                        <a href="/download/file/${
                          file.id
                        }?download=true" class="btn btn-sm btn-download">⬇️ Tải về</a>
                    </div>
                    ${getFilePreview(file.file_name, post.id, file.id)}
                    `
                      )
                      .join("")}
                </div>
                `
                    : ""
                }

                <div class="post-actions">
                    ${
                      session.userRole === "admin" ||
                      post.user_id === session.userId
                        ? `<a href="/edit/${post.id}" class="btn btn-secondary">✏️ Chỉnh sửa</a>`
                        : ""
                    }
                    <a href="/history/${
                      post.id
                    }" class="btn btn-info">📖 Lịch sử</a>
                    ${
                      session.userRole === "admin"
                        ? `<button onclick="deletePost(${post.id})" class="btn btn-danger">🗑️ Xóa</button>`
                        : ""
                    }
                    <a href="/" class="btn btn-primary">↩️ Quay lại</a>
                </div>
            </div>
        </main>
    </div>

    <script>
        function deletePost(id) {
            if (confirm('Bạn có chắc muốn xóa tài liệu này?')) {
                fetch('/delete/' + id, { method: 'POST' })
                    .then(() => window.location.href = '/');
            }
        }
    </script>

    ${generateFooter()}
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
  generatePostDetailPage,
};
