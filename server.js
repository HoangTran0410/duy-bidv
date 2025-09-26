const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const { marked } = require("marked");
const {
  generateLoginPage,
  generateHomePage,
  generateUploadPage,
  generateAdminUsersPage,
  generateEditPage,
  generateHistoryPage,
  generateNoPermissionPage,
  generatePostDetailPage,
  generateAdminAnnouncementPage,
  generateAdminBannersPage,
  generateAdminExchangeRatesPage,
  generateAdminDeletedPage,
  generateAdminTabPage,
} = require("./templates");

moment.locale("vi");

// Helper function to load files for a post
function loadPostFiles(postId, callback) {
  db.all(
    "SELECT * FROM post_files WHERE post_id = ? ORDER BY file_order, created_at",
    [postId],
    callback
  );
}

// Helper function to get first file for a post (legacy support)
function getFirstFile(postId, callback) {
  db.get(
    "SELECT * FROM post_files WHERE post_id = ? ORDER BY file_order, created_at LIMIT 1",
    [postId],
    callback
  );
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use("/uploads", express.static("uploads")); // Serve uploaded files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set charset to UTF-8 for proper Vietnamese character handling
app.use((req, res, next) => {
  res.charset = "utf-8";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  next();
});

// Session middleware with persistent storage
app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.db",
      dir: "./db/",
    }),
    secret: "bidv-intranet-secret-key-2025",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true in production with HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for remember me
    },
  })
);

// Tạo thư mục uploads nếu chưa có
// Đảm bảo folder uploads và deleted tồn tại
const uploadsDir = path.join(__dirname, "uploads");
const deletedDir = path.join(__dirname, "deleted");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(deletedDir)) {
  fs.mkdirSync(deletedDir, { recursive: true });
}

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Fix UTF-8 encoding for Vietnamese file names
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );

    // Sanitize filename for safety while preserving Vietnamese characters
    const sanitizedName = originalName
      .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
      .replace(/\s+/g, "_"); // Replace spaces with underscores

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + sanitizedName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Chấp nhận các loại file phổ biến
    const allowedExtensions =
      /\.(pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png|gif|zip|rar|mp4|mp3|wav|webm|ogg|webp)$/i;

    const allowedMimeTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      // Videos
      "video/mp4",
      "video/webm",
      // Audio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-zip-compressed",
    ];

    // Fix UTF-8 encoding for file extension check
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );

    const hasValidExtension = allowedExtensions.test(originalName);
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

    console.log(
      `File validation - Name: ${originalName}, MimeType: ${file.mimetype}, ValidExt: ${hasValidExtension}, ValidMime: ${hasValidMimeType}`
    );

    if (hasValidExtension && hasValidMimeType) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          `File không được hỗ trợ! File: ${originalName} (${file.mimetype}). Chỉ chấp nhận: PDF, DOC, DOCX, Excel (XLS/XLSX), TXT, hình ảnh, video, audio và file nén.`
        )
      );
    }
  },
});

// Khởi tạo database với optimizations
const db = new sqlite3.Database("db/intranet.db");

// Apply database optimizations immediately after opening
db.serialize(() => {
  // Enable WAL mode for better concurrency
  db.run("PRAGMA journal_mode = WAL");

  // Increase cache size for better performance
  db.run("PRAGMA cache_size = -64000"); // 64MB cache

  // Enable foreign key constraints
  db.run("PRAGMA foreign_keys = ON");

  // Set synchronous mode for better performance
  db.run("PRAGMA synchronous = NORMAL");

  // Set temp store to memory
  db.run("PRAGMA temp_store = MEMORY");
});

