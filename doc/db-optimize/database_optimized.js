// Optimized SQL queries and database configuration for server.js
// This file contains the optimized database initialization and query functions

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

// ==============================================
// OPTIMIZED DATABASE CONFIGURATION
// ==============================================

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

// ==============================================
// OPTIMIZED HELPER FUNCTIONS
// ==============================================

// Optimized function to load files for a post with proper indexing
function loadPostFiles(postId, callback) {
  db.all(
    "SELECT * FROM post_files WHERE post_id = ? ORDER BY file_order, created_at",
    [postId],
    callback
  );
}

// Optimized function to get first file for a post
function getFirstFile(postId, callback) {
  db.get(
    "SELECT * FROM post_files WHERE post_id = ? ORDER BY file_order, created_at LIMIT 1",
    [postId],
    callback
  );
}

// Optimized function to get categories with post counts
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

// ==============================================
// OPTIMIZED DATABASE SCHEMA WITH INDEXES
// ==============================================

// Tạo tables với optimized indexes
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

  // Table cho posts
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

  // Table cho post files
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

  // Table cho settings
  db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Table cho banners
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

  // Table cho exchange rates
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

  // ==============================================
  // INITIALIZE DEFAULT DATA
  // ==============================================

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

  // Dọn dẹp categories trùng lặp với optimized query
  db.run(
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
        // Kiểm tra và thêm categories mặc định nếu cần
        db.get("SELECT COUNT(*) as count FROM categories", (err, result) => {
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
            const insertCategory = db.prepare(
              "INSERT INTO categories (name, icon) VALUES (?, ?)"
            );
            defaultCategories.forEach((category) => {
              insertCategory.run([category.name, category.icon]);
            });
            insertCategory.finalize();
          }
        });
      }
    }
  );

  // Analyze database for optimization
  db.run("ANALYZE");
});

// ==============================================
// OPTIMIZED QUERY FUNCTIONS
// ==============================================

// Optimized login query
function authenticateUser(username, password, callback) {
  db.get(
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

// Optimized function to get posts with pagination
function getPostsWithPagination(categoryId, page, limit, callback) {
  const offset = (page - 1) * limit;

  // Count query
  let countQuery = "SELECT COUNT(*) as total FROM posts";
  let countParams = [];

  if (categoryId) {
    countQuery += " WHERE category_id = ?";
    countParams.push(categoryId);
  }

  db.get(countQuery, countParams, (err, countResult) => {
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

    db.all(postsQuery, queryParams, (err, posts) => {
      if (err) {
        return callback(err, null, totalPosts);
      }

      // Format posts
      posts.forEach((post) => {
        post.formatted_date = moment(post.created_at).format(
          "DD/MM/YYYY HH:mm"
        );
        post.content_html = renderMarkdown(post.content);
      });

      callback(null, posts, totalPosts);
    });
  });
}

// Optimized search function
function searchPosts(searchTerm, page, limit, callback) {
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

  db.get(
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

      db.all(
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
            post.highlighted_title = highlightSearchTerms(
              post.title,
              searchTerm,
              100
            );

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

          callback(null, posts, totalPosts);
        }
      );
    }
  );
}

// Optimized function to get active banners
function getActiveBanners(callback) {
  db.all(
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

// Optimized function to get active exchange rates
function getActiveExchangeRates(callback) {
  db.all(
    `
    SELECT * FROM exchange_rates
    WHERE is_active = 1
    ORDER BY id ASC
  `,
    callback
  );
}

// ==============================================
// EXPORT OPTIMIZED FUNCTIONS
// ==============================================

module.exports = {
  db,
  loadPostFiles,
  getFirstFile,
  getCategories,
  authenticateUser,
  getPostsWithPagination,
  searchPosts,
  getActiveBanners,
  getActiveExchangeRates,
};
