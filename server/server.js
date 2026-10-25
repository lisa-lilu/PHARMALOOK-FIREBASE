import express from "express";
const app = express();

app.get("/api/medicines", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const all = [
    { id: "1", Medicinename: "Amoxicillin", price: 120, Dosage: "500 mg every 8 hours",
      medicinedescription: "antibiotic used to treat bacterial infection",
      pharmacyName: "kenema", location: "shola", lat: 9.03, lng: 38.74 },
  ];
  res.json(all.filter((m) => m.Medicinename.toLowerCase().includes(q)));
});

app.listen(3000, () => console.log("API on http://localhost:3000"));
