import "./globals.css";
import Link from "next/link";
import { withBase } from "@/lib/basePath";
import { ReactNode } from "react";
import Controls from "./Controls";
import type { Metadata } from 'next';

const basePath = process.env.GITHUB_ACTIONS === 'true' ? '/music-connections' : '';

export const metadata: Metadata = {
  title: "Музыкальные связи",
  description: "Таймлайн, граф, карта — интерактивный атлас музыкальной истории",
  manifest: `${basePath}/manifest.webmanifest`
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <base href={`${basePath}/`} />
      </head>
      <body>
        <header>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <a href={`${basePath}/`}><b>Музыкальные связи</b></a>
              <nav className="tabs">
                <a className="tab" href={`${basePath}/timeline/`}>Таймлайн</a>
                <a className="tab" href={`${basePath}/graph/`}>Граф</a>
                <a className="tab" href={`${basePath}/map/`}>Карта</a>
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
