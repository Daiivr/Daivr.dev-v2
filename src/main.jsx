import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./styles/attract-mode.css";
import "./styles/cart-swap.css";
import "./styles/discord-presence.css";
import "./styles/link-console.css";
import "./styles/project-console.css";
import "./styles/comments-console.css";
import "./styles/patch-notes.css";
import "./styles/perched-birds.css";
import "./styles/screen-buddy.css";
import "./styles/site-footer.css";
import "./styles/footer-wildlife.css";
import "./styles/buddy-modal.css";
import "./styles/terminal-dialog.css";
import "./styles/madrace.css";
import "./styles/cursor.css";
import "./styles/mobile.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
