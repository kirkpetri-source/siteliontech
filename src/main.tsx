import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Define favicon programaticamente usando o asset da logo, para funcionar em build de produção
import logoLionTech from "@/assets/logo-lion-tech.jpg";

function setFavicon(href: string, type?: string) {
  const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  const link = existing ?? document.createElement("link");
  link.rel = "icon";
  if (type) link.type = type;
  link.href = href;
  if (!existing) document.head.appendChild(link);
}

setFavicon(logoLionTech, "image/jpeg");

createRoot(document.getElementById("root")!).render(<App />);
