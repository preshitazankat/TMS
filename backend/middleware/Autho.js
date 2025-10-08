// backend/middleware/Autho.js
import jwt from "jsonwebtoken";



// Middleware to authorize by roles
// Usage: authorize(["admin", "tl"])
export const authorize = (allowedRoles = []) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Expecting 'Bearer <token>'
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }
    
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.role) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user info to request
    req.user = decoded;

    // If roles are specified, check permission
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
  if (req.user.role === "Developer") {
    req.onlyAssignedTasks = true; // Flag to filter tasks in controllers
  }
  next();
};
