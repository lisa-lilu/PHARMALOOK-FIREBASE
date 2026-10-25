import express from "express";
import authRoutes from "./routes/auth.js";
import medicineRoutes from "./routes/medicines.js";
import pharmacyRoutes from "./routes/pharmacy.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.use(express.json({ limit: "2mb" })); // room for a base64 pharmacy logo

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Last-resort error handler: never leak internals to the client.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Could not start on port ${PORT}:`, err.message);
    process.exit(1);
  }
  console.log(`PharmaLook API running on http://localhost:${PORT}`);
});
