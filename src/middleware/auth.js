const jwt = require("../utils/jwt");
const { log, LOG_LEVELS } = require("../utils/logger");
const UserRepository = require("../db/repositories/user-repository");

async function authenticate(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (accessToken) {
      try {
        const decoded = jwt.verifyToken(accessToken);
        
        // Check if user is suspended (for admin routes)
        if (decoded.role && ['admin', 'superadmin'].includes(decoded.role)) {
          const user = await UserRepository.findByEmail(decoded.email);
          if (user && user.status === 'suspended') {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            return res.status(403).json({ error: "Account is suspended. Please contact an administrator." });
          }
        }
        
        req.user = decoded;
        return next();
      } catch (err) {
        log(LOG_LEVELS.WARN, "Access token invalid or expired", { err: err.message });
      }
    }

    if (refreshToken) {
      try {
        const decoded = jwt.verifyToken(refreshToken);
        const user = decoded;
        
        // Check if user is suspended before refreshing tokens
        if (user.role && ['admin', 'superadmin'].includes(user.role)) {
          const dbUser = await UserRepository.findByEmail(user.email);
          if (dbUser && dbUser.status === 'suspended') {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            return res.status(403).json({ error: "Account is suspended. Please contact an administrator." });
          }
        }
        
        const newAccessToken = jwt.generateAccessToken(user);
        const newRefreshToken = jwt.generateRefreshToken(user);
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
        });

        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
        });

        req.user = user;
        return next();
      } catch (err) {
        log(LOG_LEVELS.WARN, "Refresh token invalid", { err: err.message });
      }
    }
    return res.status(401).json({ error: "Unauthorized" });
  } catch (err) {
    log(LOG_LEVELS.ERROR, "Authentication middleware failed", {
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}


module.exports = {authenticate, requireAdmin};
