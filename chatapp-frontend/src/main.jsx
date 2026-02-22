// StrictMode: development-də xəbərdarlıqları göstərmək üçün React-in debug wrapper-ı.
// Production-da heç bir effect-i yoxdur.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* BrowserRouter — bütün app-ı URL routing ilə əhatə edir */}
    {/* Əgər bunu çıxarsan, useNavigate, Route, Link işləməz */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
