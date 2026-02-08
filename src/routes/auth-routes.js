const express = require("express");
const axios = require("axios");
const jwt = require("../utils/jwt");
const AuthService = require("../services/auth-service");
const { log, LOG_LEVELS } = require("../utils/logger");
const { authenticate } = require("../middleware/auth");
const { hashPassword } = require("../utils/bcrypt");
const UserRepository = require("../db/repositories/user-repository");
const { RoleEnum } = require("../db/enums");

const router = express.Router();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;
const isProduction = process.env.NODE_ENV === "production";

// Step 1: Redirect user to Google login
router.get("/google/login", (_, res) => {

    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      scope: ["openid", "email", "profile"].join(" "),
      access_type: "offline", // to get refresh_token
      prompt: "consent", // force refresh_token every time
    });
  
  const redirectUrl = `${baseUrl}?${params.toString()}`
  res.redirect(redirectUrl);
});

router.get("/google/callback", async (req, res, next) => {
  const code = req.query.code;

  try {
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", null, {
      params: {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      },
    });

    const { id_token } = tokenRes.data;

    const userInfo = jwt.decodeGoogleIdToken(id_token);
    const user = await AuthService.findOrCreateGoogleUser(userInfo);

    const accessToken = jwt.generateAccessToken(user);
    const refreshToken = jwt.generateRefreshToken(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    res.status(200).json({ success:true, message: "Login Success" })
  } catch (err) {
    next(err);
  }
});

router.post('/admin/login', async(req, res, next)=>{
  const credentials = req.body
  if(!credentials){
    return res.status(400).json({success:false, message: "Kindly provide credentials: email and password"})
  }

  const { email, password } = credentials;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await AuthService.authenticateAdmin(email, password);
    if (!(user)) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const accessToken = jwt.generateAccessToken(user);
    const refreshToken = jwt.generateRefreshToken(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction, 
      sameSite: isProduction ? "none" : "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction, 
      sameSite: isProduction ? "none" : "lax",
    });




    res.status(200).json({ success: true, message: "Login Success", data: user });
  } catch (err) {
    next(err);
  }

})

router.post('/register', async(req, res, next)=>{
  const details = req.body
  const role = req.query.role || RoleEnum.customer
  if(!details){
    return res.status(400).json({success:false, message: "Kindly provide details: name, email and password"})
  }
  const { name, email, password } = details;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  const existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: "Email already in use" });
  }

  const hashedPassword = await hashPassword(password);
  try {
    const newUser = await UserRepository.createUser({ name, email, password: hashedPassword, role: role });
    res.status(201).json({ success: true, message: "User registered successfully", data: newUser });
  } catch (err) {
    next(err);
  }
})

 router.get('/me', authenticate, async(req, res, next) => {
  try {
    const user = req.user;
    if(!user){
      return res.status(401).json({success:false, message: "Unauthorized"})
    }
    res.status(200).json({success:true, message: "User details", data: user})

  } catch (err) {
    next(err);
  }
 })

 router.post('/logout', authenticate, async(req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success:true, message: "Logout Success"})
  } catch (err) {
    next(err);
  }
 })

 router.post('/reset-password', async(req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: "Account is suspended. Please contact an administrator." });
    }

    const hashedPassword = await hashPassword(password);
    const updatedUser = await UserRepository.updatePassword(user.id, hashedPassword);
    
    if (updatedUser) {
      res.status(200).json({ success: true, message: "Password reset successfully" });
    } else {
      res.status(500).json({ success: false, message: "Failed to reset password" });
    }
  } catch (err) {
    next(err);
  }
 })

 router.post('/refresh-token', async(req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token missing" });

  }
  try {
    const decoded = jwt.verifyToken(refreshToken);
    const user = await UserRepository.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
    const newAccessToken = jwt.generateAccessToken(user);
    const newRefreshToken = jwt.generateRefreshToken(user);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",

    });
    res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (err) {

    log("Error refreshing token", LOG_LEVELS.ERROR, err);
    return res.status(401).json({ success: false, message: "Invalidrefresh token" });
  }
  })


module.exports = router;