// Tạo tables
db.serialize(() => {
  // Table cho users
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        avatar TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        can_post INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Table cho categories
  db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL,
        color TEXT DEFAULT '#1B7B3A',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Table cho posts (cập nhật với user_id và category_id)
  db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        user_id INTEGER,
        category_id INTEGER,
        view_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'post',
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`);

  // Add columns to existing posts table if they don't exist
  db.run(`ALTER TABLE posts ADD COLUMN category_id INTEGER`, () => {});
  db.run(`ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0`, () => {});

  // Table cho post files (multiple files per post)
  db.run(`CREATE TABLE IF NOT EXISTS post_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        file_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    )`);

  // Table cho edit history
  db.run(`CREATE TABLE IF NOT EXISTS post_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        old_title TEXT,
        old_content TEXT,
        new_title TEXT,
        new_content TEXT,
        edited_by INTEGER,
        edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id),
        FOREIGN KEY (edited_by) REFERENCES users (id)
    )`);

  // Table cho settings (thông báo admin)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Table cho banners (banner quảng cáo)
  db.run(`CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        image_path TEXT NOT NULL,
        link_url TEXT,
        note TEXT,
        start_date DATETIME,
        expired_date DATETIME,
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Table cho exchange rates (tỷ giá ngoại tệ)
  db.run(`CREATE TABLE IF NOT EXISTS exchange_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency_code TEXT NOT NULL,
        cash_buy_rate REAL,
        transfer_buy_rate REAL,
        sell_rate REAL,
        notification_date DATE,
        notification_number INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // ==============================================
  // CREATE OPTIMIZED INDEXES
  // ==============================================

  // Users table indexes
  db.run("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)");
  db.run("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)");
  db.run("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
  db.run("CREATE INDEX IF NOT EXISTS idx_users_can_post ON users(can_post)");

  // Posts table indexes
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id)"
  );
  db.run("CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC)"
  );
  db.run("CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type)");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC)"
  );

  // Composite indexes for common queries
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category_id, created_at DESC)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC)"
  );

  // Post files table indexes
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_post_files_post_id ON post_files(post_id)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_post_files_order ON post_files(post_id, file_order, created_at)"
  );

  // Post history table indexes
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_post_history_post_id ON post_history(post_id)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_post_history_edited_at ON post_history(edited_at DESC)"
  );

  // Settings table indexes
  db.run("CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)");

  // Banners table indexes
  db.run("CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active)");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, expired_date)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order ASC, created_at DESC)"
  );

  // Exchange rates table indexes
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(is_active)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(currency_code)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(notification_date)"
  );

  // Tạo admin mặc định
  const adminPassword = bcrypt.hashSync("admin123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, full_name, role, avatar)
          VALUES ('admin', ?, 'Administrator', 'admin', '/images/admin-avatar.png')`,
    [adminPassword]
  );

  // Thêm thông báo mặc định nếu chưa có
  db.run(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('announcement', '')`
  );

  // Dọn dẹp categories trùng lặp (chỉ chạy một lần)
  db.run(
    `
    DELETE FROM categories
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM categories
      GROUP BY name
    )
  `,
    (err) => {
      if (err) {
        console.error("Lỗi khi dọn dẹp categories trùng lặp:", err);
      } else {
        // console.log("Đã dọn dẹp categories trùng lặp.");
      }

      // Sau khi dọn dẹp, kiểm tra và thêm categories mặc định nếu cần
      db.get("SELECT COUNT(*) as count FROM categories", (err, result) => {
        if (err) {
          console.error("Lỗi khi kiểm tra categories:", err);
          return;
        }

        // Chỉ thêm categories mặc định nếu chưa có dữ liệu
        if (result.count === 0) {
          const defaultCategories = [
            { name: "Thông báo lãi suất", icon: "💰" },
            { name: "Thông báo nội bộ", icon: "📢" },
            { name: "Thông báo tỷ giá", icon: "💱" },
            { name: "Thông báo các khoản vay", icon: "🏦" },
            { name: "Tổ chức nhân sự", icon: "👥" },
            { name: "Lịch công tác của BGĐ", icon: "📅" },
            { name: "Quyết định", icon: "⚖️" },
            { name: "Biếu phí", icon: "💳" },
            { name: "Cơ chế động lực", icon: "🎯" },
            { name: "Hoạt động chi nhánh", icon: "🏢" },
            { name: "Vinh danh", icon: "🏆" },
          ];

          console.log("Thêm categories mặc định...");
          defaultCategories.forEach((category) => {
            db.run(
              `INSERT INTO categories (name, icon) VALUES (?, ?)`,
              [category.name, category.icon],
              (err) => {
                if (err) {
                  console.error(`Lỗi khi thêm category ${category.name}:`, err);
                }
              }
            );
          });
        } else {
          // console.log(`Đã có ${result.count} categories trong database.`);
        }
      });
    }
  );

  // Analyze database for optimization
  db.run("ANALYZE");
});

// Helper function to get categories with optimized query
function getCategories(callback) {
  // Use optimized query with subquery for better performance
  db.all(
    `
    SELECT
      c.id,
      c.name,
      c.icon,
      c.color,
      c.created_at,
      COALESCE(pc.post_count, 0) as post_count
    FROM categories c
    LEFT JOIN (
      SELECT category_id, COUNT(*) as post_count
      FROM posts
      GROUP BY category_id
    ) pc ON c.id = pc.category_id
    ORDER BY c.name
  `,
    (err, categories) => {
      if (err) {
        console.error("Error fetching categories:", err);
        return callback(err, []);
      }
      callback(null, categories || []);
    }
  );
}

// Helper function to parse exchange rates from Excel data
function parseExchangeRatesFromExcel(
  data,
  notificationDate,
  notificationNumber
) {
  const exchangeRates = [];

  // Skip header rows and find the data table
  let dataStartRow = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0) {
      // Look for row that starts with "STT" or contains "Đồng tiền"
      const firstCell = String(row[0] || "").toLowerCase();
      if (
        firstCell.includes("stt") ||
        firstCell.includes("đồng tiền") ||
        firstCell.includes("currency")
      ) {
        dataStartRow = i;
        break;
      }
    }
  }

  if (dataStartRow === -1) {
    console.log("Could not find data table header");
    return exchangeRates;
  }

  // Parse data rows
  for (let i = dataStartRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const stt = row[0];
    const currency = row[2]; // Đồng tiền column
    const cashBuy = row[3]; // Tỷ giá mua tiền mặt
    const transferBuy = row[4]; // Tỷ giá mua chuyển khoản
    const sell = row[5]; // Tỷ giá bán

    // Skip if no currency code
    if (!currency || String(currency).trim() === "") continue;

    // Extract currency code
    const currencyStr = String(currency).trim();
    let currencyCode = currencyStr;

    // Extract currency code from the string
    // const match = currencyStr.match(/([A-Z]{3})/);
    // if (match) {
    //   currencyCode = match[1];
    // } else {
    //   continue; // Skip if we can't identify the currency
    // }

    // Parse numeric values
    const parseRate = (value) => {
      if (!value || value === "" || value === "-") return null;
      const str = String(value).replace(/[,\s]/g, "").replace(/\./g, "");
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
    };

    const cashBuyRate = parseRate(cashBuy);
    const transferBuyRate = parseRate(transferBuy);
    const sellRate = parseRate(sell);

    // Only add if we have at least one valid rate
    if (cashBuyRate || transferBuyRate || sellRate) {
      exchangeRates.push({
        currency_code: currencyCode,
        cash_buy_rate: cashBuyRate,
        transfer_buy_rate: transferBuyRate,
        sell_rate: sellRate,
        notification_date: notificationDate,
        notification_number: parseInt(notificationNumber) || 1,
      });
    }
  }

  console.log(`Parsed ${exchangeRates.length} exchange rates from Excel`);
  return exchangeRates;
}

// Helper function to render markdown to HTML
function renderMarkdown(markdownText) {
  if (!markdownText) return "";

  // Configure marked options for security and Vietnamese support
  marked.setOptions({
    breaks: true, // Convert '\n' to <br>
    gfm: true, // GitHub Flavored Markdown
    headerIds: false, // Disable header IDs for security
    mangle: false, // Don't mangle email addresses
  });

  try {
    return marked(markdownText);
  } catch (error) {
    console.error("Markdown parsing error:", error);
    return markdownText.replace(/\n/g, "<br>"); // Fallback to simple line breaks
  }
}

// Helper function to highlight search terms and extract context
function highlightSearchTerms(text, searchTerm, maxLength = 200) {
  if (!text || !searchTerm) return text;

  // Clean search term - remove special regex characters
  const cleanSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${cleanSearchTerm})`, "gi");

  // Find all matches and their positions
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      text: match[0],
    });
  }

  if (matches.length === 0) {
    // No matches found, return truncated text
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  // Get the first match and extract context around it
  const firstMatch = matches[0];
  const contextStart = Math.max(
    0,
    firstMatch.index - Math.floor(maxLength / 2)
  );
  const contextEnd = Math.min(text.length, contextStart + maxLength);

  let contextText = text.substring(contextStart, contextEnd);

  // Add ellipsis if we're not at the beginning/end
  if (contextStart > 0) contextText = "..." + contextText;
  if (contextEnd < text.length) contextText = contextText + "...";

  // Highlight all search terms in the context
  const highlightedText = contextText.replace(
    regex,
    '<mark class="search-highlight">$1</mark>'
  );

  return highlightedText;
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === "admin") {
    return next();
  } else {
    return res.status(403).send("Không có quyền truy cập!");
  }
}

