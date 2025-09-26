// Route handlers module
const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

class RouteHandlers {
  constructor(database, authMiddleware, fileManager, utils) {
    this.db = database;
    this.auth = authMiddleware;
    this.fileManager = fileManager;
    this.utils = utils;
    this.router = express.Router();

    this.setupRoutes();
  }

  setupRoutes() {
    // Login routes
    this.router.get(
      "/login",
      this.auth.redirectIfLoggedIn.bind(this.auth),
      this.getLoginPage.bind(this)
    );
    this.router.post("/login", this.postLogin.bind(this));
    this.router.post("/logout", this.postLogout.bind(this));

    // Home page
    this.router.get(
      "/",
      this.auth.requireAuth.bind(this.auth),
      this.getHomePage.bind(this)
    );

    // Upload routes
    this.router.get(
      "/upload",
      this.auth.requireAuth.bind(this.auth),
      this.getUploadPage.bind(this)
    );
    this.router.post(
      "/upload",
      this.auth.requireAuth.bind(this.auth),
      this.fileManager.getUploadMiddleware(),
      this.postUpload.bind(this)
    );

    // Admin routes
    this.router.get(
      "/admin",
      this.auth.requireAdmin.bind(this.auth),
      this.getAdminPage.bind(this)
    );
    this.router.get(
      "/admin/users",
      this.auth.requireAdmin.bind(this.auth),
      this.getAdminUsersPage.bind(this)
    );
    this.router.get(
      "/admin/announcement",
      this.auth.requireAdmin.bind(this.auth),
      this.getAdminAnnouncementPage.bind(this)
    );
    this.router.get(
      "/admin/banners",
      this.auth.requireAdmin.bind(this.auth),
      this.getAdminBannersPage.bind(this)
    );
    this.router.get(
      "/admin/exchange-rates",
      this.auth.requireAdmin.bind(this.auth),
      this.getAdminExchangeRatesPage.bind(this)
    );
    this.router.get(
      "/admin/deleted",
      this.auth.requireAdmin.bind(this.auth),
      this.getAdminDeletedPage.bind(this)
    );

    // Admin actions
    this.router.post(
      "/admin/announcement",
      this.auth.requireAdmin.bind(this.auth),
      this.postUpdateAnnouncement.bind(this)
    );
    this.router.post(
      "/admin/banners/add",
      this.auth.requireAdmin.bind(this.auth),
      this.fileManager.getSingleUploadMiddleware("banner_image"),
      this.postAddBanner.bind(this)
    );
    this.router.post(
      "/admin/banners/edit/:id",
      this.auth.requireAdmin.bind(this.auth),
      this.fileManager.getSingleUploadMiddleware("banner_image"),
      this.postEditBanner.bind(this)
    );
    this.router.post(
      "/admin/banners/delete/:id",
      this.auth.requireAdmin.bind(this.auth),
      this.postDeleteBanner.bind(this)
    );
    this.router.post(
      "/admin/exchange-rates/upload",
      this.auth.requireAdmin.bind(this.auth),
      this.fileManager.getSingleUploadMiddleware("excel_file"),
      this.postUploadExchangeRates.bind(this)
    );
    this.router.post(
      "/admin/exchange-rates/toggle/:id",
      this.auth.requireAdmin.bind(this.auth),
      this.postToggleExchangeRate.bind(this)
    );
    this.router.post(
      "/admin/exchange-rates/delete/:id",
      this.auth.requireAdmin.bind(this.auth),
      this.postDeleteExchangeRate.bind(this)
    );
    this.router.post(
      "/admin/exchange-rates/clear",
      this.auth.requireAdmin.bind(this.auth),
      this.postClearExchangeRates.bind(this)
    );
    this.router.post(
      "/admin/exchange-rates/edit/:id",
      this.auth.requireAdmin.bind(this.auth),
      this.postEditExchangeRate.bind(this)
    );

    // User management
    this.router.post(
      "/users/add",
      this.auth.requireAdmin.bind(this.auth),
      this.postAddUser.bind(this)
    );
    this.router.post(
      "/users/toggle/:id",
      this.auth.requireAdmin.bind(this.auth),
      this.postToggleUser.bind(this)
    );

    // Post routes
    this.router.get(
      "/post/:id",
      this.auth.requireAuth.bind(this.auth),
      this.getPostDetail.bind(this)
    );
    this.router.get(
      "/edit/:id",
      this.auth.requireAuth.bind(this.auth),
      this.getEditPost.bind(this)
    );
    this.router.post(
      "/edit/:id",
      this.auth.requireAuth.bind(this.auth),
      this.fileManager.getUploadMiddleware("new_files", 10),
      this.postEditPost.bind(this)
    );
    this.router.get(
      "/history/:id",
      this.auth.requireAuth.bind(this.auth),
      this.getPostHistory.bind(this)
    );
    this.router.post(
      "/delete/:id",
      this.auth.requireAuth.bind(this.auth),
      this.postDeletePost.bind(this)
    );

    // Search routes
    this.router.get(
      "/search",
      this.auth.requireAuth.bind(this.auth),
      this.getSearchResults.bind(this)
    );

    // File download routes
    this.router.get(
      "/download/:id",
      this.auth.requireAuth.bind(this.auth),
      this.downloadPostFile.bind(this)
    );
    this.router.get(
      "/download/file/:fileId",
      this.auth.requireAuth.bind(this.auth),
      this.downloadFileById.bind(this)
    );
    this.router.get(
      "/admin/deleted/download/:fileName",
      this.auth.requireAdmin.bind(this.auth),
      this.downloadDeletedFile.bind(this)
    );
    this.router.delete(
      "/admin/deleted/permanent/:fileName",
      this.auth.requireAdmin.bind(this.auth),
      this.permanentlyDeleteFile.bind(this)
    );
  }

