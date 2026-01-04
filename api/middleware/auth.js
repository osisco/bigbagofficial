import jwt from "jsonwebtoken";

// Auth middleware: verify token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Role middleware: check for admin
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

// Role middleware: check for vendor
export const isVendor = (req, res, next) => {
  if (!req.user || req.user.role !== "vendor") {
    return res.status(403).json({ message: "Forbidden: Vendors only" });
  }
  next();
};

// Role middleware: check for vendor or admin
export const isVendorOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== "vendor" && req.user.role !== "admin")) {
    return res.status(403).json({ message: "Forbidden: Vendors or Admins only" });
  }
  next();
};