// Routes
// Login routes
app.get("/login", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/");
  }
  res.send(generateLoginPage());
});

app.post("/login", (req, res) => {
  const { username, password, remember_me } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ? AND status = 'active'",
    [username],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.userName = user.full_name;
        req.session.userAvatar = user.avatar;

        // Set session duration based on remember me checkbox
        if (remember_me) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          console.log(
            `User ${username} logged in with remember me for 30 days`
          );
        } else {
          req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
          console.log(`User ${username} logged in for 24 hours`);
        }

        res.redirect("/");
      } else {
        res.send(generateLoginPage("Tên đăng nhập hoặc mật khẩu không đúng!"));
      }
    }
  );
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/login");
  });
});

// Trang chủ
app.get("/", requireAuth, (req, res) => {
  const selectedCategory = req.query.category || null;
  const currentPage = parseInt(req.query.page) || 1;

  // Lấy thông báo admin
  db.get(
    "SELECT value FROM settings WHERE key = 'announcement'",
    (err, announcement) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      // Lấy danh sách categories với số lượng posts (optimized)
      getCategories((err, categories) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi database");
        }

        // Lấy banners đang hoạt động (optimized)
        db.all(
          `SELECT * FROM banners
                 WHERE is_active = 1
                 AND (start_date IS NULL OR start_date <= datetime('now'))
                 AND (expired_date IS NULL OR expired_date >= datetime('now'))
                 ORDER BY display_order ASC, created_at DESC`,
          (err, banners) => {
            if (err) {
              console.error(err);
              banners = [];
            }

            // Lấy tỷ giá ngoại tệ từ database
            db.all(
              `SELECT * FROM exchange_rates
                     WHERE is_active = 1
                     ORDER BY id ASC`,
              (err, exchangeRates) => {
                if (err) {
                  console.error(err);
                  exchangeRates = [];
                }

                // Pagination settings
                const postsPerPage = 5;
                const offset = (currentPage - 1) * postsPerPage;

                // Tạo count query để đếm tổng số posts
                let countQuery = `SELECT COUNT(*) as total FROM posts p`;
                let countParams = [];

                if (selectedCategory) {
                  countQuery += " WHERE p.category_id = ?";
                  countParams.push(selectedCategory);
                }

                // Đếm tổng số posts trước
                db.get(countQuery, countParams, (err, countResult) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).send("Lỗi database");
                  }

                  const totalPosts = countResult.total;

                  // Tạo query cho posts với filter category và pagination (optimized)
                  let postsQuery = `
                  SELECT
                    p.id,
                    p.title,
                    p.content,
                    p.user_id,
                    p.category_id,
                    p.view_count,
                    p.created_at,
                    p.updated_at,
                    p.type,
                    u.full_name as author_name,
                    u.avatar as author_avatar,
                    c.name as category_name,
                    c.icon as category_icon
                  FROM posts p
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN categories c ON p.category_id = c.id
                `;
                  let queryParams = [];

                  if (selectedCategory) {
                    postsQuery += " WHERE p.category_id = ?";
                    queryParams.push(selectedCategory);
                  }

                  postsQuery += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
                  queryParams.push(postsPerPage, offset);

                  // Lấy danh sách posts cho page hiện tại
                  db.all(postsQuery, queryParams, (err, posts) => {
                    if (err) {
                      console.error(err);
                      return res.status(500).send("Lỗi database");
                    }

                    // Format thời gian và render markdown
                    posts.forEach((post) => {
                      post.formatted_date = moment(post.created_at).format(
                        "DD/MM/YYYY HH:mm"
                      );
                      // Remove file_size_mb since it's no longer in posts table
                      post.content_html = renderMarkdown(post.content);
                    });

                    res.send(
                      generateHomePage(
                        posts,
                        announcement ? announcement.value : "",
                        req.session,
                        categories,
                        currentPage,
                        selectedCategory,
                        totalPosts,
                        postsPerPage,
                        null, // searchTerm
                        banners,
                        exchangeRates
                      )
                    );
                  });
                });
              }
            );
          }
        );
      });
    }
  );
});

