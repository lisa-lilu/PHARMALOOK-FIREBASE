import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { distanceKm, formatDistance, travelTimes } from "../lib/distance";
import "./SearchPage.css";

const CATEGORY_OPTIONS = [
  ["", "All types"],
  ["pain relief", "Pain relief"],
  ["antibiotic", "Antibiotics"],
  ["vitamins", "Vitamins & supplements"],
  ["cold & flu", "Cold & flu"],
  ["digestive", "Digestive health"],
  ["skin care", "Skin care"],
  ["other", "Other"],
];

const CATEGORY_LABELS = {
  "pain relief": "Pain relief",
  antibiotic: "Antibiotic",
  vitamins: "Vitamins",
  "cold & flu": "Cold & flu",
  digestive: "Digestive",
  "skin care": "Skin care",
  other: "Other",
};

const SUGGESTIONS = ["Paracetamol", "Amoxicillin", "Ibuprofen", "Vitamin C", "Cough syrup"];

const DISTANCE_OPTIONS = [
  { value: 0, label: "Any distance" },
  { value: 1, label: "Within 1 km" },
  { value: 3, label: "Within 3 km" },
  { value: 5, label: "Within 5 km" },
  { value: 10, label: "Within 10 km" },
];

// Light keyword-based category guess, used when a record has no `category` field.
function guessCategory(med) {
  if (med.category) return med.category.toLowerCase();
  const text = ((med.Medicinename || "") + " " + (med.medicinedescription || "")).toLowerCase();
  if (/pain|fever|paracetamol|ibuprofen|aspirin/.test(text)) return "pain relief";
  if (/antibiotic|amoxicillin|cillin|mycin/.test(text)) return "antibiotic";
  if (/vitamin|supplement|mineral/.test(text)) return "vitamins";
  if (/cold|flu|cough|cold-flu|decongestant/.test(text)) return "cold & flu";
  if (/digest|antacid|laxative|stomach/.test(text)) return "digestive";
  if (/skin|cream|ointment|lotion/.test(text)) return "skin care";
  return "other";
}

