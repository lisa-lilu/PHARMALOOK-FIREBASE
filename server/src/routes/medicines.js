import { Router } from "express";
import db from "../db.js";

const router = Router();

// Same field names the React app already uses.
export const SELECT_MEDICINE = `
  SELECT m.id,
         m.name        AS Medicinename,
         m.price       AS price,
         m.dosage      AS Dosage,
         m.description AS medicinedescription,
         m.category    AS category,
         p.name        AS pharmacyName,
         p.location    AS location,
         p.lat         AS lat,
         p.lng         AS lng
  FROM medicines m
  JOIN pharmacies p ON p.id = m.pharmacy_id
`;

// Public search: only medicines from approved pharmacies.
// Coordinates come from the pharmacy, so every medicine always has its pharmacy's location.
router.get("/", (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);

  const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
  const rows = db
    .prepare(`${SELECT_MEDICINE} WHERE p.status = 'approved' AND m.name LIKE ? ESCAPE '\\' ORDER BY m.name LIMIT 200`)
    .all(like);
  res.json(rows);
});

export default router;