// Trang upload
app.get("/upload", requireAuth, (req, res) => {
  // Kiểm tra quyền đăng bài
  db.get(
    "SELECT can_post FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err || !user || !user.can_post) {
        return res
          .status(403)
          .send(
            generateNoPermissionPage(
              req.session,
              "Bạn không có quyền đăng tài liệu. Vui lòng liên hệ quản trị viên để được cấp quyền."
            )
          );
      }

      // Lấy danh sách categories
      db.all("SELECT * FROM categories ORDER BY name", (err, categories) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi database");
        }
        res.send(generateUploadPage(req.session, categories));
      });
    }
  );
});

// Xử lý upload
app.post("/upload", requireAuth, upload.array("files", 10), (req, res) => {
  // Kiểm tra quyền đăng bài trước khi xử lý
  db.get(
    "SELECT can_post FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err || !user || !user.can_post) {
        return res
          .status(403)
          .send(
            generateNoPermissionPage(
              req.session,
              "Bạn không có quyền đăng tài liệu. Vui lòng liên hệ quản trị viên để được cấp quyền."
            )
          );
      }

      const { title, content, category_id } = req.body;
      const files = req.files || [];

      if (!title) {
        return res.status(400).send("Tiêu đề không được để trống!");
      }

      if (!category_id) {
        return res.status(400).send("Vui lòng chọn danh mục!");
      }

      // Insert post first
      db.run(
        `INSERT INTO posts (title, content, category_id, user_id)
                VALUES (?, ?, ?, ?)`,
        [title, content || "", category_id, req.session.userId],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi khi lưu bài đăng!");
          }

          const postId = this.lastID;

          // Insert files if any
          if (files.length > 0) {
            const insertFile = db.prepare(
              `INSERT INTO post_files (post_id, file_path, file_name, file_size, file_order) VALUES (?, ?, ?, ?, ?)`
            );

            files.forEach((file, index) => {
              const fileName = Buffer.from(
                file.originalname,
                "latin1"
              ).toString("utf8");
              insertFile.run([postId, file.path, fileName, file.size, index]);
            });

            insertFile.finalize();
          }

          res.redirect("/");
        }
      );
    }
  );
});

// Trang admin chính - hiển thị tabs
app.get("/admin", requireAdmin, (req, res) => {
  const html = generateAdminTabPage(
    "Quản trị hệ thống",
    "",
    "",
    req.session,
    [],
    ""
  );
  res.send(html);
});

// Admin Users Tab
app.get("/admin/users", requireAdmin, (req, res) => {
  // Get users for admin page
  db.all(
    "SELECT id, username, full_name, avatar, role, status, can_post, created_at FROM users ORDER BY created_at DESC",
    (err, users) => {
      if (err) {
        console.error(err);
        users = [];
      }

      // Get categories for navigation
      getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        res.send(generateAdminUsersPage(users, req.session, categories));
      });
    }
  );
});

// Admin Announcement Tab
app.get("/admin/announcement", requireAdmin, (req, res) => {
  db.get(
    "SELECT value FROM settings WHERE key = 'announcement'",
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      // Get categories for navigation
      getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        res.send(
          generateAdminAnnouncementPage(
            result ? result.value : "",
            req.session,
            categories
          )
        );
      });
    }
  );
});

// Admin Deleted Files Tab
app.get("/admin/deleted", requireAdmin, (req, res) => {
  try {
    const deletedFiles = fs
      .readdirSync(deletedDir)
      .map((fileName) => {
        const filePath = path.join(deletedDir, fileName);
        const stats = fs.statSync(filePath);

        // Parse filename to extract info
        const parts = fileName.split("_");
        const timestamp = parts[0];
        const postIdPart = parts[1] || "";
        const originalName = parts.slice(2).join("_") || fileName;

        return {
          fileName: fileName,
          originalName: originalName,
          timestamp: timestamp,
          postId: postIdPart.replace("postId-", ""),
          size: stats.size,
          deletedAt: stats.ctime,
        };
      })
      .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    // Get categories for navigation
    getCategories((err, categories) => {
      if (err) {
        console.error(err);
        categories = [];
      }
      res.send(generateAdminDeletedPage(deletedFiles, req.session, categories));
    });
  } catch (error) {
    console.error("Error reading deleted files:", error);
    res.status(500).send("Lỗi khi đọc thư mục file đã xóa");
  }
});

// Admin Banners Tab
app.get("/admin/banners", requireAdmin, (req, res) => {
  db.all(
    "SELECT * FROM banners ORDER BY display_order ASC, created_at DESC",
    (err, banners) => {
      if (err) {
        console.error(err);
        banners = [];
      }

      // Get categories for navigation
      getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        res.send(generateAdminBannersPage(banners, req.session, categories));
      });
    }
  );
});

