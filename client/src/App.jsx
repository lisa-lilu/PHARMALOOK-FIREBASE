import { Navigate, Route, Routes } from "react-router-dom";
import SearchPage from "./pages/SearchPage.jsx";

// Each page you convert gets one <Route> here.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/search" replace />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="*" element={<Navigate to="/search" replace />} />
    </Routes>
  );
}
