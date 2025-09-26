// Database module - handles all database operations and optimizations
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { marked } = require("marked");

class Database {
  constructor(dbPath = "db/intranet.db") {
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  // Initialize database with optimizations
  initializeDatabase() {
    this.db.serialize(() => {
      // Apply database optimizations
      this.db.run("PRAGMA journal_mode = WAL");
      this.db.run("PRAGMA cache_size = -64000"); // 64MB cache
      this.db.run("PRAGMA foreign_keys = ON");
      this.db.run("PRAGMA synchronous = NORMAL");
      this.db.run("PRAGMA temp_store = MEMORY");

      this.createTables();
      this.createIndexes();
      this.initializeDefaultData();
    });
  }

  // Create all database tables
  createTables() {
    // Users table
    this.db.run(`CREATE TABLE IF NOT EXISTS users (
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

    // Categories table
    this.db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      color TEXT DEFAULT '#1B7B3A',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Posts table
    this.db.run(`CREATE TABLE IF NOT EXISTS posts (
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
    this.db.run(`ALTER TABLE posts ADD COLUMN category_id INTEGER`, () => {});
    this.db.run(
      `ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0`,
      () => {}
    );

    // Post files table
    this.db.run(`CREATE TABLE IF NOT EXISTS post_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      file_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    )`);

    // Post history table
    this.db.run(`CREATE TABLE IF NOT EXISTS post_history (
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

    // Settings table
    this.db.run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Banners table
    this.db.run(`CREATE TABLE IF NOT EXISTS banners (
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

    // Exchange rates table
    this.db.run(`CREATE TABLE IF NOT EXISTS exchange_rates (
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
  }

  // Create optimized indexes
  createIndexes() {
    // Users table indexes
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"
    );
    this.db.run("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)");
    this.db.run("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_users_can_post ON users(can_post)"
    );

    // Posts table indexes
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC)"
    );
    this.db.run("CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type)");
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC)"
    );

    // Composite indexes for common queries
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category_id, created_at DESC)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC)"
    );

    // Post files table indexes
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_post_files_post_id ON post_files(post_id)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_post_files_order ON post_files(post_id, file_order, created_at)"
    );

    // Post history table indexes
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_post_history_post_id ON post_history(post_id)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_post_history_edited_at ON post_history(edited_at DESC)"
    );

    // Settings table indexes
    this.db.run("CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)");

    // Banners table indexes
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, expired_date)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order ASC, created_at DESC)"
    );

    // Exchange rates table indexes
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(is_active)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(currency_code)"
    );
    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(notification_date)"
    );
  }

  // Initialize default data
  initializeDefaultData() {
    // Create admin user
    const adminPassword = bcrypt.hashSync("admin123", 10);
    this.db.run(
      `INSERT OR IGNORE INTO users (username, password, full_name, role, avatar)
       VALUES ('admin', ?, 'Administrator', 'admin', '/images/admin-avatar.png')`,
      [adminPassword]
    );

    // Add default announcement
    this.db.run(
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('announcement', '')`
    );

    // Clean up duplicate categories
    this.db.run(
      `DELETE FROM categories
       WHERE id NOT IN (
         SELECT MIN(id)
         FROM categories
         GROUP BY name
       )`,
      (err) => {
        if (err) {
          console.error("Lỗi khi dọn dẹp categories trùng lặp:", err);
        } else {
          this.addDefaultCategories();
        }
      }
    );

    // Analyze database for optimization
    this.db.run("ANALYZE");
  }

  // Add default categories
  addDefaultCategories() {
    this.db.get("SELECT COUNT(*) as count FROM categories", (err, result) => {
      if (err) {
        console.error("Lỗi khi kiểm tra categories:", err);
        return;
      }

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
        const insertCategory = this.db.prepare(
          "INSERT INTO categories (name, icon) VALUES (?, ?)"
        );
        defaultCategories.forEach((category) => {
          insertCategory.run([category.name, category.icon]);
        });
        insertCategory.finalize();
      }
    });
  }

  // ==============================================
  // USER OPERATIONS
  // ==============================================

  // Authenticate user
  authenticateUser(username, password, callback) {
    this.db.get(
      "SELECT id, username, password, full_name, role, avatar, can_post FROM users WHERE username = ? AND status = 'active'",
      [username],
      (err, user) => {
        if (err) {
          return callback(err, null);
        }
        if (user && bcrypt.compareSync(password, user.password)) {
          callback(null, user);
        } else {
          callback(null, null);
        }
      }
    );
  }

  // Get user by ID
  getUserById(userId, callback) {
    this.db.get("SELECT * FROM users WHERE id = ?", [userId], callback);
  }

  // Get all users
  getAllUsers(callback) {
    this.db.all(
      "SELECT id, username, full_name, avatar, role, status, can_post, created_at FROM users ORDER BY created_at DESC",
      callback
    );
  }

  // Create user
  createUser(userData, callback) {
    const { username, password, full_name, role, can_post } = userData;
    const hashedPassword = bcrypt.hashSync(password, 10);

    this.db.run(
      "INSERT INTO users (username, password, full_name, role, can_post) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, full_name, role || "user", can_post ? 1 : 0],
      callback
    );
  }

  // Toggle user status
  toggleUserStatus(userId, callback) {
    this.db.get(
      "SELECT status FROM users WHERE id = ?",
      [userId],
      (err, user) => {
        if (err || !user) {
          return callback(err || new Error("User not found"));
        }

        const newStatus = user.status === "active" ? "inactive" : "active";
        this.db.run(
          "UPDATE users SET status = ? WHERE id = ?",
          [newStatus, userId],
          callback
        );
      }
    );
  }

  // ==============================================
  // CATEGORY OPERATIONS
  // ==============================================

  // Get all categories with post counts
  getCategories(callback) {
    this.db.all(
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

  // ==============================================
  // POST OPERATIONS
  // ==============================================

  // Get posts with pagination
  getPostsWithPagination(categoryId, page, limit, callback) {
    const offset = (page - 1) * limit;

    // Count query
    let countQuery = "SELECT COUNT(*) as total FROM posts";
    let countParams = [];

    if (categoryId) {
      countQuery += " WHERE category_id = ?";
      countParams.push(categoryId);
    }

    this.db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return callback(err, null, 0);
      }

      const totalPosts = countResult.total;

      // Posts query with optimized joins
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

      if (categoryId) {
        postsQuery += " WHERE p.category_id = ?";
        queryParams.push(categoryId);
      }

      postsQuery += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
      queryParams.push(limit, offset);

      this.db.all(postsQuery, queryParams, (err, posts) => {
        if (err) {
          return callback(err, null, totalPosts);
        }

        // Format posts
        posts.forEach((post) => {
          post.formatted_date = moment(post.created_at).format(
            "DD/MM/YYYY HH:mm"
          );
          post.content_html = this.renderMarkdown(post.content);
        });

        callback(null, posts, totalPosts);
      });
    });
  }

  // Get single post
  getPostById(postId, callback) {
    this.db.get(
      `SELECT p.*, u.full_name as author_name, u.avatar as author_avatar,
              c.name as category_name, c.icon as category_icon
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [postId],
      callback
    );
  }

  // Create post
  createPost(postData, callback) {
    const { title, content, category_id, user_id } = postData;

    this.db.run(
      `INSERT INTO posts (title, content, category_id, user_id)
       VALUES (?, ?, ?, ?)`,
      [title, content || "", category_id, user_id],
      function (err) {
        if (err) {
          return callback(err);
        }
        callback(null, this.lastID);
      }
    );
  }

  // Update post
  updatePost(postId, postData, callback) {
    const { title, content, category_id } = postData;

    this.db.run(
      "UPDATE posts SET title = ?, content = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, content || "", category_id, postId],
      callback
    );
  }

  // Delete post
  deletePost(postId, callback) {
    this.db.run("DELETE FROM posts WHERE id = ?", [postId], callback);
  }

  // Increment view count
  incrementViewCount(postId, callback) {
    this.db.run(
      "UPDATE posts SET view_count = view_count + 1 WHERE id = ?",
      [postId],
      callback
    );
  }

  // ==============================================
  // POST FILES OPERATIONS
  // ==============================================

  // Load files for a post
  loadPostFiles(postId, callback) {
    this.db.all(
      "SELECT * FROM post_files WHERE post_id = ? ORDER BY file_order, created_at",
      [postId],
      callback
    );
  }

  // Get first file for a post
  getFirstFile(postId, callback) {
    this.db.get(
      "SELECT * FROM post_files WHERE post_id = ? ORDER BY file_order, created_at LIMIT 1",
      [postId],
      callback
    );
  }

  // Get file by ID
  getFileById(fileId, callback) {
    this.db.get("SELECT * FROM post_files WHERE id = ?", [fileId], callback);
  }

  // Add files to post
  addFilesToPost(postId, files, callback) {
    if (files.length === 0) {
      return callback(null);
    }

    const insertFile = this.db.prepare(
      `INSERT INTO post_files (post_id, file_path, file_name, file_size, file_order) VALUES (?, ?, ?, ?, ?)`
    );

    files.forEach((file, index) => {
      const fileName = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      );
      insertFile.run([postId, file.path, fileName, file.size, index]);
    });

    insertFile.finalize();
    callback(null);
  }

  // Delete file
  deleteFile(fileId, callback) {
    this.db.run("DELETE FROM post_files WHERE id = ?", [fileId], callback);
  }

  // ==============================================
  // POST HISTORY OPERATIONS
  // ==============================================

  // Add post history
  addPostHistory(historyData, callback) {
    const {
      post_id,
      old_title,
      old_content,
      new_title,
      new_content,
      edited_by,
    } = historyData;

    this.db.run(
      "INSERT INTO post_history (post_id, old_title, old_content, new_title, new_content, edited_by) VALUES (?, ?, ?, ?, ?, ?)",
      [post_id, old_title, old_content, new_title, new_content, edited_by],
      callback
    );
  }

  // Get post history
  getPostHistory(postId, callback) {
    this.db.all(
      `SELECT h.*, u.full_name as editor_name
       FROM post_history h
       LEFT JOIN users u ON h.edited_by = u.id
       WHERE h.post_id = ?
       ORDER BY h.edited_at DESC`,
      [postId],
      callback
    );
  }

  // ==============================================
  // SEARCH OPERATIONS
  // ==============================================

  // Search posts
  searchPosts(searchTerm, page, limit, callback) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    // Count query for search results
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM posts p
      LEFT JOIN post_files pf ON p.id = pf.post_id
      WHERE p.title LIKE ? COLLATE NOCASE
         OR p.content LIKE ? COLLATE NOCASE
         OR pf.file_name LIKE ? COLLATE NOCASE
    `;

    this.db.get(
      countQuery,
      [searchPattern, searchPattern, searchPattern],
      (err, countResult) => {
        if (err) {
          return callback(err, null, 0);
        }

        const totalPosts = countResult.total;

        // Search query with optimized joins
        const searchQuery = `
        SELECT DISTINCT
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
        LEFT JOIN post_files pf ON p.id = pf.post_id
        WHERE p.title LIKE ? COLLATE NOCASE
           OR p.content LIKE ? COLLATE NOCASE
           OR pf.file_name LIKE ? COLLATE NOCASE
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

        this.db.all(
          searchQuery,
          [searchPattern, searchPattern, searchPattern, limit, offset],
          (err, posts) => {
            if (err) {
              return callback(err, null, totalPosts);
            }

            // Format posts with search highlighting
            posts.forEach((post) => {
              post.formatted_date = moment(post.created_at).format(
                "DD/MM/YYYY HH:mm"
              );
              post.highlighted_title = this.highlightSearchTerms(
                post.title,
                searchTerm,
                100
              );

              if (post.content) {
                const highlightedContent = this.highlightSearchTerms(
                  post.content,
                  searchTerm,
                  300
                );
                post.content_html = this.renderMarkdown(highlightedContent);
              } else {
                post.content_html = "";
              }
            });

            callback(null, posts, totalPosts);
          }
        );
      }
    );
  }

  // ==============================================
  // BANNER OPERATIONS
  // ==============================================

  // Get active banners
  getActiveBanners(callback) {
    this.db.all(
      `
      SELECT * FROM banners
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= datetime('now'))
        AND (expired_date IS NULL OR expired_date >= datetime('now'))
      ORDER BY display_order ASC, created_at DESC
    `,
      callback
    );
  }

  // Get all banners
  getAllBanners(callback) {
    this.db.all(
      "SELECT * FROM banners ORDER BY display_order ASC, created_at DESC",
      callback
    );
  }

  // Create banner
  createBanner(bannerData, callback) {
    const {
      title,
      image_path,
      link_url,
      note,
      start_date,
      expired_date,
      display_order,
    } = bannerData;

    this.db.run(
      `INSERT INTO banners (title, image_path, link_url, note, start_date, expired_date, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        image_path,
        link_url || null,
        note || null,
        start_date,
        expired_date,
        display_order || 0,
      ],
      callback
    );
  }

  // Update banner
  updateBanner(bannerId, bannerData, callback) {
    const {
      title,
      image_path,
      link_url,
      note,
      start_date,
      expired_date,
      display_order,
      is_active,
    } = bannerData;

    let updateQuery, updateParams;

    if (image_path) {
      updateQuery = `UPDATE banners SET title = ?, image_path = ?, link_url = ?, note = ?,
                     start_date = ?, expired_date = ?, display_order = ?, is_active = ?,
                     updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      updateParams = [
        title,
        image_path,
        link_url || null,
        note || null,
        start_date,
        expired_date,
        display_order || 0,
        is_active ? 1 : 0,
        bannerId,
      ];
    } else {
      updateQuery = `UPDATE banners SET title = ?, link_url = ?, note = ?,
                     start_date = ?, expired_date = ?, display_order = ?, is_active = ?,
                     updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      updateParams = [
        title,
        link_url || null,
        note || null,
        start_date,
        expired_date,
        display_order || 0,
        is_active ? 1 : 0,
        bannerId,
      ];
    }

    this.db.run(updateQuery, updateParams, callback);
  }

  // Delete banner
  deleteBanner(bannerId, callback) {
    this.db.run("DELETE FROM banners WHERE id = ?", [bannerId], callback);
  }

  // ==============================================
  // EXCHANGE RATES OPERATIONS
  // ==============================================

  // Get active exchange rates
  getActiveExchangeRates(callback) {
    this.db.all(
      `
      SELECT * FROM exchange_rates
      WHERE is_active = 1
      ORDER BY id ASC
    `,
      callback
    );
  }

  // Get all exchange rates
  getAllExchangeRates(callback) {
    this.db.all(
      "SELECT * FROM exchange_rates ORDER BY id ASC, created_at DESC",
      callback
    );
  }

  // Clear all exchange rates
  clearExchangeRates(callback) {
    this.db.run("DELETE FROM exchange_rates", callback);
  }

  // Add exchange rates
  addExchangeRates(exchangeRates, callback) {
    const insertStmt = this.db.prepare(`
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
    callback(null);
  }

  // Toggle exchange rate status
  toggleExchangeRateStatus(rateId, callback) {
    this.db.get(
      "SELECT is_active FROM exchange_rates WHERE id = ?",
      [rateId],
      (err, rate) => {
        if (err || !rate) {
          return callback(err || new Error("Exchange rate not found"));
        }

        const newStatus = rate.is_active ? 0 : 1;
        this.db.run(
          "UPDATE exchange_rates SET is_active = ? WHERE id = ?",
          [newStatus, rateId],
          callback
        );
      }
    );
  }

  // Update exchange rate
  updateExchangeRate(rateId, rateData, callback) {
    const {
      currency_code,
      cash_buy_rate,
      transfer_buy_rate,
      sell_rate,
      notification_date,
      notification_number,
      is_active,
    } = rateData;

    this.db.run(
      `UPDATE exchange_rates
       SET currency_code = ?, cash_buy_rate = ?, transfer_buy_rate = ?, sell_rate = ?,
           notification_date = ?, notification_number = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        currency_code,
        cash_buy_rate === "" ? null : parseFloat(cash_buy_rate),
        transfer_buy_rate === "" ? null : parseFloat(transfer_buy_rate),
        sell_rate === "" ? null : parseFloat(sell_rate),
        notification_date || null,
        parseInt(notification_number) || 1,
        is_active ? 1 : 0,
        rateId,
      ],
      callback
    );
  }

  // Delete exchange rate
  deleteExchangeRate(rateId, callback) {
    this.db.run("DELETE FROM exchange_rates WHERE id = ?", [rateId], callback);
  }

  // ==============================================
  // SETTINGS OPERATIONS
  // ==============================================

  // Get setting
  getSetting(key, callback) {
    this.db.get("SELECT value FROM settings WHERE key = ?", [key], callback);
  }

  // Update setting
  updateSetting(key, value, callback) {
    this.db.run(
      `UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`,
      [value, key],
      callback
    );
  }

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================

  // Render markdown to HTML
  renderMarkdown(markdownText) {
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

  // Highlight search terms and extract context
  highlightSearchTerms(text, searchTerm, maxLength = 200) {
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

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = Database;
