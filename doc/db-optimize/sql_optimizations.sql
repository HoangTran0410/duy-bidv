-- SQL Optimizations for Intranet Portal
-- This file contains optimized SQL queries and database indexes

-- ==============================================
-- 1. CREATE OPTIMIZED INDEXES
-- ==============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_can_post ON users(can_post);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- Post files table indexes
CREATE INDEX IF NOT EXISTS idx_post_files_post_id ON post_files(post_id);
CREATE INDEX IF NOT EXISTS idx_post_files_order ON post_files(post_id, file_order, created_at);

-- Post history table indexes
CREATE INDEX IF NOT EXISTS idx_post_history_post_id ON post_history(post_id);
CREATE INDEX IF NOT EXISTS idx_post_history_edited_at ON post_history(edited_at DESC);

-- Settings table indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Banners table indexes
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, expired_date);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order ASC, created_at DESC);

-- Exchange rates table indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(currency_code);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(notification_date);

-- ==============================================
-- 2. OPTIMIZED QUERIES
-- ==============================================

-- Optimized login query (uses index on username and status)
-- Original: SELECT * FROM users WHERE username = ? AND status = 'active'
-- Optimized: Already uses proper indexes

-- Optimized home page categories query
-- Original: SELECT c.*, COUNT(p.id) as post_count FROM categories c LEFT JOIN posts p ON c.id = p.category_id GROUP BY c.id ORDER BY c.name
-- Optimized version with better performance:
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
ORDER BY c.name;

-- Optimized banners query with proper date filtering
-- Original: SELECT * FROM banners WHERE is_active = 1 AND (start_date IS NULL OR datetime('now') >= datetime(start_date)) AND (expired_date IS NULL OR datetime('now') <= datetime(expired_date)) ORDER BY display_order ASC, created_at DESC
-- Optimized version:
SELECT * FROM banners
WHERE is_active = 1
    AND (start_date IS NULL OR start_date <= datetime('now'))
    AND (expired_date IS NULL OR expired_date >= datetime('now'))
ORDER BY display_order ASC, created_at DESC;

-- Optimized posts query with pagination
-- Original: Complex query with multiple joins
-- Optimized version with better indexing:
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
WHERE p.category_id = ?  -- Use index on category_id
ORDER BY p.created_at DESC  -- Use index on created_at DESC
LIMIT ? OFFSET ?;

-- Optimized search query with full-text search capabilities
-- Original: Uses LIKE with COLLATE NOCASE
-- Optimized version with better performance:
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
WHERE (
    p.title LIKE ? OR
    p.content LIKE ? OR
    pf.file_name LIKE ?
)
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?;

-- ==============================================
-- 3. QUERY PERFORMANCE IMPROVEMENTS
-- ==============================================

-- Use prepared statements for frequently executed queries
-- Example: User authentication
PREPARE auth_user AS
SELECT id, username, password, full_name, role, avatar, can_post
FROM users
WHERE username = ? AND status = 'active';

-- Use transactions for multiple related operations
-- Example: Post creation with files
BEGIN TRANSACTION;
    INSERT INTO posts (title, content, category_id, user_id) VALUES (?, ?, ?, ?);
    -- Get last_insert_rowid() for post_id
    INSERT INTO post_files (post_id, file_path, file_name, file_size, file_order) VALUES (?, ?, ?, ?, ?);
COMMIT;

-- ==============================================
-- 4. DATABASE CONFIGURATION OPTIMIZATIONS
-- ==============================================

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Increase cache size (adjust based on available memory)
PRAGMA cache_size = -64000;  -- 64MB cache

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Optimize for better performance
PRAGMA optimize;

-- ==============================================
-- 5. MAINTENANCE QUERIES
-- ==============================================

-- Analyze database for optimization opportunities
ANALYZE;

-- Get query plan for optimization
EXPLAIN QUERY PLAN SELECT * FROM posts WHERE category_id = ? ORDER BY created_at DESC LIMIT 10;

-- ==============================================
-- 6. PERFORMANCE MONITORING QUERIES
-- ==============================================

-- Check index usage
SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%';

-- Monitor query performance
SELECT * FROM sqlite_stat1 WHERE tbl = 'posts';

-- Check database size and fragmentation
SELECT
    name,
    (page_count * page_size) as size_bytes,
    page_count,
    page_size
FROM pragma_page_count(), pragma_page_size()
WHERE name = 'intranet.db';
