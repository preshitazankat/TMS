// backend/middleware/Autho.js
import jwt from "jsonwebtoken";

// Middleware to authorize by roles
// Usage: authorize(["Admin", "TL"])
export const authorize = (allowedRoles = []) => (req, res, next) => {
  try {
    // Read token from cookies instead of headers
    const token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const [scheme, t] = req.headers.authorization.split(" ");
      if (scheme === "Bearer") token = t;
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
 
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.role) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user info to request
    req.user = decoded;

    // Check role permission
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware to filter tasks based on developer
export const developerOnly = (req, res, next) => {
  if (req.user?.role === "Developer") {
    req.onlyAssignedTasks = true; // Flag to filter tasks in controllers
  }
  next();
};
 