// Admin Exchange Rates Tab
app.get("/admin/exchange-rates", requireAdmin, (req, res) => {
  db.all(
    "SELECT * FROM exchange_rates ORDER BY id ASC, created_at DESC",
    (err, exchangeRates) => {
      if (err) {
        console.error(err);
        exchangeRates = [];
      }

      // Get categories for navigation
      getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        res.send(
          generateAdminExchangeRatesPage(exchangeRates, req.session, categories)
        );
      });
    }
  );
});

// Cập nhật thông báo admin
app.post("/admin/announcement", requireAdmin, (req, res) => {
  const { announcement } = req.body;

  db.run(
    `UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'announcement'`,
    [announcement],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật thông báo!");
      }
      res.redirect("/admin/announcement");
    }
  );
});

// Add banner
app.post(
  "/admin/banners/add",
  requireAdmin,
  upload.single("banner_image"),
  (req, res) => {
    const { title, link_url, note, start_date, expired_date, display_order } =
      req.body;
    const image_path = req.file ? req.file.path : null;

    if (!title || !image_path) {
      return res.status(400).send("Vui lòng điền đầy đủ thông tin bắt buộc!");
    }

    // Format dates properly for SQLite (preserve local time)
    const formatDateForSQLite = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;

      // Format as YYYY-MM-DDTHH:mm in local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    db.run(
      `INSERT INTO banners (title, image_path, link_url, note, start_date, expired_date, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        image_path,
        link_url || null,
        note || null,
        formatDateForSQLite(start_date),
        formatDateForSQLite(expired_date),
        display_order || 0,
      ],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi thêm banner!");
        }
        res.redirect("/admin/banners");
      }
    );
  }
);

// Update banner
app.post(
  "/admin/banners/edit/:id",
  requireAdmin,
  upload.single("banner_image"),
  (req, res) => {
    const bannerId = req.params.id;
    const {
      title,
      link_url,
      note,
      start_date,
      expired_date,
      display_order,
      is_active,
    } = req.body;
    const image_path = req.file ? req.file.path : null;

    if (!title) {
      return res.status(400).send("Vui lòng điền đầy đủ thông tin bắt buộc!");
    }

    // Format dates properly for SQLite (preserve local time)
    const formatDateForSQLite = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;

      // Format as YYYY-MM-DDTHH:mm in local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    let updateQuery, updateParams;

    if (image_path) {
      // Update with new image
      updateQuery = `UPDATE banners SET title = ?, image_path = ?, link_url = ?, note = ?,
                   start_date = ?, expired_date = ?, display_order = ?, is_active = ?,
                   updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      updateParams = [
        title,
        image_path,
        link_url || null,
        note || null,
        formatDateForSQLite(start_date),
        formatDateForSQLite(expired_date),
        display_order || 0,
        is_active ? 1 : 0,
        bannerId,
      ];
    } else {
      // Update without changing image
      updateQuery = `UPDATE banners SET title = ?, link_url = ?, note = ?,
                   start_date = ?, expired_date = ?, display_order = ?, is_active = ?,
                   updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      updateParams = [
        title,
        link_url || null,
        note || null,
        formatDateForSQLite(start_date),
        formatDateForSQLite(expired_date),
        display_order || 0,
        is_active ? 1 : 0,
        bannerId,
      ];
    }

    db.run(updateQuery, updateParams, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật banner!");
      }
      res.redirect("/admin/banners");
    });
  }
);

// Delete banner
app.post("/admin/banners/delete/:id", requireAdmin, (req, res) => {
  const bannerId = req.params.id;

  db.run("DELETE FROM banners WHERE id = ?", [bannerId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi xóa banner!");
    }
    res.redirect("/admin/banners");
  });
});

// Exchange Rates Upload
app.post(
  "/admin/exchange-rates/upload",
  requireAdmin,
  upload.single("excel_file"),
  (req, res) => {
    const { notification_date, notification_number } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).send("Vui lòng chọn file Excel!");
    }

    try {
      const XLSX = require("xlsx");
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parse exchange rates from Excel data
      const exchangeRates = parseExchangeRatesFromExcel(
        data,
        notification_date,
        notification_number
      );

      if (exchangeRates.length === 0) {
        return res
          .status(400)
          .send("Không tìm thấy dữ liệu tỷ giá hợp lệ trong file Excel!");
      }

      // Clear existing rates and insert new ones
      db.run("DELETE FROM exchange_rates", (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi xóa tỷ giá cũ!");
        }

        // Insert new rates
        const insertStmt = db.prepare(`
           INSERT INTO exchange_rates (currency_code, cash_buy_rate, transfer_buy_rate, sell_rate, notification_date, notification_number)
           VALUES (?, ?, ?, ?, ?, ?)
         `);

        exchangeRates.forEach((rate) => {
          insertStmt.run([
            rate.currency_code,
            rate.cash_buy_rate,
            rate.transfer_buy_rate,
            rate.sell_rate,
            rate.notification_date,
            rate.notification_number,
          ]);
        });

        insertStmt.finalize();

        // Delete uploaded file
        fs.unlinkSync(file.path);

        res.redirect("/admin/exchange-rates");
      });
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      res.status(500).send("Lỗi khi đọc file Excel: " + error.message);
    }
  }
);

// Toggle exchange rate status
app.post("/admin/exchange-rates/toggle/:id", requireAdmin, (req, res) => {
  const rateId = req.params.id;

  db.get(
    "SELECT is_active FROM exchange_rates WHERE id = ?",
    [rateId],
    (err, rate) => {
      if (err || !rate) {
        return res.status(404).send("Tỷ giá không tồn tại!");
      }

      const newStatus = rate.is_active ? 0 : 1;

      db.run(
        "UPDATE exchange_rates SET is_active = ? WHERE id = ?",
        [newStatus, rateId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi khi cập nhật trạng thái!");
          }
          res.redirect("/admin/exchange-rates");
        }
      );
    }
  );
});

// Delete exchange rate
app.post("/admin/exchange-rates/delete/:id", requireAdmin, (req, res) => {
  const rateId = req.params.id;

  db.run("DELETE FROM exchange_rates WHERE id = ?", [rateId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi xóa tỷ giá!");
    }
    res.redirect("/admin/exchange-rates");
  });
});

// Clear all exchange rates
app.post("/admin/exchange-rates/clear", requireAdmin, (req, res) => {
  db.run("DELETE FROM exchange_rates", (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi xóa tất cả tỷ giá!");
    }
    res.redirect("/admin/exchange-rates");
  });
});

// Edit exchange rate
app.post("/admin/exchange-rates/edit/:id", requireAdmin, (req, res) => {
  const rateId = req.params.id;
  const {
    currency_code,
    cash_buy_rate,
    transfer_buy_rate,
    sell_rate,
    notification_date,
    notification_number,
    is_active,
  } = req.body;

  // Validate required fields
  if (!currency_code) {
    return res.status(400).send("Mã ngoại tệ không được để trống!");
  }

  // Convert empty strings to null for optional fields
  const cashBuyRate = cash_buy_rate === "" ? null : parseFloat(cash_buy_rate);
  const transferBuyRate =
    transfer_buy_rate === "" ? null : parseFloat(transfer_buy_rate);
  const sellRate = sell_rate === "" ? null : parseFloat(sell_rate);

  db.run(
    `UPDATE exchange_rates
     SET currency_code = ?, cash_buy_rate = ?, transfer_buy_rate = ?, sell_rate = ?,
         notification_date = ?, notification_number = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      currency_code,
      cashBuyRate,
      transferBuyRate,
      sellRate,
      notification_date || null,
      parseInt(notification_number) || 1,
      is_active ? 1 : 0,
      rateId,
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật tỷ giá!");
      }
      res.redirect("/admin/exchange-rates");
    }
  );
});

