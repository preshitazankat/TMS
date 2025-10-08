import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
 // same as in server.js

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log("Authorization header:", req.headers["authorization"]);
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  // Bearer tokenString
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });
console.log("Extracted token:", token);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
     console.log("Decoded token:", decoded);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email, name: decoded.name }; // attach decoded user info to request
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};  

export default verifyToken;
