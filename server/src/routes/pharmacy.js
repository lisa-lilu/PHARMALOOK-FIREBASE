import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole, requireApprovedPharmacy } from "../auth.js";
import { SELECT_MEDICINE } from "./medicines.js";

const router = Router();
router.use(requireAuth, requireRole("pharmacy"));

function profile(p) {
  return { id: p.id, name: p.name, location: p.location, lat: p.lat, lng: p.lng, status: p.status, logoData: p.logo_data };
}

// Works even while pending, so the status page can show the current state.
router.get("/me", (req, res) => {
  const p = db.prepare("SELECT * FROM pharmacies WHERE user_id = ?").get(req.user.id);
  if (!p) return res.status(404).json({ error: "No pharmacy account found." });
  res.json(profile(p));
});

// Everything below needs an approved pharmacy.
router.use(requireApprovedPharmacy);

router.patch("/location", (req, res) => {
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ error: "Invalid coordinates." });
  }
  db.prepare("UPDATE pharmacies SET lat = ?, lng = ? WHERE id = ?").run(lat, lng, req.pharmacy.id);
  res.json({ lat, lng });
});

router.put("/logo", (req, res) => {
  const logoData = req.body?.logoData;
  if (typeof logoData !== "string" || !logoData.startsWith("data:image/") || logoData.length > 1_500_000) {
    return res.status(400).json({ error: "Please send an image under about 1 MB." });
  }
  db.prepare("UPDATE pharmacies SET logo_data = ? WHERE id = ?").run(logoData, req.pharmacy.id);
  res.json({ ok: true });
});

router.get("/medicines", (req, res) => {
  const rows = db.prepare(`${SELECT_MEDICINE} WHERE m.pharmacy_id = ? ORDER BY m.name`).all(req.pharmacy.id);
  res.json(rows);
});

function cleanMedicine(body) {
  const name = String(body?.Medicinename ?? "").trim();
  const price = Number.parseFloat(body?.price);
  if (!name) return { error: "Medicine name is required." };
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a valid price." };
  return {
    value: {
      name,
      price,
      dosage: String(body?.Dosage ?? "").trim(),
      description: String(body?.medicinedescription ?? "").trim(),
      category: body?.category ? String(body.category).trim().toLowerCase() : null,
    },
  };
}

const insertMedicine = db.prepare(
  "INSERT OR IGNORE INTO medicines (pharmacy_id, name, price, dosage, description, category) VALUES (?, ?, ?, ?, ?, ?)"
);

router.post("/medicines", (req, res) => {
  const { value, error } = cleanMedicine(req.body);
  if (error) return res.status(400).json({ error });
  const info = insertMedicine.run(req.pharmacy.id, value.name, value.price, value.dosage, value.description, value.category);
  if (info.changes === 0) return res.status(409).json({ error: "You already added this medicine." });
  const row = db.prepare(`${SELECT_MEDICINE} WHERE m.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(row);
});

// Bulk import: body is { rows: [{ Medicinename, price, Dosage, medicinedescription }, ...] }
router.post("/medicines/bulk", (req, res) => {
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "No rows to import." });
  if (rows.length > 5000) return res.status(400).json({ error: "Please import at most 5000 rows at a time." });

  let added = 0;
  let skipped = 0;
  db.transaction(() => {
    for (const r of rows) {
      const { value } = cleanMedicine(r);
      if (!value) { skipped++; continue; }
      const info = insertMedicine.run(req.pharmacy.id, value.name, value.price, value.dosage, value.description, value.category);
      info.changes ? added++ : skipped++;
    }
  })();
  res.json({ added, skipped });
});

router.delete("/medicines/:id", (req, res) => {
  const info = db.prepare("DELETE FROM medicines WHERE id = ? AND pharmacy_id = ?").run(req.params.id, req.pharmacy.id);
  if (info.changes === 0) return res.status(404).json({ error: "Medicine not found." });
  res.json({ ok: true });
});

export default router;
