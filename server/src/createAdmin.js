// Usage:  npm run create-admin -- admin@pharmalook.com YourPassword
import bcrypt from "bcryptjs";
import db from "./db.js";

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 6) {
  console.error("Usage: npm run create-admin -- <email> <password (6+ characters)>");
  process.exit(1);
}

const normalized = email.trim().toLowerCase();
if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalized)) {
  console.error("A user with that email already exists.");
  process.exit(1);
}

db.prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'admin', 'Administrator')").run(
  normalized,
  bcrypt.hashSync(password, 10)
);
console.log(`Admin created: ${normalized}`);
