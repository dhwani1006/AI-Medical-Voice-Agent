import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Consultation from "./pages/Consultation";
import Report from "./pages/Report";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/consultation/:id" element={<Consultation />} />
      <Route path="/report" element={<Report />} />
    </Routes>
  );
}