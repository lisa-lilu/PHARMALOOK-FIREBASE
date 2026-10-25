import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken, requireAuth } from "../auth.js";

const router = Router();

const isEmail = (s) => typeof s === "string" && /^\S+@\S+\.\S+$/.test(s);

function publicUser(user) {
  const out = { id: user.id, name: user.name, email: user.email, role: user.role };
  if (user.role === "pharmacy") {
    const p = db.prepare("SELECT id, status FROM pharmacies WHERE user_id = ?").get(user.id);
    if (p) {
      out.pharmacyId = p.id;
      out.pharmacyStatus = p.status;
    }
  }
  return out;
}

function validateAccount({ name, email, password }) {
  if (!name || !String(name).trim()) return "Name is required.";
  if (!isEmail(email)) return "Enter a valid email address.";
  if (typeof password !== "string" || password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

// Customer sign-up
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body || {};
  const problem = validateAccount({ name, email, password });
  if (problem) return res.status(400).json({ error: problem });

  const normalized = email.trim().toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalized)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'customer', ?)")
    .run(normalized, hash, name.trim());
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// Pharmacy sign-up: the account is created as "pending" until an admin approves it.
router.post("/pharmacy-signup", (req, res) => {
  const { name, email, password, location } = req.body || {};
  const problem = validateAccount({ name, email, password });
  if (problem) return res.status(400).json({ error: problem });
  if (!location || !String(location).trim()) return res.status(400).json({ error: "Location is required." });

  const normalized = email.trim().toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalized)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const create = db.transaction(() => {
    const u = db
      .prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'pharmacy', ?)")
      .run(normalized, hash, name.trim());
    db.prepare("INSERT INTO pharmacies (user_id, name, location) VALUES (?, ?, ?)").run(
      u.lastInsertRowid,
      name.trim(),
      location.trim()
    );
    return u.lastInsertRowid;
  });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(create());
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Enter your email and password." });
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  // Same message for "no such user" and "wrong password" on purpose.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(401).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

export default router;