// Search posts
app.get("/search", requireAuth, (req, res) => {
  const searchTerm = req.query.q || "";
  const currentPage = parseInt(req.query.page) || 1;

  if (!searchTerm.trim()) {
    return res.redirect("/");
  }

  // Get categories for navigation
  db.all(
    `SELECT c.*, COUNT(p.id) as post_count
     FROM categories c
     LEFT JOIN posts p ON c.id = p.category_id
     GROUP BY c.id
     ORDER BY c.name`,
    (err, categories) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      // Pagination settings
      const postsPerPage = 5;
      const offset = (currentPage - 1) * postsPerPage;

      // Count total search results - search in posts and post_files (case-insensitive)
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN post_files pf ON p.id = pf.post_id
        WHERE p.title LIKE ? COLLATE NOCASE OR p.content LIKE ? COLLATE NOCASE OR pf.file_name LIKE ? COLLATE NOCASE
      `;
      const searchPattern = `%${searchTerm}%`;

      db.get(
        countQuery,
        [searchPattern, searchPattern, searchPattern],
        (err, countResult) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi database");
          }

          const totalPosts = countResult.total;

          // Search query with pagination - search in posts and post_files (case-insensitive)
          const searchQuery = `
          SELECT DISTINCT p.*, u.full_name as author_name, u.avatar as author_avatar,
                 c.name as category_name, c.icon as category_icon
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN post_files pf ON p.id = pf.post_id
          WHERE p.title LIKE ? COLLATE NOCASE OR p.content LIKE ? COLLATE NOCASE OR pf.file_name LIKE ? COLLATE NOCASE
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `;

          db.all(
            searchQuery,
            [searchPattern, searchPattern, searchPattern, postsPerPage, offset],
            (err, posts) => {
              if (err) {
                console.error(err);
                return res.status(500).send("Lỗi database");
              }

              // Format posts và render markdown with search highlighting
              posts.forEach((post) => {
                post.formatted_date = moment(post.created_at).format(
                  "DD/MM/YYYY HH:mm"
                );

                // Highlight search terms in title
                post.highlighted_title = highlightSearchTerms(
                  post.title,
                  searchTerm,
                  100
                );

                // Highlight search terms in content and render markdown
                if (post.content) {
                  const highlightedContent = highlightSearchTerms(
                    post.content,
                    searchTerm,
                    300
                  );
                  post.content_html = renderMarkdown(highlightedContent);
                } else {
                  post.content_html = "";
                }
              });

              // Get exchange rates for search page
              db.all(
                `SELECT * FROM exchange_rates
                 WHERE is_active = 1
                 ORDER BY id ASC`,
                (err, exchangeRates) => {
                  if (err) {
                    console.error(err);
                    exchangeRates = [];
                  }

                  res.send(
                    generateHomePage(
                      posts,
                      "", // No announcement for search results
                      req.session,
                      categories,
                      currentPage,
                      null, // No selected category
                      totalPosts,
                      postsPerPage,
                      searchTerm, // Pass search term
                      [], // No banners for search
                      exchangeRates
                    )
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// View single post and increment view count
app.get("/post/:id", requireAuth, (req, res) => {
  const postId = req.params.id;

  // Increment view count
  db.run(
    "UPDATE posts SET view_count = view_count + 1 WHERE id = ?",
    [postId],
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );

  // Get categories for navigation
  db.all(
    `SELECT c.*, COUNT(p.id) as post_count
     FROM categories c
     LEFT JOIN posts p ON c.id = p.category_id
     GROUP BY c.id
     ORDER BY c.name`,
    (err, categories) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      // Get post details
      db.get(
        `SELECT p.*, u.full_name as author_name, u.avatar as author_avatar,
                c.name as category_name, c.icon as category_icon
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [postId],
        (err, post) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi database");
          }

          if (!post) {
            return res.status(404).send("Bài viết không tồn tại!");
          }

          // Format date và render markdown
          post.formatted_date = moment(post.created_at).format(
            "DD/MM/YYYY HH:mm"
          );
          post.content_html = renderMarkdown(post.content);

          // Load post files
          loadPostFiles(postId, (err, files) => {
            if (err) {
              console.error(err);
              files = [];
            }

            post.files = files;

            // Show post detail page
            res.send(generatePostDetailPage(post, req.session, categories));
          });
        }
      );
    }
  );
});

