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
  generateAdminPage,
  generateUsersPage,
  generateEditPage,
  generateHistoryPage,
  generateNoPermissionPage,
  generatePostDetailPage,
} = require("./templates");

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

// Khởi tạo database
const db = new sqlite3.Database("db/intranet.db");

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
        console.log("Đã dọn dẹp categories trùng lặp.");
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
          console.log(`Đã có ${result.count} categories trong database.`);
        }
      });
    }
  );
});

// Helper function to get categories
function getCategories(callback) {
  db.all("SELECT * FROM categories ORDER BY name", (err, categories) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return callback(err, []);
    }
    callback(null, categories || []);
  });
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

      // Lấy danh sách categories với số lượng posts
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

            // Tạo query cho posts với filter category và pagination
            let postsQuery = `
              SELECT p.*, u.full_name as author_name, u.avatar as author_avatar,
                     c.name as category_name, c.icon as category_icon
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
                  postsPerPage
                )
              );
            });
          });
        }
      );
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

// Trang admin
app.get("/admin", requireAdmin, (req, res) => {
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
          generateAdminPage(result ? result.value : "", req.session, categories)
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
      res.redirect("/admin");
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
                  searchTerm // Pass search term
                )
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

// Deleted files management route
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

    res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quản lý file đã xóa - BIDV Intranet Portal</title>
          <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
          <div class="container">
              <div class="page-header">
                  <h2>Quản lý file đã xóa</h2>
                  <a href="/admin" class="btn btn-secondary">Quay lại Admin</a>
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
                                  <td>${(file.size / 1024 / 1024).toFixed(
                                    2
                                  )} MB</td>
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
          </div>

          <script>
              function permanentDelete(fileName) {
                  if (confirm('Bạn có chắc muốn xóa vĩnh viễn file này? Hành động này không thể hoàn tác!')) {
                      fetch('/admin/deleted/permanent/' + encodeURIComponent(fileName), { method: 'DELETE' })
                          .then(() => location.reload());
                  }
              }
          </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error reading deleted files:", error);
    res.status(500).send("Lỗi khi đọc thư mục file đã xóa");
  }
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

// User management routes
app.get("/users", requireAdmin, (req, res) => {
  db.all(
    "SELECT id, username, full_name, avatar, role, status, can_post, created_at FROM users ORDER BY created_at DESC",
    (err, users) => {
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
        res.send(generateUsersPage(users, req.session, categories));
      });
    }
  );
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
      res.redirect("/users");
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
        res.redirect("/users");
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

      db.get("SELECT title FROM posts WHERE id = ?", [postId], (err, post) => {
        if (err || !post) {
          return res.status(404).send("Bài đăng không tồn tại!");
        }

        // Get categories for navigation
        getCategories((err, categories) => {
          if (err) {
            console.error(err);
            categories = [];
          }
          res.send(generateHistoryPage(post, history, req.session, categories));
        });
      });
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
