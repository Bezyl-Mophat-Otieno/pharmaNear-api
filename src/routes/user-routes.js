const express = require("express");
const {authenticate, requireAdmin} = require("../middleware/auth");
const paginate = require("../middleware/pagination");
const UserService = require("../services/users-service");
const { log, LOG_LEVELS } = require("../utils/logger");

const router = express.Router();

router.get("/users", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const role = req.query.role;
    const users = await UserService.fetchPaginatedUsers(page, limit, role);
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);

  }
});

router.delete("/users/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id; 
    const deleted = await UserService.deleteUserById(userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(204).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/suspend", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await UserService.suspendUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User suspended successfully", data: user });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/reactivate", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await UserService.reactivateUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User reactivated successfully", data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
