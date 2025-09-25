const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const {
  generateLoginPage,
  generateHomePage,
  generateUploadPage,
  generateAdminPage,
  generateUsersPage,
  generateEditPage,
  generateHistoryPage,
  generateNoPermissionPage,
} = require("./templates");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: "bidv-intranet-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Chấp nhận các loại file phổ biến
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|gif|zip|rar/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Chỉ chấp nhận file PDF, DOC, DOCX, TXT, hình ảnh và file nén!"
        )
      );
    }
  },
});

// Khởi tạo database
const db = new sqlite3.Database("intranet.db");

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
        file_path TEXT,
        file_name TEXT,
        file_size INTEGER,
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
            { name: "Thông báo tỷ giá", icon: "💱" },
            { name: "Thông báo nội bộ", icon: "📢" },
            { name: "Thông báo các khoản vay", icon: "🏦" },
            { name: "Quyết định", icon: "⚖️" },
            { name: "Biếu phí", icon: "💳" },
            { name: "Lịch công tác", icon: "📅" },
            { name: "Cơ chế động lực", icon: "🎯" },
            { name: "Hoạt động chi nhánh", icon: "🏢" },
            { name: "Vinh danh", icon: "🏆" },
            { name: "Tổ chức nhân sự", icon: "👥" },
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
  const { username, password } = req.body;

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

          // Tạo query cho posts với filter category
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

          postsQuery += " ORDER BY p.created_at DESC LIMIT 20";

          // Lấy danh sách posts mới nhất với thông tin user và category
          db.all(postsQuery, queryParams, (err, posts) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Lỗi database");
            }

            // Format thời gian
            posts.forEach((post) => {
              post.formatted_date = moment(post.created_at).format(
                "DD/MM/YYYY HH:mm"
              );
              post.file_size_mb = post.file_size
                ? (post.file_size / (1024 * 1024)).toFixed(2)
                : null;
            });

            res.send(
              generateHomePage(
                posts,
                announcement ? announcement.value : "",
                req.session,
                categories
              )
            );
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
app.post("/upload", requireAuth, upload.single("file"), (req, res) => {
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
      const file = req.file;

      if (!title) {
        return res.status(400).send("Tiêu đề không được để trống!");
      }

      if (!category_id) {
        return res.status(400).send("Vui lòng chọn danh mục!");
      }

      const filePath = file ? file.path : null;
      const fileName = file ? file.originalname : null;
      const fileSize = file ? file.size : null;

      db.run(
        `INSERT INTO posts (title, content, file_path, file_name, file_size, category_id, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          content || "",
          filePath,
          fileName,
          fileSize,
          category_id,
          req.session.userId,
        ],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi khi lưu bài đăng!");
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
      res.send(generateAdminPage(result ? result.value : "", req.session));
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

      // Redirect back to home page for now, later we can create a dedicated post view
      res.redirect("/");
    }
  );
});

// Download file
app.get("/download/:id", requireAuth, (req, res) => {
  const postId = req.params.id;

  db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi database");
    }

    if (!post || !post.file_path) {
      return res.status(404).send("File không tồn tại!");
    }

    const filePath = path.join(__dirname, post.file_path);
    if (fs.existsSync(filePath)) {
      res.download(filePath, post.file_name);
    } else {
      res.status(404).send("File không tìm thấy!");
    }
  });
});

// Xóa post
app.post("/delete/:id", requireAuth, (req, res) => {
  const postId = req.params.id;

  db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi database");
    }

    if (post && post.file_path) {
      const filePath = path.join(__dirname, post.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.run("DELETE FROM posts WHERE id = ?", [postId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi xóa bài đăng!");
      }
      res.redirect("/");
    });
  });
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
      res.send(generateUsersPage(users, req.session));
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

    res.send(generateEditPage(post, req.session));
  });
});

app.post("/edit/:id", requireAuth, (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;

  if (!title) {
    return res.status(400).send("Tiêu đề không được để trống!");
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
      return res.status(403).send("Bạn không có quyền chỉnh sửa bài đăng này!");
    }

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

    // Cập nhật bài đăng
    db.run(
      "UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, content || "", postId],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi cập nhật bài đăng!");
        }
        res.redirect("/");
      }
    );
  });
});

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

        res.send(generateHistoryPage(post, history, req.session));
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
