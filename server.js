// Main server file - Refactored and modularized
const express = require("express");
const path = require("path");

// Import modules
const Database = require("./modules/database");
const AuthMiddleware = require("./modules/auth");
const FileManager = require("./modules/fileManager");
const Utils = require("./modules/utils");
const RouteHandlers = require("./modules/routes");

// Initialize modules
const database = new Database();
const authMiddleware = new AuthMiddleware();
const fileManager = new FileManager();
const utils = new Utils();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================
// MIDDLEWARE SETUP
// ==============================================

// Static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set charset to UTF-8 for proper Vietnamese character handling
app.use(authMiddleware.setCharset.bind(authMiddleware));

// Session middleware
app.use(authMiddleware.getSessionMiddleware());

// ==============================================
// ROUTES SETUP
// ==============================================

// Initialize route handlers
const routeHandlers = new RouteHandlers(
  database,
  authMiddleware,
  fileManager,
  utils
);

// Use route handlers
app.use("/", routeHandlers.getRouter());

// ==============================================
// ERROR HANDLING MIDDLEWARE
// ==============================================

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Không tìm thấy trang</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                color: white;
            }
            .error-container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 2rem;
                border-radius: 10px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            .error-code {
                font-size: 6rem;
                font-weight: bold;
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .error-message {
                font-size: 1.5rem;
                margin: 1rem 0;
            }
            .error-description {
                font-size: 1rem;
                margin: 1rem 0 2rem 0;
                opacity: 0.8;
            }
            .back-button {
                display: inline-block;
                padding: 12px 24px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .back-button:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <h1 class="error-code">404</h1>
            <h2 class="error-message">Không tìm thấy trang</h2>
            <p class="error-description">
                Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </p>
            <a href="/" class="back-button">Về trang chủ</a>
        </div>
    </body>
    </html>
  `);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lỗi Upload File</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  color: white;
              }
              .error-container {
                  text-align: center;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 2rem;
                  border-radius: 10px;
                  backdrop-filter: blur(10px);
                  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
              }
              .error-icon {
                  font-size: 4rem;
                  margin-bottom: 1rem;
              }
              .error-message {
                  font-size: 1.5rem;
                  margin: 1rem 0;
              }
              .error-description {
                  font-size: 1rem;
                  margin: 1rem 0 2rem 0;
                  opacity: 0.8;
              }
              .back-button {
                  display: inline-block;
                  padding: 12px 24px;
                  background: rgba(255, 255, 255, 0.2);
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  transition: background 0.3s ease;
                  border: 1px solid rgba(255, 255, 255, 0.3);
              }
              .back-button:hover {
                  background: rgba(255, 255, 255, 0.3);
              }
          </style>
      </head>
      <body>
          <div class="error-container">
              <div class="error-icon">📁</div>
              <h2 class="error-message">File quá lớn</h2>
              <p class="error-description">
                  File bạn đang upload vượt quá giới hạn cho phép (500MB).
                  Vui lòng chọn file nhỏ hơn.
              </p>
              <a href="javascript:history.back()" class="back-button">Quay lại</a>
          </div>
      </body>
      </html>
    `);
  }

  // Handle other errors
  res.status(500).send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lỗi Server</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                color: white;
            }
            .error-container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 2rem;
                border-radius: 10px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            .error-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            .error-message {
                font-size: 1.5rem;
                margin: 1rem 0;
            }
            .error-description {
                font-size: 1rem;
                margin: 1rem 0 2rem 0;
                opacity: 0.8;
            }
            .back-button {
                display: inline-block;
                padding: 12px 24px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .back-button:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h2 class="error-message">Lỗi Server</h2>
            <p class="error-description">
                Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.
            </p>
            <a href="/" class="back-button">Về trang chủ</a>
        </div>
    </body>
    </html>
  `);
});

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  database.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  database.close();
  process.exit(0);
});

// ==============================================
// START SERVER
// ==============================================

app.listen(PORT, () => {
  console.log(`🚀 Intranet Portal đang chạy tại http://localhost:${PORT}`);
  console.log(`📂 Upload folder: ${fileManager.uploadsDir}`);
  console.log(`🗄️  Database: intranet.db`);
  console.log(`📁 Modules loaded: Database, Auth, FileManager, Utils, Routes`);
  console.log(`✨ Server đã được tối ưu hóa và modularized!`);
});

// Export for testing
module.exports = app;
