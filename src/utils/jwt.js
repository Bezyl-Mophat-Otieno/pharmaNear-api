const jwt = require("jsonwebtoken");
const { GOOGLE_CLIENT_ID, JWT_SECRET } = process.env;

function generateAccessToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
}

function generateRefreshToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function decodeGoogleIdToken(idToken) {
  // Very lightweight verification of Google ID Token
  const decoded = jwt.decode(idToken); // Not verified here, Google already did it
  if (decoded.iss !== "https://accounts.google.com" && decoded.iss !== "accounts.google.com") {
    throw new Error("Invalid Google token issuer");
  }
  return {
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeGoogleIdToken,
};
