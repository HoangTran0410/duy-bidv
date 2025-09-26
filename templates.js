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
function generateExchangeRatesWidget(exchangeRates = []) {
  // If no database rates, fall back to hardcoded rates
  if (exchangeRates.length === 0) {
    exchangeRates = getExchangeRates().map((rate) => ({
      currency_code: rate.code,
      cash_buy_rate: parseFloat(rate.buy.replace(/,/g, "")),
      transfer_buy_rate: parseFloat(rate.transfer.replace(/,/g, "")),
      sell_rate: parseFloat(rate.sell.replace(/,/g, "")),
      notification_date: moment().format("YYYY-MM-DD"),
      notification_number: 1,
    }));
  }

  const currentDate =
    exchangeRates.length > 0 && exchangeRates[0].notification_date
      ? moment(exchangeRates[0].notification_date).format("DD/MM/YYYY")
      : moment().format("DD/MM/YYYY");

  const notificationNumber =
    exchangeRates.length > 0 && exchangeRates[0].notification_number
      ? exchangeRates[0].notification_number
      : 1;

  // Currency flag mapping
  const getCurrencyFlag = (code) => {
    const flags = {
      USD: "🇺🇸",
      EUR: "🇪🇺",
      GBP: "🇬🇧",
      JPY: "🇯🇵",
      HKD: "🇭🇰",
      CHF: "🇨🇭",
      THB: "🇹🇭",
      AUD: "🇦🇺",
      CAD: "🇨🇦",
      SGD: "🇸🇬",
      CNY: "🇨🇳",
      KRW: "🇰🇷",
      LAK: "🇱🇦",
      DKK: "🇩🇰",
      NOK: "🇳🇴",
      SEK: "🇸🇪",
      MYR: "🇲🇾",
      TWD: "🇹🇼",
      NZD: "🇳🇿",
    };
    return flags[code] || "💱";
  };

  return `
    <div class="exchange-rates">
      <div class="rates-header">
        BẢNG TỶ GIÁ NGOẠI TỆ
      </div>
      <div class="rates-date">
        Thông báo lần ${notificationNumber} - ngày: ${currentDate}
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
          ${exchangeRates
            .map(
              (rate) => `
            <tr>
              <td>
                <span class="currency-flag">${getCurrencyFlag(
                  rate.currency_code
                )}</span>
                <span class="currency-code">${rate.currency_code}</span>
              </td>
              <td class="rate-value">${
                rate.cash_buy_rate
                  ? rate.cash_buy_rate.toLocaleString("vi-VN")
                  : "-"
              }</td>
              <td class="rate-value">${
                rate.transfer_buy_rate
                  ? rate.transfer_buy_rate.toLocaleString("vi-VN")
                  : "-"
              }</td>
              <td class="rate-value">${
                rate.sell_rate ? rate.sell_rate.toLocaleString("vi-VN") : "-"
              }</td>
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
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
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
            }">⚙️ Quản trị</a>
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
              Quản trị
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
  searchTerm = null,
  banners = [],
  exchangeRates = []
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
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "home", categories)}

    <div class="container">
        <main class="main-content">
            <div class="content-left">
                ${
                  banners.length > 0
                    ? `
                <div class="banner-carousel">
                    <div class="carousel-container">
                        <div class="carousel-slides" id="bannerCarousel">
                            ${banners
                              .map(
                                (banner, index) => `
                                <div class="carousel-slide ${
                                  index === 0 ? "active" : ""
                                }">
                                    ${
                                      banner.link_url
                                        ? `<a href="${banner.link_url}" target="_blank" class="banner-link">`
                                        : ""
                                    }
                                         <img src="/${
                                           banner.image_path
                                         }" alt="${
                                  banner.title
                                }" class="banner-image"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='; this.alt='Image not found';">
                                        <div class="banner-overlay">
                                            <div class="banner-title">${
                                              banner.title
                                            }</div>
                                            ${
                                              banner.note
                                                ? `<div class="banner-note">${banner.note}</div>`
                                                : ""
                                            }
                                            ${
                                              banner.link_url
                                                ? `<div class="banner-link-indicator">🔗</div>`
                                                : ""
                                            }
                                        </div>
                                    ${banner.link_url ? "</a>" : ""}
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                        ${
                          banners.length > 1
                            ? `
                        <div class="carousel-controls">
                            <button class="carousel-prev" onclick="changeSlide(-1)">❮</button>
                            <button class="carousel-next" onclick="changeSlide(1)">❯</button>
                        </div>
                        <div class="carousel-indicators">
                            ${banners
                              .map(
                                (_, index) => `
                                <button class="carousel-indicator ${
                                  index === 0 ? "active" : ""
                                }"
                                        onclick="currentSlide(${
                                          index + 1
                                        })"></button>
                            `
                              )
                              .join("")}
                        </div>
                        `
                            : ""
                        }
                    </div>
                </div>
                `
                    : ""
                }

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
                              searchTerm && post.highlighted_title
                                ? post.highlighted_title
                                : post.title
                            }</a>
                                <hr/>
                                <div class="news-meta">
                                    <span class="news-views">${
                                      post.view_count || 0
                                    } Lượt xem</span>
                                     <span class="news-date">${moment(
                                       post.created_at
                                     ).fromNow()} - ${moment(
                              post.created_at
                            ).format("DD/MM/YYYY")}</span>
                                        ${
                                          post.category_name
                                            ? `<span class="news-category">${
                                                post.category_icon || "📋"
                                              } ${post.category_name}</span>`
                                            : ""
                                        }
                                    </div>
                                    ${
                                      searchTerm && post.content_html
                                        ? `<div class="search-snippet markdown-content">
                                            ${post.content_html}
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
                ${generateExchangeRatesWidget(exchangeRates)}
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

        // Banner carousel functionality
        let currentSlideIndex = 0;
        const totalSlides = ${banners.length};
        let timeoutId = null;

        function showSlide(index) {
            const slides = document.querySelectorAll('.carousel-slide');
            const indicators = document.querySelectorAll('.carousel-indicator');

            slides.forEach(slide => slide.classList.remove('active'));
            indicators.forEach(indicator => indicator.classList.remove('active'));

            if (slides[index]) {
                slides[index].classList.add('active');
                if (indicators[index]) {
                    indicators[index].classList.add('active');
                }
            }

            // auto next slide
            if(totalSlides > 1) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                timeoutId = setTimeout(() => {
                    changeSlide(1);
                }, 5000);
            }
        }

        function changeSlide(direction) {
            currentSlideIndex += direction;
            if (currentSlideIndex >= totalSlides) {
                currentSlideIndex = 0;
            } else if (currentSlideIndex < 0) {
                currentSlideIndex = totalSlides - 1;
            }
            showSlide(currentSlideIndex);
            lastChangeTime = Date.now();
        }

        function currentSlide(index) {
            currentSlideIndex = index - 1;
            showSlide(currentSlideIndex);
        }

        showSlide(currentSlideIndex);
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
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
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

