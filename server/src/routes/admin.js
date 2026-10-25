import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/pharmacies?status=pending   (status is optional)
router.get("/pharmacies", (req, res) => {
  const status = req.query.status;
  const base = `
    SELECT p.id, p.name, p.location, p.status, p.created_at AS createdAt, u.email
    FROM pharmacies p JOIN users u ON u.id = p.user_id
  `;
  const rows = ["pending", "approved", "rejected"].includes(status)
    ? db.prepare(base + " WHERE p.status = ? ORDER BY p.created_at DESC").all(status)
    : db.prepare(base + " ORDER BY p.created_at DESC").all();
  res.json(rows);
});

router.patch("/pharmacies/:id", (req, res) => {
  const status = req.body?.status;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Status must be approved, rejected or pending." });
  }
  const info = db.prepare("UPDATE pharmacies SET status = ? WHERE id = ?").run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Pharmacy not found." });
  res.json({ id: Number(req.params.id), status });
});

export default router;