// Download file (legacy - redirects to first file)
app.get("/download/:id", requireAuth, (req, res) => {
  const postId = req.params.id;
  const download = req.query.download === "true"; // Check if forced download

  getFirstFile(postId, (err, file) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi database");
    }

    if (!file || !file.file_path) {
      return res.status(404).send("File không tồn tại!");
    }

    const filePath = path.join(__dirname, file.file_path);
    if (fs.existsSync(filePath)) {
      // Get file extension to set proper content type
      const ext = file.file_name.toLowerCase().split(".").pop();

      // Set content type based on file extension
      const contentTypes = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        mp4: "video/mp4",
        webm: "video/webm",
        ogg: "video/ogg",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        xls: "application/vnd.ms-excel",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        doc: "application/msword",
      };

      const contentType = contentTypes[ext] || "application/octet-stream";

      if (download) {
        // Force download
        res.download(filePath, file.file_name);
      } else {
        // Allow inline viewing
        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${file.file_name}"`
        );
        res.sendFile(filePath);
      }
    } else {
      res.status(404).send("File không tìm thấy!");
    }
  });
});

// Download file by file ID (new multiple files support)
app.get("/download/file/:fileId", requireAuth, (req, res) => {
  const fileId = req.params.fileId;
  const download = req.query.download === "true"; // Check if forced download

  db.get("SELECT * FROM post_files WHERE id = ?", [fileId], (err, file) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi database");
    }

    if (!file || !file.file_path) {
      return res.status(404).send("File không tồn tại!");
    }

    const filePath = path.join(__dirname, file.file_path);
    if (fs.existsSync(filePath)) {
      // Get file extension to set proper content type
      const ext = file.file_name.toLowerCase().split(".").pop();

      // Set content type based on file extension
      const contentTypes = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        mp4: "video/mp4",
        webm: "video/webm",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
      };

      const contentType = contentTypes[ext] || "application/octet-stream";

      if (download) {
        // Force download
        res.download(filePath, file.file_name);
      } else {
        // Allow inline viewing
        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${file.file_name}"`
        );
        res.sendFile(filePath);
      }
    } else {
      res.status(404).send("File không tìm thấy!");
    }
  });
});

// Xóa post (move files to deleted folder)
app.post("/delete/:id", requireAuth, (req, res) => {
  const postId = req.params.id;

  // Move all files to deleted folder instead of deleting
  loadPostFiles(postId, (err, files) => {
    if (!err && files && files.length > 0) {
      files.forEach((file) => {
        if (file.file_path && fs.existsSync(file.file_path)) {
          try {
            // Create unique filename in deleted folder with timestamp
            const fileName = path.basename(file.file_path);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const deletedFileName = `${timestamp}_postId-${postId}_fileId-${file.id}_${fileName}`;
            const deletedFilePath = path.join(deletedDir, deletedFileName);

            // Move file to deleted folder
            fs.renameSync(file.file_path, deletedFilePath);
            console.log(`File moved to deleted folder: ${deletedFileName}`);
          } catch (moveError) {
            console.error("Error moving file to deleted folder:", moveError);
            // Continue with post deletion even if file move fails
          }
        }
      });
    }

    // Delete post and its files from database
    db.run("DELETE FROM posts WHERE id = ?", [postId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi xóa bài đăng!");
      }
      res.redirect("/");
    });
  });
});

// Download deleted file
app.get("/admin/deleted/download/:fileName", requireAdmin, (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(deletedDir, fileName);

  if (fs.existsSync(filePath)) {
    // Extract original name for download
    const parts = fileName.split("_");
    const originalName = parts.slice(2).join("_") || fileName;

    res.download(filePath, originalName);
  } else {
    res.status(404).send("File đã xóa không tồn tại!");
  }
});

