"use client";
import { useEffect } from "react";

export default function Controls() {
  useEffect(() => {
    // Регистрация SW
    if ("serviceWorker" in navigator) {
      const base = document.querySelector('base')?.getAttribute('href') || '/';
      const swPath = base.endsWith('/') ? `${base}sw.js` : `${base}/sw.js`;
      navigator.serviceWorker.register(swPath).catch(() => {});
    }
  useEffect(() => {
    // Контрастность
    const saved = localStorage.getItem("contrast");
    if (saved === "high") document.documentElement.setAttribute("data-contrast", "high");
    // SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(withBase("/sw.js")).catch(() => {});
    }
    // base path для fetch (fetch корректно обработает)
    (window as any).__BASE_PATH__ = (document.querySelector('base')?.getAttribute('href') || "").replace(/\/$/, "");
  }, []);

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => {
        const curr = document.documentElement.getAttribute("data-contrast");
        const next = curr === "high" ? null : "high";
        if (next) document.documentElement.setAttribute("data-contrast", next);
        else document.documentElement.removeAttribute("data-contrast");
        localStorage.setItem("contrast", next ? "high" : "normal");
      }}>
        Контраст
      </button>
    </div>
  );
}