function EmptyNote({ title, children }) {
  return (
    <div className="empty-note">
      <div className="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.4" y2="16.4" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get("q") || "";

  const [input, setInput] = useState(urlQuery);
  const [medicines, setMedicines] = useState([]); // matches for the current search
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [maxDist, setMaxDist] = useState(0);

  const [userLoc, setUserLoc] = useState(null);
  const [locState, setLocState] = useState("idle"); // idle | locating | on | error | unsupported

  // Load matching medicines from the API whenever the ?q= value changes.
  useEffect(() => {
    setInput(urlQuery);
    if (!urlQuery) {
      setMedicines([]);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        // Your backend returns an array of medicines whose name matches ?q=
        const data = await api(`/medicines?q=${encodeURIComponent(urlQuery)}`);
        const found = data.map((m) => ({ ...m, _category: guessCategory(m) }));
        if (!cancelled) {
          setMedicines(found);
          setStatus("done");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [urlQuery]);

  function handleSubmit(e) {
    e.preventDefault();
    const q = input.trim();
    setParams(q ? { q } : {});
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      setLocState("unsupported");
      return;
    }
    setLocState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState("on");
      },
      () => setLocState("error")
    );
  }

  function clearFilters() {
    setCategory("");
    setSortBy("relevance");
    setMaxDist(0);
  }

  // Add distance, then apply the filters and sorting.
  const list = useMemo(() => {
    let items = medicines.map((m) => ({
      ...m,
      _distance:
        userLoc && m.lat && m.lng ? distanceKm(userLoc.lat, userLoc.lng, m.lat, m.lng) : null,
    }));

    if (category) items = items.filter((m) => m._category === category);
    if (maxDist > 0 && userLoc) {
      items = items.filter((m) => m._distance !== null && m._distance <= maxDist);
    }

    if (sortBy === "price-asc") {
      items.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === "price-desc") {
      items.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortBy === "distance" && userLoc) {
      items.sort((a, b) => {
        if (a._distance == null) return 1;
        if (b._distance == null) return -1;
        return a._distance - b._distance;
      });
    }
    return items;
  }, [medicines, userLoc, category, sortBy, maxDist]);

  const locationDisabled = !userLoc;

  let locationText = "📍 Share your location to sort and filter by distance.";
  if (locState === "on") locationText = "📍 Location shared — distance filters unlocked.";
  if (locState === "error") locationText = "Couldn't get your location. You can still search normally.";
  if (locState === "unsupported") locationText = "Your browser doesn't support location sharing.";

  return (
    <>
      <div className="topbar">
        <div className="logo-mark">
          <img src="/images/pharmalook-logo.png" alt="PharmaLook" />
        </div>
      </div>

      <div className="page">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h3>Filters</h3>
          <p className="sidebar-sub">Narrow down your search results.</p>

          <div className="filter-group">
            <label className="group-label">Medicine type</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="group-label">Sort by</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="distance" disabled={locationDisabled}>Distance: nearest first</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="group-label">Max distance</label>
            <div className="filter-radio-row">
              {DISTANCE_OPTIONS.map((opt) => (
                <label key={opt.value} className={locationDisabled ? "disabled" : ""}>
                  <input
                    type="radio"
                    name="maxDist"
                    value={opt.value}
                    checked={maxDist === opt.value}
                    disabled={locationDisabled}
                    onChange={() => setMaxDist(opt.value)}
                  />{" "}
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="clear-filters" onClick={clearFilters}>
            Clear all filters
          </button>

          <div className={"sidebar-location" + (locState === "on" ? " on" : "")}>
            <p>{locationText}</p>
            {locState !== "on" && (
              <button onClick={shareLocation} disabled={locState === "locating"}>
                {locState === "locating" ? "Locating..." : locState === "error" ? "Try again" : "Use my location"}
              </button>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="search-head">
            <div className="kicker">PharmaLook</div>
            <h1>Find medicine nearby</h1>

            <form className="search-bar-wrap" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Amoxicillin, Paracetamol..."
                autoFocus
              />
              <button type="submit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.4" y2="16.4" />
                </svg>
                Search
              </button>
            </form>

            <div className="chip-row">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => setParams({ q: s })}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {status === "done" && medicines.length > 0 && (
            <div className="results-meta visible">
              <span className="results-count">
                {list.length} result{list.length === 1 ? "" : "s"} found
              </span>
            </div>
          )}

          <div id="results">
            {status === "idle" && (
              <EmptyNote title="Type a medicine name above">
                to see which nearby pharmacies have it in stock — or tap one of the suggestions.
              </EmptyNote>
            )}
            {status === "loading" && <EmptyNote title="Searching...">Looking for pharmacies that stock it.</EmptyNote>}
            {status === "error" && (
              <EmptyNote title="Something went wrong">Couldn't load medicines. Please try again.</EmptyNote>
            )}
            {status === "done" && medicines.length === 0 && (
              <EmptyNote title="No results found">Nothing matching "{urlQuery}" yet. Try a different search.</EmptyNote>
            )}
            {status === "done" && medicines.length > 0 && list.length === 0 && (
              <EmptyNote title="No matches with these filters">Try widening your distance or type filter.</EmptyNote>
            )}

            {status === "done" &&
              list.map((med) => {
                const t = med._distance != null ? travelTimes(med._distance) : null;
                return (
                  <div className="medicine-card" key={med.id}>
                    <div className="m-name">
                      <span>{med.Medicinename}</span>
                      <div className="m-badges">
                        <span className="m-category">{CATEGORY_LABELS[med._category] || "Other"}</span>
                        {med._distance != null && (
                          <span className="m-distance">{formatDistance(med._distance)} away</span>
                        )}
                      </div>
                    </div>
                    <div className="m-row"><strong>Dosage:</strong> {med.Dosage}</div>
                    <div className="m-row"><strong>Price:</strong> {med.price} Birr</div>
                    <div className="m-row"><strong>Description:</strong> {med.medicinedescription}</div>
                    <div className="m-row"><strong>Pharmacy:</strong> {med.pharmacyName}</div>
                    <div className="m-row"><strong>Location:</strong> {med.location}</div>
                    {t && (
                      <div className="m-row">
                        <strong>Travel time (approx.):</strong> ~{t.walk} walk · ~{t.drive} by car
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </main>
      </div>
    </>
  );
}
