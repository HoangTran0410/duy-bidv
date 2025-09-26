// File upload and management module
const multer = require("multer");
const path = require("path");
const fs = require("fs");

class FileManager {
  constructor() {
    this.uploadsDir = path.join(__dirname, "../uploads");
    this.deletedDir = path.join(__dirname, "../deleted");

    this.ensureDirectories();
    this.setupMulter();
  }

  // Ensure upload and deleted directories exist
  ensureDirectories() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(this.deletedDir)) {
      fs.mkdirSync(this.deletedDir, { recursive: true });
    }
  }

  // Setup multer configuration
  setupMulter() {
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

    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, cb);
      },
    });
  }

  // Validate uploaded file
  validateFile(file, cb) {
    // Accept common file types
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
  }

  // Get multer upload middleware
  getUploadMiddleware(fieldName = "files", maxCount = 10) {
    return this.upload.array(fieldName, maxCount);
  }

  // Get single file upload middleware
  getSingleUploadMiddleware(fieldName = "file") {
    return this.upload.single(fieldName);
  }

  // Move file to deleted folder
  moveFileToDeleted(filePath, postId, fileId) {
    if (!filePath || !fs.existsSync(filePath)) {
      return false;
    }

    try {
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const deletedFileName = `${timestamp}_postId-${postId}_fileId-${fileId}_${fileName}`;
      const deletedFilePath = path.join(this.deletedDir, deletedFileName);

      // Move file to deleted folder
      fs.renameSync(filePath, deletedFilePath);
      console.log(`File moved to deleted folder: ${deletedFileName}`);
      return true;
    } catch (error) {
      console.error("Error moving file to deleted folder:", error);
      return false;
    }
  }

  // Get deleted files list
  getDeletedFiles() {
    try {
      const deletedFiles = fs
        .readdirSync(this.deletedDir)
        .map((fileName) => {
          const filePath = path.join(this.deletedDir, fileName);
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

      return deletedFiles;
    } catch (error) {
      console.error("Error reading deleted files:", error);
      return [];
    }
  }

  // Download deleted file
  downloadDeletedFile(fileName, res) {
    const filePath = path.join(this.deletedDir, fileName);

    if (fs.existsSync(filePath)) {
      // Extract original name for download
      const parts = fileName.split("_");
      const originalName = parts.slice(2).join("_") || fileName;

      res.download(filePath, originalName);
      return true;
    } else {
      res.status(404).send("File đã xóa không tồn tại!");
      return false;
    }
  }

  // Permanently delete file
  permanentlyDeleteFile(fileName) {
    const filePath = path.join(this.deletedDir, fileName);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Permanently deleted file: ${fileName}`);
        return true;
      } catch (error) {
        console.error("Error permanently deleting file:", error);
        return false;
      }
    }
    return false;
  }

  // Get file content type
  getContentType(fileName) {
    const ext = fileName.toLowerCase().split(".").pop();

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

    return contentTypes[ext] || "application/octet-stream";
  }

  // Serve file with proper headers
  serveFile(filePath, fileName, res, download = false) {
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File không tìm thấy!");
    }

    const contentType = this.getContentType(fileName);

    if (download) {
      // Force download
      res.download(filePath, fileName);
    } else {
      // Allow inline viewing
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.sendFile(filePath);
    }
  }

  // Parse exchange rates from Excel data
  parseExchangeRatesFromExcel(data, notificationDate, notificationNumber) {
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

  // Format date for SQLite
  formatDateForSQLite(dateStr) {
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
  }
}

module.exports = FileManager;
