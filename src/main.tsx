import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { seedDemoDataIfNeeded } from "./lib/aegis/demo-seed";

// Auto-seed demo data on first visit so every page is immediately populated.
seedDemoDataIfNeeded();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
