// Utility functions module
const moment = require("moment");
const { marked } = require("marked");

// Set Vietnamese locale for moment
moment.locale("vi");

class Utils {
  // Render markdown to HTML
  static renderMarkdown(markdownText) {
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
  static highlightSearchTerms(text, searchTerm, maxLength = 200) {
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

  // Format date for display
  static formatDate(date, format = "DD/MM/YYYY HH:mm") {
    return moment(date).format(format);
  }

  // Format date for SQLite
  static formatDateForSQLite(dateStr) {
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

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Sanitize filename
  static sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/[^\w\-_.]/g, ""); // Keep only alphanumeric, hyphens, underscores, and dots
  }

  // Generate unique filename
  static generateUniqueFilename(originalName) {
    const sanitizedName = this.sanitizeFilename(originalName);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    return `${uniqueSuffix}-${sanitizedName}`;
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Generate pagination info
  static generatePaginationInfo(currentPage, totalItems, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    const nextPage = hasNextPage ? currentPage + 1 : null;
    const prevPage = hasPrevPage ? currentPage - 1 : null;

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      startItem: (currentPage - 1) * itemsPerPage + 1,
      endItem: Math.min(currentPage * itemsPerPage, totalItems),
    };
  }

  // Generate random string
  static generateRandomString(length = 10) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Deep clone object
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
    if (typeof obj === "object") {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Check if string is valid JSON
  static isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Escape HTML
  static escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Unescape HTML
  static unescapeHtml(text) {
    const map = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#039;": "'",
    };
    return text.replace(/&(amp|lt|gt|quot|#039);/g, (m) => map[m]);
  }

  // Generate slug from text
  static generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  // Truncate text
  static truncateText(text, maxLength, suffix = "...") {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  // Capitalize first letter
  static capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Convert bytes to human readable format
  static bytesToHuman(bytes) {
    return this.formatFileSize(bytes);
  }

  // Get file extension
  static getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  }

  // Check if file is image
  static isImageFile(filename) {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    const ext = this.getFileExtension(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  // Check if file is document
  static isDocumentFile(filename) {
    const docExtensions = [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
    ];
    const ext = this.getFileExtension(filename).toLowerCase();
    return docExtensions.includes(ext);
  }

  // Check if file is video
  static isVideoFile(filename) {
    const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
    const ext = this.getFileExtension(filename).toLowerCase();
    return videoExtensions.includes(ext);
  }

  // Check if file is audio
  static isAudioFile(filename) {
    const audioExtensions = ["mp3", "wav", "ogg", "aac", "flac", "m4a"];
    const ext = this.getFileExtension(filename).toLowerCase();
    return audioExtensions.includes(ext);
  }

  // Get file type category
  static getFileTypeCategory(filename) {
    if (this.isImageFile(filename)) return "image";
    if (this.isDocumentFile(filename)) return "document";
    if (this.isVideoFile(filename)) return "video";
    if (this.isAudioFile(filename)) return "audio";
    return "other";
  }
}

module.exports = Utils;
