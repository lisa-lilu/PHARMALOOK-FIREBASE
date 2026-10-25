import jwt from "jsonwebtoken";
import db from "./db.js";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Using an insecure development secret.");
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "7d" });
}

// Requires a valid token. Puts { id, role } on req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in." });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: "You don't have access to this." });
    next();
  };
}

// For stock management: the user must be a pharmacy that the admin approved.
export function requireApprovedPharmacy(req, res, next) {
  const pharmacy = db.prepare("SELECT * FROM pharmacies WHERE user_id = ?").get(req.user.id);
  if (!pharmacy) return res.status(403).json({ error: "No pharmacy account found." });
  if (pharmacy.status !== "approved") {
    return res.status(403).json({ error: "Your pharmacy has not been approved yet.", status: pharmacy.status });
  }
  req.pharmacy = pharmacy;
  next();
}
