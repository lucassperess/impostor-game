import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ImpostorGame from "./impostor-game.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ImpostorGame />
  </StrictMode>
);
