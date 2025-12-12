import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.10.34:3001";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