// Permanently delete file
app.delete("/admin/deleted/permanent/:fileName", requireAdmin, (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(deletedDir, fileName);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Permanently deleted file: ${fileName}`);
      res.status(200).send("File đã được xóa vĩnh viễn");
    } catch (error) {
      console.error("Error permanently deleting file:", error);
      res.status(500).send("Lỗi khi xóa file vĩnh viễn");
    }
  } else {
    res.status(404).send("File không tồn tại!");
  }
});

app.post("/users/add", requireAdmin, (req, res) => {
  const { username, password, full_name, role, can_post } = req.body;

  if (!username || !password || !full_name) {
    return res.status(400).send("Vui lòng điền đầy đủ thông tin!");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (username, password, full_name, role, can_post) VALUES (?, ?, ?, ?, ?)",
    [username, hashedPassword, full_name, role || "user", can_post ? 1 : 0],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi tạo user!");
      }
      res.redirect("/admin/users");
    }
  );
});

app.post("/users/toggle/:id", requireAdmin, (req, res) => {
  const userId = req.params.id;

  db.get("SELECT status FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).send("User không tồn tại!");
    }

    const newStatus = user.status === "active" ? "inactive" : "active";

    db.run(
      "UPDATE users SET status = ? WHERE id = ?",
      [newStatus, userId],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi cập nhật trạng thái!");
        }
        res.redirect("/admin/users");
      }
    );
  });
});

// Edit post routes
app.get("/edit/:id", requireAuth, (req, res) => {
  const postId = req.params.id;

  db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi database");
    }

    if (!post) {
      return res.status(404).send("Bài đăng không tồn tại!");
    }

    // Chỉ cho phép admin hoặc chủ bài đăng chỉnh sửa
    if (
      req.session.userRole !== "admin" &&
      post.user_id !== req.session.userId
    ) {
      return res.status(403).send("Bạn không có quyền chỉnh sửa bài đăng này!");
    }

    // Get categories for navigation
    getCategories((err, categories) => {
      if (err) {
        console.error(err);
        categories = [];
      }

      // Load post files
      loadPostFiles(postId, (err, files) => {
        if (err) {
          console.error(err);
          files = [];
        }

        post.files = files;
        res.send(generateEditPage(post, req.session, categories));
      });
    });
  });
});

app.post(
  "/edit/:id",
  requireAuth,
  upload.array("new_files", 10),
  (req, res) => {
    const postId = req.params.id;
    const { title, content, category_id, remove_files } = req.body;
    const newFiles = req.files || [];

    if (!title) {
      return res.status(400).send("Tiêu đề không được để trống!");
    }

    if (!category_id) {
      return res.status(400).send("Vui lòng chọn danh mục!");
    }

    // Lấy thông tin bài đăng cũ để lưu lịch sử
    db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, oldPost) => {
      if (err || !oldPost) {
        return res.status(404).send("Bài đăng không tồn tại!");
      }

      // Kiểm tra quyền chỉnh sửa
      if (
        req.session.userRole !== "admin" &&
        oldPost.user_id !== req.session.userId
      ) {
        return res
          .status(403)
          .send("Bạn không có quyền chỉnh sửa bài đăng này!");
      }

      // Handle file operations
      // 1. Remove files marked for deletion
      if (remove_files && Array.isArray(remove_files)) {
        remove_files.forEach((fileId) => {
          if (fileId) {
            db.get(
              "SELECT * FROM post_files WHERE id = ? AND post_id = ?",
              [fileId, postId],
              (err, file) => {
                if (
                  !err &&
                  file &&
                  file.file_path &&
                  fs.existsSync(file.file_path)
                ) {
                  const deletedPath = path.join(
                    "deleted",
                    path.basename(file.file_path)
                  );
                  fs.renameSync(file.file_path, deletedPath);
                }
                db.run("DELETE FROM post_files WHERE id = ?", [fileId]);
              }
            );
          }
        });
      }

      // Legacy file handling is no longer needed

      // Lưu lịch sử chỉnh sửa
      db.run(
        "INSERT INTO post_history (post_id, old_title, old_content, new_title, new_content, edited_by) VALUES (?, ?, ?, ?, ?, ?)",
        [
          postId,
          oldPost.title,
          oldPost.content,
          title,
          content || "",
          req.session.userId,
        ],
        (err) => {
          if (err) {
            console.error(err);
          }
        }
      );

      // 3. Add new files
      if (newFiles.length > 0) {
        const insertFile = db.prepare(
          `INSERT INTO post_files (post_id, file_path, file_name, file_size, file_order) VALUES (?, ?, ?, ?, ?)`
        );

        newFiles.forEach((file, index) => {
          const fileName = Buffer.from(file.originalname, "latin1").toString(
            "utf8"
          );
          insertFile.run([postId, file.path, fileName, file.size, index]);
        });

        insertFile.finalize();
      }

      // Update post information
      db.run(
        "UPDATE posts SET title = ?, content = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [title, content || "", category_id, postId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi khi cập nhật bài đăng!");
          }
          res.redirect("/post/" + postId);
        }
      );
    });
  }
);

// View edit history
app.get("/history/:id", requireAuth, (req, res) => {
  const postId = req.params.id;

  db.all(
    `SELECT h.*, u.full_name as editor_name
          FROM post_history h
          LEFT JOIN users u ON h.edited_by = u.id
          WHERE h.post_id = ?
          ORDER BY h.edited_at DESC`,
    [postId],
    (err, history) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      db.get(
        "SELECT title, id FROM posts WHERE id = ?",
        [postId],
        (err, post) => {
          if (err || !post) {
            return res.status(404).send("Bài đăng không tồn tại!");
          }

          // Get categories for navigation
          getCategories((err, categories) => {
            if (err) {
              console.error(err);
              categories = [];
            }
            res.send(
              generateHistoryPage(post, history, req.session, categories)
            );
          });
        }
      );
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Intranet Portal đang chạy tại http://localhost:${PORT}`);
  console.log(`📂 Upload folder: ${uploadsDir}`);
  console.log(`🗄️  Database: intranet.db`);
});

// Templates are now imported from templates.js
