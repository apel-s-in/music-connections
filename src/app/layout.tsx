import "./globals.css";
import Link from "next/link";
import { withBase } from "@/lib/basePath";
import { ReactNode } from "react";
import Controls from "./Controls"; // импортируем клиентский компонент

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Музыкальные связи",
  description: "Таймлайн, граф, карта — интерактивный атлас музыкальной истории",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <base href={process.env.GITHUB_ACTIONS ? "/music-connections/" : "/"} />
      </head>
      <body>
        <header>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href={withBase("/") as string}><b>Музыкальные связи</b></Link>
              <nav className="tabs">
                <Link className="tab" href={withBase("/timeline/") as string}>Таймлайн</Link>
                <Link className="tab" href={withBase("/graph/") as string}>Граф</Link>
                <Link className="tab" href={withBase("/map/") as string}>Карта</Link>
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
