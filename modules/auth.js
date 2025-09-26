// Authentication middleware module
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

class AuthMiddleware {
  constructor() {
    this.sessionConfig = {
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
    };
  }

  // Get session middleware
  getSessionMiddleware() {
    return session(this.sessionConfig);
  }

  // Require authentication middleware
  requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
      return next();
    } else {
      return res.redirect("/login");
    }
  }

  // Require admin middleware
  requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.userRole === "admin") {
      return next();
    } else {
      return res.status(403).send("Không có quyền truy cập!");
    }
  }

  // Check if user can post
  canPost(req, res, next) {
    if (req.session && req.session.userId && req.session.canPost) {
      return next();
    } else {
      return res
        .status(403)
        .send(
          "Bạn không có quyền đăng tài liệu. Vui lòng liên hệ quản trị viên để được cấp quyền."
        );
    }
  }

  // Set charset middleware
  setCharset(req, res, next) {
    res.charset = "utf-8";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    next();
  }

  // Login user
  loginUser(req, user, rememberMe = false) {
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.full_name;
    req.session.userAvatar = user.avatar;
    req.session.canPost = user.can_post;

    // Set session duration based on remember me checkbox
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      console.log(
        `User ${user.username} logged in with remember me for 30 days`
      );
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      console.log(`User ${user.username} logged in for 24 hours`);
    }
  }

  // Logout user
  logoutUser(req, res, callback) {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      }
      callback();
    });
  }

  // Check if user is logged in
  isLoggedIn(req) {
    return req.session && req.session.userId;
  }

  // Check if user is admin
  isAdmin(req) {
    return (
      req.session && req.session.userId && req.session.userRole === "admin"
    );
  }

  // Get current user info
  getCurrentUser(req) {
    if (!this.isLoggedIn(req)) {
      return null;
    }

    return {
      id: req.session.userId,
      role: req.session.userRole,
      name: req.session.userName,
      avatar: req.session.userAvatar,
      canPost: req.session.canPost,
    };
  }

  // Redirect if logged in
  redirectIfLoggedIn(req, res, next) {
    if (this.isLoggedIn(req)) {
      return res.redirect("/");
    }
    next();
  }
}

module.exports = AuthMiddleware;