// Edit Post Page Template
function generateEditPage(post, session, categories = []) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chỉnh sửa tài liệu - BIDV Intranet Portal</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
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
                    <a href="/post/${
                      post.id
                    }" class="btn btn-secondary">❌ Hủy</a>
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
  console.log(post);
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lịch sử chỉnh sửa - BIDV Intranet Portal</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
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
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
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
            <img src="${fileUrl}" alt="${fileName}" style="max-width: 400px; max-height: 600px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
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

      default:
        return "";
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
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "home", categories)}

    <div class="container">
        <main class="post-detail-main">
            <div class="post-detail-header">
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

// Reusable Admin Tab Structure
function generateAdminTabPage(
  title,
  activeTab,
  tabContent,
  session,
  categories = [],
  additionalScripts = ""
) {
  const tabs = [
    { key: "users", label: "👥 Người dùng", url: "/admin/users" },
    { key: "announcement", label: "📢 Thông báo", url: "/admin/announcement" },
    { key: "banners", label: "🖼️ Banners", url: "/admin/banners" },
    { key: "exchange-rates", label: "💱 Tỷ giá", url: "/admin/exchange-rates" },
    { key: "deleted", label: "🗑️ File đã xóa", url: "/admin/deleted" },
  ];

  const tabButtons = tabs
    .map(
      (tab) =>
        `<a href="${tab.url}" class="tab-button ${
          tab.key === activeTab ? "active" : ""
        }">${tab.label}</a>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - BIDV Intranet Portal</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${generateNavigation(session, "admin", categories)}

    <div class="container">
        <main class="normal-main-content">
            <div class="page-header">
                <h2>Quản trị hệ thống</h2>
            </div>

            <!-- Admin Tabs -->
            <div class="admin-tabs">
                <div class="tab-buttons">
                    ${tabButtons}
                </div>

                <!-- Tab Content -->
                <div class="tab-content active">
                    ${tabContent || "Vui lòng chọn tab để xem nội dung."}
                </div>
            </div>
        </main>
    </div>

    ${additionalScripts}

    ${generateFooter()}
</body>
</html>
  `;
}

// Admin Users Page Template
function generateAdminUsersPage(users, session, categories = []) {
  const tabContent = `
    <div class="tab-header">
        <h3>Quản lý người dùng</h3>
        <button onclick="showAddUserForm()" class="btn btn-primary">➕ Thêm người dùng</button>
    </div>

    <!-- Add User Form (Hidden by default) -->
    <div id="addUserForm" class="add-user-form" style="display: none;">
        <h4>Thêm người dùng mới</h4>
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
                      user.role === "admin" ? "Quản trị viên" : "Người dùng"
                    }</span></td>
                    <td><span class="status-badge ${user.status}">${
                      user.status === "active" ? "Hoạt động" : "Tạm khóa"
                    }</span></td>
                    <td>${user.can_post ? "Có" : "Không"}</td>
                    <td>${moment(user.created_at).format("DD/MM/YYYY")}</td>
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
  `;

  const scripts = `
    <script>
        function showAddUserForm() {
            document.getElementById('addUserForm').style.display = 'block';
        }

        function hideAddUserForm() {
            document.getElementById('addUserForm').style.display = 'none';
        }
    </script>
  `;

  return generateAdminTabPage(
    "Quản lý người dùng",
    "users",
    tabContent,
    session,
    categories,
    scripts
  );
}

// Admin Announcement Page Template
function generateAdminAnnouncementPage(announcement, session, categories = []) {
  const tabContent = `
    <div class="tab-header">
        <h3>Cấu hình thông báo</h3>
        <p>Thông báo này sẽ hiển thị ở đầu trang chủ cho tất cả người dùng.</p>
    </div>

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
  `;

  return generateAdminTabPage(
    "Cấu hình thông báo",
    "announcement",
    tabContent,
    session,
    categories
  );
}

// Admin Deleted Files Page Template
function generateAdminDeletedPage(deletedFiles, session, categories = []) {
  const tabContent = `
    <div class="tab-header">
        <h3>Quản lý file đã xóa</h3>
        <p>Các file đã bị xóa sẽ được lưu trữ tại đây để có thể khôi phục nếu cần.</p>
    </div>

    <div class="deleted-files-table">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Tên file gốc</th>
                    <th>Post ID</th>
                    <th>Kích thước</th>
                    <th>Ngày xóa</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${deletedFiles
                  .map(
                    (file) => `
                <tr>
                    <td>${file.originalName}</td>
                    <td>${file.postId}</td>
                    <td>${(file.size / 1024 / 1024).toFixed(2)} MB</td>
                    <td>${moment(file.deletedAt).format(
                      "DD/MM/YYYY HH:mm"
                    )}</td>
                    <td>
                        <a href="/admin/deleted/download/${
                          file.fileName
                        }" class="btn btn-sm btn-download">Tải về</a>
                        <button onclick="permanentDelete('${
                          file.fileName
                        }')" class="btn btn-sm btn-danger">Xóa vĩnh viễn</button>
                    </td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        ${
          deletedFiles.length === 0
            ? '<p style="text-align: center; color: #666; margin-top: 40px;">Không có file nào đã bị xóa.</p>'
            : ""
        }
    </div>
  `;

  const scripts = `
    <script>
        function permanentDelete(fileName) {
            if (confirm('Bạn có chắc muốn xóa vĩnh viễn file này? Hành động này không thể hoàn tác!')) {
                fetch('/admin/deleted/permanent/' + encodeURIComponent(fileName), { method: 'DELETE' })
                    .then(() => location.reload());
            }
        }
    </script>
  `;

  return generateAdminTabPage(
    "Quản lý file đã xóa",
    "deleted",
    tabContent,
    session,
    categories,
    scripts
  );
}

// Admin Banners Page Template
function generateAdminBannersPage(banners, session, categories = []) {
  const tabContent = `
    <div class="tab-header">
        <h3>Quản lý banners</h3>
        <button onclick="showAddBannerForm()" class="btn btn-primary">➕ Thêm banner</button>
    </div>

    <!-- Add Banner Form (Hidden by default) -->
    <div id="addBannerForm" class="add-banner-form" style="display: none;">
        <h4>Thêm banner mới</h4>
        <form action="/admin/banners/add" method="POST" enctype="multipart/form-data">
            <div class="form-row">
                <div class="form-group">
                    <label for="title">Tiêu đề banner *</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="display_order">Thứ tự hiển thị</label>
                    <input type="number" id="display_order" name="display_order" value="0" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="start_date">Ngày bắt đầu (tùy chọn)</label>
                    <input type="datetime-local" id="start_date" name="start_date">
                    <small>Để trống nếu muốn hiển thị ngay lập tức</small>
                </div>
                <div class="form-group">
                    <label for="expired_date">Ngày kết thúc (tùy chọn)</label>
                    <input type="datetime-local" id="expired_date" name="expired_date">
                    <small>Để trống nếu muốn hiển thị vô thời hạn</small>
                </div>
            </div>
            <div class="form-group">
                <label for="link_url">Link (tùy chọn)</label>
                <input type="url" id="link_url" name="link_url" placeholder="https://example.com">
            </div>
            <div class="form-group">
                <label for="note">Ghi chú</label>
                <textarea id="note" name="note" rows="2" placeholder="Ghi chú về banner..."></textarea>
            </div>
            <div class="form-group">
                <label for="banner_image">Hình ảnh banner *</label>
                <input type="file" id="banner_image" name="banner_image" accept="image/*" required>
                <small>Chỉ chấp nhận file hình ảnh (JPG, PNG, GIF, WebP)</small>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">✅ Thêm banner</button>
                <button type="button" onclick="hideAddBannerForm()" class="btn btn-secondary">❌ Hủy</button>
            </div>
        </form>
    </div>

    <!-- Banners Table -->
    <div class="banners-table">
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tiêu đề</th>
                    <th>Ghi chú</th>
                    <th>Link</th>
                    <th>Thời gian</th>
                    <th>Thứ tự</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${banners
                  .map(
                    (banner) => `
                <tr>
                    <td>${banner.id}</td>
                    <td>
                        <img src="/${banner.image_path}" alt="${banner.title}"
                             style="width: 120px; height: 80px; object-fit: cover; border-radius: 4px;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OQTwvdGV4dD48L3N2Zz4='; this.alt='Image not found';">
                    </td>
                    <td>${banner.title}</td>
                    <td>${banner.note}</td>
                    <td>${
                      banner.link_url
                        ? `<a href="${banner.link_url}" target="_blank">🔗 Link</a>`
                        : "Không có"
                    }</td>
                    <td>
                        <small>
                            Từ: ${
                              banner.start_date
                                ? (() => {
                                    const date = new Date(banner.start_date);
                                    if (isNaN(date.getTime()))
                                      return "Invalid date";
                                    return date.toLocaleString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                                  })()
                                : "Không có"
                            }<br>
                            Đến: ${
                              banner.expired_date
                                ? (() => {
                                    const date = new Date(banner.expired_date);
                                    if (isNaN(date.getTime()))
                                      return "Invalid date";
                                    return date.toLocaleString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                                  })()
                                : "Không có"
                            }
                        </small>
                    </td>
                    <td>${banner.display_order}</td>
                    <td>
                        <span class="status-badge ${
                          banner.is_active ? "active" : "inactive"
                        }">
                            ${banner.is_active ? "Hoạt động" : "Tạm dừng"}
                        </span>
                    </td>
                    <td>
                        <button onclick="editBanner(${
                          banner.id
                        })" class="btn btn-sm btn-secondary">✏️ Sửa</button>
                        <form action="/admin/banners/delete/${
                          banner.id
                        }" method="POST" style="display: inline;">
                            <button type="submit" class="btn btn-sm btn-danger"
                                    onclick="return confirm('Bạn có chắc muốn xóa banner này?')">🗑️ Xóa</button>
                        </form>
                    </td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        ${
          banners.length === 0
            ? '<p style="text-align: center; color: #666; margin-top: 40px;">Chưa có banner nào.</p>'
            : ""
        }
    </div>

    <!-- Edit Banner Modal -->
    <div id="editBannerModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h4>Chỉnh sửa banner</h4>
                <button onclick="closeEditBannerModal()" class="modal-close">&times;</button>
            </div>
            <form id="editBannerForm" method="POST" enctype="multipart/form-data">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_title">Tiêu đề banner *</label>
                        <input type="text" id="edit_title" name="title" required>
                    </div>
                    <div class="form-group">
                        <label for="edit_display_order">Thứ tự hiển thị</label>
                        <input type="number" id="edit_display_order" name="display_order" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_start_date">Ngày bắt đầu (tùy chọn)</label>
                        <input type="datetime-local" id="edit_start_date" name="start_date">
                        <small>Để trống nếu muốn hiển thị ngay lập tức</small>
                    </div>
                    <div class="form-group">
                        <label for="edit_expired_date">Ngày kết thúc (tùy chọn)</label>
                        <input type="datetime-local" id="edit_expired_date" name="expired_date">
                        <small>Để trống nếu muốn hiển thị vô thời hạn</small>
                    </div>
                </div>
                <div class="form-group">
                    <label for="edit_link_url">Link (tùy chọn)</label>
                    <input type="url" id="edit_link_url" name="link_url" placeholder="https://example.com">
                </div>
                <div class="form-group">
                    <label for="edit_note">Ghi chú</label>
                    <textarea id="edit_note" name="note" rows="2" placeholder="Ghi chú về banner..."></textarea>
                </div>
                <div class="form-group">
                    <label for="edit_banner_image">Hình ảnh banner mới (để trống nếu không thay đổi)</label>
                    <input type="file" id="edit_banner_image" name="banner_image" accept="image/*">
                    <small>Chỉ chấp nhận file hình ảnh (JPG, PNG, GIF, WebP)</small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="edit_is_active" name="is_active" value="1">
                        Banner đang hoạt động
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Lưu thay đổi</button>
                    <button type="button" onclick="closeEditBannerModal()" class="btn btn-secondary">❌ Hủy</button>
                </div>
            </form>
        </div>
    </div>
  `;

  const scripts = `
    <script>
        function showAddBannerForm() {
            document.getElementById('addBannerForm').style.display = 'block';
        }

        function hideAddBannerForm() {
            document.getElementById('addBannerForm').style.display = 'none';
        }

        // Custom function to format date for datetime-local input
        function formatDateForInput(dateString) {
            if (!dateString) return '';

            // Handle SQLite datetime format (YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss)
            let date;
            if (dateString.includes('T')) {
                // SQLite format: 2025-09-26T02:53 or 2025-09-26T02:53:00
                date = new Date(dateString);
            } else {
                // Try other common formats
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) return '';

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
        }

        function editBanner(bannerId) {
            // Find banner data
            const banners = ${JSON.stringify(banners)};
            const banner = banners.find(b => b.id == bannerId);

            if (banner) {
                document.getElementById('edit_title').value = banner.title;
                document.getElementById('edit_link_url').value = banner.link_url || '';
                document.getElementById('edit_note').value = banner.note || '';
                document.getElementById('edit_start_date').value = formatDateForInput(banner.start_date);
                document.getElementById('edit_expired_date').value = formatDateForInput(banner.expired_date);
                document.getElementById('edit_display_order').value = banner.display_order;
                document.getElementById('edit_is_active').checked = banner.is_active == 1;

                document.getElementById('editBannerForm').action = '/admin/banners/edit/' + bannerId;
                document.getElementById('editBannerModal').style.display = 'block';
            }
        }

        function closeEditBannerModal() {
            document.getElementById('editBannerModal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('editBannerModal');
            if (event.target == modal) {
                closeEditBannerModal();
            }
        }
    </script>
  `;

  return generateAdminTabPage(
    "Quản lý banners",
    "banners",
    tabContent,
    session,
    categories,
    scripts
  );
}

// Admin Exchange Rates Page Template
function generateAdminExchangeRatesPage(
  exchangeRates,
  session,
  categories = []
) {
  const tabContent = `
    <div class="tab-header">
        <h3>Quản lý tỷ giá ngoại tệ</h3>
        <button onclick="showUploadForm()" class="btn btn-primary">📤 Upload Excel</button>
        <button onclick="clearAllRates()" class="btn btn-danger">🗑️ Xóa tất cả</button>
    </div>

    <!-- Upload Form (Hidden by default) -->
    <div id="uploadForm" class="upload-form" style="display: none;">
        <h4>Upload file Excel tỷ giá</h4>
        <form action="/admin/exchange-rates/upload" method="POST" enctype="multipart/form-data">
            <div class="form-group">
                <label for="excel_file">File Excel *</label>
                <input type="file" id="excel_file" name="excel_file" accept=".xlsx,.xls" required>
                <small>Chỉ chấp nhận file Excel (.xlsx, .xls)</small>
            </div>
            <div class="form-group">
                <label for="notification_date">Ngày thông báo</label>
                <input type="date" id="notification_date" name="notification_date" value="${moment().format(
                  "YYYY-MM-DD"
                )}">
            </div>
            <div class="form-group">
                <label for="notification_number">Lần thông báo</label>
                <input type="number" id="notification_number" name="notification_number" value="1" min="1">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">📤 Upload và cập nhật</button>
                <button type="button" onclick="hideUploadForm()" class="btn btn-secondary">❌ Hủy</button>
            </div>
        </form>
    </div>

    <!-- Exchange Rates Table -->
    <div class="exchange-rates-table">
        <table class="data-table">
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Mã ngoại tệ</th>
                    <th>Mua tiền mặt</th>
                    <th>Mua chuyển khoản</th>
                    <th>Bán</th>
                    <th>Ngày thông báo</th>
                    <th>Lần thông báo</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${exchangeRates
                  .map(
                    (rate, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${rate.currency_code}</strong></td>
                    <td>${
                      rate.cash_buy_rate
                        ? rate.cash_buy_rate.toLocaleString("vi-VN")
                        : "-"
                    }</td>
                    <td>${
                      rate.transfer_buy_rate
                        ? rate.transfer_buy_rate.toLocaleString("vi-VN")
                        : "-"
                    }</td>
                    <td>${
                      rate.sell_rate
                        ? rate.sell_rate.toLocaleString("vi-VN")
                        : "-"
                    }</td>
                    <td>${
                      rate.notification_date
                        ? moment(rate.notification_date).format("DD/MM/YYYY")
                        : "-"
                    }</td>
                    <td>${rate.notification_number || 1}</td>
                    <td>
                        <span class="status-badge ${
                          rate.is_active ? "active" : "inactive"
                        }">
                            ${rate.is_active ? "Hoạt động" : "Tạm dừng"}
                        </span>
                    </td>
                    <td>
                        <button onclick="editRate(${
                          rate.id
                        })" class="btn btn-sm btn-secondary">✏️ Sửa</button>
                        <button onclick="toggleRate(${
                          rate.id
                        })" class="btn btn-sm ${
                      rate.is_active ? "btn-warning" : "btn-success"
                    }">
                            ${rate.is_active ? "⏸️ Tắt" : "▶️ Bật"}
                        </button>
                        <button onclick="deleteRate(${
                          rate.id
                        })" class="btn btn-sm btn-danger">🗑️ Xóa</button>
                    </td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        ${
          exchangeRates.length === 0
            ? '<p style="text-align: center; color: #666; margin-top: 40px;">Chưa có dữ liệu tỷ giá nào. Vui lòng upload file Excel.</p>'
            : ""
        }
    </div>

    <!-- Edit Exchange Rate Modal -->
    <div id="editRateModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h4>Chỉnh sửa tỷ giá</h4>
                <button onclick="closeEditRateModal()" class="modal-close">&times;</button>
            </div>
            <form id="editRateForm" method="POST">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_currency_code">Mã ngoại tệ *</label>
                        <input type="text" id="edit_currency_code" name="currency_code" required readonly>
                    </div>
                    <div class="form-group">
                        <label for="edit_notification_date">Ngày thông báo</label>
                        <input type="date" id="edit_notification_date" name="notification_date">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_cash_buy_rate">Mua tiền mặt</label>
                        <input type="number" id="edit_cash_buy_rate" name="cash_buy_rate" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit_transfer_buy_rate">Mua chuyển khoản</label>
                        <input type="number" id="edit_transfer_buy_rate" name="transfer_buy_rate" step="0.01" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_sell_rate">Bán</label>
                        <input type="number" id="edit_sell_rate" name="sell_rate" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit_notification_number">Lần thông báo</label>
                        <input type="number" id="edit_notification_number" name="notification_number" min="1">
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="edit_is_active" name="is_active" value="1">
                        Tỷ giá đang hoạt động
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Lưu thay đổi</button>
                    <button type="button" onclick="closeEditRateModal()" class="btn btn-secondary">❌ Hủy</button>
                </div>
            </form>
        </div>
    </div>
  `;

  const scripts = `
    <style>
        #editRateForm {
            padding: 20px;
        }
    </style>
    <script>
        function showUploadForm() {
            document.getElementById('uploadForm').style.display = 'block';
        }

        function hideUploadForm() {
            document.getElementById('uploadForm').style.display = 'none';
        }

        function toggleRate(rateId) {
            if (confirm('Bạn có chắc muốn thay đổi trạng thái tỷ giá này?')) {
                fetch('/admin/exchange-rates/toggle/' + rateId, { method: 'POST' })
                    .then(() => location.reload());
            }
        }

        function deleteRate(rateId) {
            if (confirm('Bạn có chắc muốn xóa tỷ giá này?')) {
                fetch('/admin/exchange-rates/delete/' + rateId, { method: 'POST' })
                    .then(() => location.reload());
            }
        }

        function clearAllRates() {
            if (confirm('Bạn có chắc muốn xóa TẤT CẢ tỷ giá? Hành động này không thể hoàn tác!')) {
                fetch('/admin/exchange-rates/clear', { method: 'POST' })
                    .then(() => location.reload());
            }
        }

        function editRate(rateId) {
            // Find rate data
            const rates = ${JSON.stringify(exchangeRates)};
            const rate = rates.find(r => r.id == rateId);

            if (rate) {
                document.getElementById('edit_currency_code').value = rate.currency_code;
                document.getElementById('edit_cash_buy_rate').value = rate.cash_buy_rate || '';
                document.getElementById('edit_transfer_buy_rate').value = rate.transfer_buy_rate || '';
                document.getElementById('edit_sell_rate').value = rate.sell_rate || '';
                document.getElementById('edit_notification_date').value = rate.notification_date || '';
                document.getElementById('edit_notification_number').value = rate.notification_number || 1;
                document.getElementById('edit_is_active').checked = rate.is_active == 1;

                document.getElementById('editRateForm').action = '/admin/exchange-rates/edit/' + rateId;
                document.getElementById('editRateModal').style.display = 'block';
            }
        }

        function closeEditRateModal() {
            document.getElementById('editRateModal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('editRateModal');
            if (event.target == modal) {
                closeEditRateModal();
            }
        }
    </script>
  `;

  return generateAdminTabPage(
    "Quản lý tỷ giá ngoại tệ",
    "exchange-rates",
    tabContent,
    session,
    categories,
    scripts
  );
}

module.exports = {
  generateLoginPage,
  generateHomePage,
  generateUploadPage,
  generateAdminUsersPage,
  generateAdminAnnouncementPage,
  generateAdminBannersPage,
  generateAdminExchangeRatesPage,
  generateAdminDeletedPage,
  generateEditPage,
  generateHistoryPage,
  generateNoPermissionPage,
  generatePostDetailPage,
  generateAdminTabPage,
};
