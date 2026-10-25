# PharmaLook API contract (frontend expectations)

The React app calls your Node backend through `src/lib/api.js`. In development, Vite
forwards every `/api/...` request to `http://localhost:3000` (see `vite.config.js`).

Field names below match the existing data (`Medicinename`, `Dosage`, ...), so the UI
needs no changes.

## Needed by the search page (done)

### GET /api/medicines?q=amox

Returns medicines whose `Medicinename` contains `q` (case-insensitive). Empty array if none.

```json
[
  {
    "id": "12",
    "Medicinename": "Amoxicillin",
    "price": 120,
    "Dosage": "500 mg every 8 hours",
    "medicinedescription": "antibiotic used to treat bacterial infection",
    "pharmacyName": "kenema",
    "location": "shola",
    "lat": 9.0301,
    "lng": 38.7469,
    "category": "antibiotic"
  }
]
```

- `lat` and `lng` may be `null`; the UI then hides distance and travel time.
- `category` is optional; the UI guesses one from the name and description if it is missing.
- On error, return a non-2xx status with `{ "error": "message" }`.

## Proposed for the next pages (not final until those pages are converted)

- `POST /api/auth/signup`, `POST /api/auth/login` return `{ token, user }`; `user` includes a `role` (`customer`, `pharmacy`, `admin`)
- `GET /api/pharmacy/medicines` (own stock), `POST /api/pharmacy/medicines`, `DELETE /api/pharmacy/medicines/:id`
- `POST /api/pharmacy/medicines/bulk` for the spreadsheet import
- `PATCH /api/pharmacy/location` with `{ lat, lng }`
- Admin: list pending pharmacies, approve or reject
