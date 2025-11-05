import "./globals.css";
import Link from "next/link";
import { withBase } from "@/lib/basePath";
import { ReactNode, useEffect } from "react";

export const metadata = {
  title: "Музыкальные связи",
  description: "Таймлайн, граф, карта — интерактивный атлас музыкальной истории",
  manifest: withBase("/manifest.webmanifest")
} as any;

function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__BASE_PATH__ = (document.querySelector('base')?.getAttribute('href') || "").replace(/\/$/, "");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(withBase("/sw.js")).catch(() => {});
    }
  }, []);
}

function Controls() {
  useEffect(() => {
    const saved = localStorage.getItem("contrast");
    if (saved === "high") document.documentElement.setAttribute("data-contrast", "high");
  }, []);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => {
        const curr = document.documentElement.getAttribute("data-contrast");
        const next = curr === "high" ? null : "high";
        if (next) document.documentElement.setAttribute("data-contrast", next);
        else document.documentElement.removeAttribute("data-contrast");
        localStorage.setItem("contrast", next ? "high" : "normal");
      }}>Контраст</button>
    </div>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  useServiceWorker();
  return (
    <html lang="ru">
      <head>
        <base href={process.env.GITHUB_ACTIONS ? "/music-connections/" : "/"} />
      </head>
      <body>
        <header>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href={withBase("/")}><b>Музыкальные связи</b></Link>
              <nav className="tabs">
                <Link className="tab" href={withBase("/timeline/")}>Таймлайн</Link>
                <Link className="tab" href={withBase("/graph/")}>Граф</Link>
                <Link className="tab" href={withBase("/map/")}>Карта</Link>
              </nav>
            </div>
            <Controls />
          </div>
        </header>
        <main className="container">{children}</main>
        <footer>
          <div className="container" style={{ fontSize: 12, color: "var(--muted)" }}>
            © {new Date().getFullYear()} • Версия данных и сборки отображаются в футере экранов
          </div>
        </footer>
      </body>
    </html>
  );
}
