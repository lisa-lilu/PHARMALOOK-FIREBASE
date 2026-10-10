# PharmaLook

PharmaLook helps people find the medicine they need at pharmacies near them. Customers search for a medicine and see which pharmacies stock it, with price, dosage, distance and estimated travel time. Pharmacies manage their own stock through a dashboard.

Live demo: https://pharmalook-6a2ad.web.app

## Features

**For customers**
- Search for medicines by name, with quick-search suggestions
- Compare prices across pharmacies
- Filter by medicine type and sort by relevance, price or distance
- Share your location to see how far each pharmacy is (km or m) and an approximate walking and driving time
- Filter by maximum distance (1, 3, 5 or 10 km)

**For pharmacies**
- Sign up and log in; accounts must be approved before they can list medicines
- Add and remove medicines (name, price, dosage, description)
- Bulk import from a CSV or Excel file, or by pasting rows from a spreadsheet
- Share the pharmacy's location so customers see distances
- Upload a pharmacy logo

## Tech stack

- HTML, CSS and JavaScript (ES modules)
- Firebase Authentication
- Firebase Realtime Database
- Firebase Hosting
- SheetJS (xlsx) for Excel import

## Project structure

```
index.html            Landing page
templates/            Login, sign-up, search and pharmacy pages
static/               Images and shared assets
firebase-config.js    Firebase initialisation
```

## How distance is calculated

Distance is a straight-line (Haversine) calculation between the customer's location and the pharmacy's saved coordinates. The travel time is an estimate (road distance assumed to be 30% longer, about 5 km/h walking and 25 km/h driving). It does not use live traffic or road data.

## Run locally

1. Clone the repository
2. Add your own Firebase project settings in `firebase-config.js`
3. Serve the folder with a local server (for example `npx serve`) or deploy with `firebase deploy`

## Roadmap

- Rebuild the backend with Node.js and Express in place of Firebase
- Use real road distance and travel time
- Server-side role checks for customers, pharmacies and admins

## Author

Lielt Leul
