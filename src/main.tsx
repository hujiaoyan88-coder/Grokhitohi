import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HitohiApp } from "@/components/dayline/HitohiApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HitohiApp />
  </StrictMode>,
);