  // ==============================================
  // LOGIN ROUTES
  // ==============================================

  getLoginPage(req, res) {
    const { generateLoginPage } = require("../templates");
    res.send(generateLoginPage());
  }

  postLogin(req, res) {
    const { username, password, remember_me } = req.body;

    this.db.authenticateUser(username, password, (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      if (user) {
        this.auth.loginUser(req, user, remember_me);
        res.redirect("/");
      } else {
        const { generateLoginPage } = require("../templates");
        res.send(generateLoginPage("Tên đăng nhập hoặc mật khẩu không đúng!"));
      }
    });
  }

  postLogout(req, res) {
    this.auth.logoutUser(req, res, () => {
      res.redirect("/login");
    });
  }

  // ==============================================
  // HOME PAGE ROUTES
  // ==============================================

  getHomePage(req, res) {
    const selectedCategory = req.query.category || null;
    const currentPage = parseInt(req.query.page) || 1;

    // Get announcement
    this.db.getSetting("announcement", (err, announcement) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      // Get categories
      this.db.getCategories((err, categories) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi database");
        }

        // Get active banners
        this.db.getActiveBanners((err, banners) => {
          if (err) {
            console.error(err);
            banners = [];
          }

          // Get active exchange rates
          this.db.getActiveExchangeRates((err, exchangeRates) => {
            if (err) {
              console.error(err);
              exchangeRates = [];
            }

            // Get posts with pagination
            const postsPerPage = 5;
            this.db.getPostsWithPagination(
              selectedCategory,
              currentPage,
              postsPerPage,
              (err, posts, totalPosts) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send("Lỗi database");
                }

                const { generateHomePage } = require("../templates");
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
              }
            );
          });
        });
      });
    });
  }

  // ==============================================
  // UPLOAD ROUTES
  // ==============================================

  getUploadPage(req, res) {
    // Check if user can post
    this.db.getUserById(req.session.userId, (err, user) => {
      if (err || !user || !user.can_post) {
        const { generateNoPermissionPage } = require("../templates");
        return res
          .status(403)
          .send(
            generateNoPermissionPage(
              req.session,
              "Bạn không có quyền đăng tài liệu. Vui lòng liên hệ quản trị viên để được cấp quyền."
            )
          );
      }

      // Get categories
      this.db.getCategories((err, categories) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi database");
        }
        const { generateUploadPage } = require("../templates");
        res.send(generateUploadPage(req.session, categories));
      });
    });
  }

  postUpload(req, res) {
    // Check if user can post
    this.db.getUserById(req.session.userId, (err, user) => {
      if (err || !user || !user.can_post) {
        const { generateNoPermissionPage } = require("../templates");
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

      // Create post
      this.db.createPost(
        { title, content, category_id, user_id: req.session.userId },
        (err, postId) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi khi lưu bài đăng!");
          }

          // Add files if any
          this.db.addFilesToPost(postId, files, (err) => {
            if (err) {
              console.error(err);
            }
            res.redirect("/");
          });
        }
      );
    });
  }

  // ==============================================
  // ADMIN ROUTES
  // ==============================================

  getAdminPage(req, res) {
    const { generateAdminTabPage } = require("../templates");
    const html = generateAdminTabPage(
      "Quản trị hệ thống",
      "",
      "",
      req.session,
      [],
      ""
    );
    res.send(html);
  }

  getAdminUsersPage(req, res) {
    this.db.getAllUsers((err, users) => {
      if (err) {
        console.error(err);
        users = [];
      }

      this.db.getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        const { generateAdminUsersPage } = require("../templates");
        res.send(generateAdminUsersPage(users, req.session, categories));
      });
    });
  }

  getAdminAnnouncementPage(req, res) {
    this.db.getSetting("announcement", (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      this.db.getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        const { generateAdminAnnouncementPage } = require("../templates");
        res.send(
          generateAdminAnnouncementPage(
            result ? result.value : "",
            req.session,
            categories
          )
        );
      });
    });
  }

  getAdminBannersPage(req, res) {
    this.db.getAllBanners((err, banners) => {
      if (err) {
        console.error(err);
        banners = [];
      }

      this.db.getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        const { generateAdminBannersPage } = require("../templates");
        res.send(generateAdminBannersPage(banners, req.session, categories));
      });
    });
  }

  getAdminExchangeRatesPage(req, res) {
    this.db.getAllExchangeRates((err, exchangeRates) => {
      if (err) {
        console.error(err);
        exchangeRates = [];
      }

      this.db.getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }
        const { generateAdminExchangeRatesPage } = require("../templates");
        res.send(
          generateAdminExchangeRatesPage(exchangeRates, req.session, categories)
        );
      });
    });
  }

  getAdminDeletedPage(req, res) {
    const deletedFiles = this.fileManager.getDeletedFiles();

    this.db.getCategories((err, categories) => {
      if (err) {
        console.error(err);
        categories = [];
      }
      const { generateAdminDeletedPage } = require("../templates");
      res.send(generateAdminDeletedPage(deletedFiles, req.session, categories));
    });
  }

  // ==============================================
  // ADMIN ACTIONS
  // ==============================================

  postUpdateAnnouncement(req, res) {
    const { announcement } = req.body;

    this.db.updateSetting("announcement", announcement, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật thông báo!");
      }
      res.redirect("/admin/announcement");
    });
  }

  postAddBanner(req, res) {
    const { title, link_url, note, start_date, expired_date, display_order } =
      req.body;
    const image_path = req.file ? req.file.path : null;

    if (!title || !image_path) {
      return res.status(400).send("Vui lòng điền đầy đủ thông tin bắt buộc!");
    }

    const bannerData = {
      title,
      image_path,
      link_url: link_url || null,
      note: note || null,
      start_date: this.fileManager.formatDateForSQLite(start_date),
      expired_date: this.fileManager.formatDateForSQLite(expired_date),
      display_order: display_order || 0,
    };

    this.db.createBanner(bannerData, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi thêm banner!");
      }
      res.redirect("/admin/banners");
    });
  }

  postEditBanner(req, res) {
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

    const bannerData = {
      title,
      image_path,
      link_url: link_url || null,
      note: note || null,
      start_date: this.fileManager.formatDateForSQLite(start_date),
      expired_date: this.fileManager.formatDateForSQLite(expired_date),
      display_order: display_order || 0,
      is_active: is_active ? 1 : 0,
    };

    this.db.updateBanner(bannerId, bannerData, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật banner!");
      }
      res.redirect("/admin/banners");
    });
  }

  postDeleteBanner(req, res) {
    const bannerId = req.params.id;

    this.db.deleteBanner(bannerId, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi xóa banner!");
      }
      res.redirect("/admin/banners");
    });
  }

  postUploadExchangeRates(req, res) {
    const { notification_date, notification_number } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).send("Vui lòng chọn file Excel!");
    }

    try {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parse exchange rates from Excel data
      const exchangeRates = this.fileManager.parseExchangeRatesFromExcel(
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
      this.db.clearExchangeRates((err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi xóa tỷ giá cũ!");
        }

        // Insert new rates
        this.db.addExchangeRates(exchangeRates, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi khi thêm tỷ giá mới!");
          }

          // Delete uploaded file
          fs.unlinkSync(file.path);

          res.redirect("/admin/exchange-rates");
        });
      });
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      res.status(500).send("Lỗi khi đọc file Excel: " + error.message);
    }
  }

  postToggleExchangeRate(req, res) {
    const rateId = req.params.id;

    this.db.toggleExchangeRateStatus(rateId, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật trạng thái!");
      }
      res.redirect("/admin/exchange-rates");
    });
  }

  postDeleteExchangeRate(req, res) {
    const rateId = req.params.id;

    this.db.deleteExchangeRate(rateId, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi xóa tỷ giá!");
      }
      res.redirect("/admin/exchange-rates");
    });
  }

  postClearExchangeRates(req, res) {
    this.db.clearExchangeRates((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi xóa tất cả tỷ giá!");
      }
      res.redirect("/admin/exchange-rates");
    });
  }

  postEditExchangeRate(req, res) {
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

    const rateData = {
      currency_code,
      cash_buy_rate,
      transfer_buy_rate,
      sell_rate,
      notification_date,
      notification_number,
      is_active,
    };

    this.db.updateExchangeRate(rateId, rateData, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật tỷ giá!");
      }
      res.redirect("/admin/exchange-rates");
    });
  }

  // ==============================================
  // USER MANAGEMENT
  // ==============================================

  postAddUser(req, res) {
    const { username, password, full_name, role, can_post } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).send("Vui lòng điền đầy đủ thông tin!");
    }

    const userData = {
      username,
      password,
      full_name,
      role: role || "user",
      can_post: can_post ? 1 : 0,
    };

    this.db.createUser(userData, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi tạo user!");
      }
      res.redirect("/admin/users");
    });
  }

  postToggleUser(req, res) {
    const userId = req.params.id;

    this.db.toggleUserStatus(userId, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi cập nhật trạng thái!");
      }
      res.redirect("/admin/users");
    });
  }

  // ==============================================
  // POST ROUTES
  // ==============================================

  getPostDetail(req, res) {
    const postId = req.params.id;

    // Increment view count
    this.db.incrementViewCount(postId, (err) => {
      if (err) {
        console.error(err);
      }
    });

    // Get categories
    this.db.getCategories((err, categories) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      // Get post details
      this.db.getPostById(postId, (err, post) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi database");
        }

        if (!post) {
          return res.status(404).send("Bài viết không tồn tại!");
        }

        // Format date and render markdown
        post.formatted_date = this.utils.formatDate(post.created_at);
        post.content_html = this.utils.renderMarkdown(post.content);

        // Load post files
        this.db.loadPostFiles(postId, (err, files) => {
          if (err) {
            console.error(err);
            files = [];
          }

          post.files = files;

          // Show post detail page
          const { generatePostDetailPage } = require("../templates");
          res.send(generatePostDetailPage(post, req.session, categories));
        });
      });
    });
  }

  getEditPost(req, res) {
    const postId = req.params.id;

    this.db.getPostById(postId, (err, post) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      if (!post) {
        return res.status(404).send("Bài đăng không tồn tại!");
      }

      // Check permissions
      if (
        req.session.userRole !== "admin" &&
        post.user_id !== req.session.userId
      ) {
        return res
          .status(403)
          .send("Bạn không có quyền chỉnh sửa bài đăng này!");
      }

      // Get categories
      this.db.getCategories((err, categories) => {
        if (err) {
          console.error(err);
          categories = [];
        }

        // Load post files
        this.db.loadPostFiles(postId, (err, files) => {
          if (err) {
            console.error(err);
            files = [];
          }

          post.files = files;
          const { generateEditPage } = require("../templates");
          res.send(generateEditPage(post, req.session, categories));
        });
      });
    });
  }

  postEditPost(req, res) {
    const postId = req.params.id;
    const { title, content, category_id, remove_files } = req.body;
    const newFiles = req.files || [];

    if (!title) {
      return res.status(400).send("Tiêu đề không được để trống!");
    }

    if (!category_id) {
      return res.status(400).send("Vui lòng chọn danh mục!");
    }

    // Get old post info for history
    this.db.getPostById(postId, (err, oldPost) => {
      if (err || !oldPost) {
        return res.status(404).send("Bài đăng không tồn tại!");
      }

      // Check permissions
      if (
        req.session.userRole !== "admin" &&
        oldPost.user_id !== req.session.userId
      ) {
        return res
          .status(403)
          .send("Bạn không có quyền chỉnh sửa bài đăng này!");
      }

      // Handle file operations
      if (remove_files && Array.isArray(remove_files)) {
        remove_files.forEach((fileId) => {
          if (fileId) {
            this.db.getFileById(fileId, (err, file) => {
              if (
                !err &&
                file &&
                file.file_path &&
                fs.existsSync(file.file_path)
              ) {
                this.fileManager.moveFileToDeleted(
                  file.file_path,
                  postId,
                  fileId
                );
              }
              this.db.deleteFile(fileId);
            });
          }
        });
      }

      // Add post history
      this.db.addPostHistory(
        {
          post_id: postId,
          old_title: oldPost.title,
          old_content: oldPost.content,
          new_title: title,
          new_content: content || "",
          edited_by: req.session.userId,
        },
        (err) => {
          if (err) {
            console.error(err);
          }
        }
      );

      // Add new files
      this.db.addFilesToPost(postId, newFiles, (err) => {
        if (err) {
          console.error(err);
        }
      });

      // Update post information
      this.db.updatePost(postId, { title, content, category_id }, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi cập nhật bài đăng!");
        }
        res.redirect("/post/" + postId);
      });
    });
  }

  getPostHistory(req, res) {
    const postId = req.params.id;

    this.db.getPostHistory(postId, (err, history) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      this.db.getPostById(postId, (err, post) => {
        if (err || !post) {
          return res.status(404).send("Bài đăng không tồn tại!");
        }

        // Get categories
        this.db.getCategories((err, categories) => {
          if (err) {
            console.error(err);
            categories = [];
          }
          const { generateHistoryPage } = require("../templates");
          res.send(generateHistoryPage(post, history, req.session, categories));
        });
      });
    });
  }

  postDeletePost(req, res) {
    const postId = req.params.id;

    // Move all files to deleted folder
    this.db.loadPostFiles(postId, (err, files) => {
      if (!err && files && files.length > 0) {
        files.forEach((file) => {
          this.fileManager.moveFileToDeleted(file.file_path, postId, file.id);
        });
      }

      // Delete post and its files from database
      this.db.deletePost(postId, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lỗi khi xóa bài đăng!");
        }
        res.redirect("/");
      });
    });
  }

  // ==============================================
  // SEARCH ROUTES
  // ==============================================

  getSearchResults(req, res) {
    const searchTerm = req.query.q || "";
    const currentPage = parseInt(req.query.page) || 1;

    if (!searchTerm.trim()) {
      return res.redirect("/");
    }

    // Get categories
    this.db.getCategories((err, categories) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      // Search posts
      const postsPerPage = 5;
      this.db.searchPosts(
        searchTerm,
        currentPage,
        postsPerPage,
        (err, posts, totalPosts) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Lỗi database");
          }

          // Get exchange rates for search page
          this.db.getActiveExchangeRates((err, exchangeRates) => {
            if (err) {
              console.error(err);
              exchangeRates = [];
            }

            const { generateHomePage } = require("../templates");
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
          });
        }
      );
    });
  }

  // ==============================================
  // FILE DOWNLOAD ROUTES
  // ==============================================

  downloadPostFile(req, res) {
    const postId = req.params.id;
    const download = req.query.download === "true";

    this.db.getFirstFile(postId, (err, file) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      if (!file || !file.file_path) {
        return res.status(404).send("File không tồn tại!");
      }

      const filePath = path.join(__dirname, "../", file.file_path);
      this.fileManager.serveFile(filePath, file.file_name, res, download);
    });
  }

  downloadFileById(req, res) {
    const fileId = req.params.fileId;
    const download = req.query.download === "true";

    this.db.getFileById(fileId, (err, file) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi database");
      }

      if (!file || !file.file_path) {
        return res.status(404).send("File không tồn tại!");
      }

      const filePath = path.join(__dirname, "../", file.file_path);
      this.fileManager.serveFile(filePath, file.file_name, res, download);
    });
  }

  downloadDeletedFile(req, res) {
    const fileName = req.params.fileName;
    this.fileManager.downloadDeletedFile(fileName, res);
  }

  permanentlyDeleteFile(req, res) {
    const fileName = req.params.fileName;
    const success = this.fileManager.permanentlyDeleteFile(fileName);

    if (success) {
      res.status(200).send("File đã được xóa vĩnh viễn");
    } else {
      res.status(500).send("Lỗi khi xóa file vĩnh viễn");
    }
  }

  // Get router
  getRouter() {
    return this.router;
  }
}

module.exports = RouteHandlers;
