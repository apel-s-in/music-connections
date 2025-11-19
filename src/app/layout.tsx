import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Controls from "./Controls";
import SearchBar from "@/components/SearchBar";

const basePath = process.env.GITHUB_ACTIONS === "true" ? "/music-connections" : "";

export const metadata: Metadata = {
  title: "Музыкальные связи",
  description: "Таймлайн, граф, карта — интерактивный атлас музыкальной истории",
  manifest: `${basePath}/manifest.webmanifest`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <base href={`${basePath}/`} />
      </head>
      <body>
        <header>
          <div className="container" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href={`${basePath}/`} className="tab">Музыкальные связи</a>
            <nav className="tabs">
              <a className="tab" href={`${basePath}/timeline/`}>Таймлайн</a>
              <a className="tab" href={`${basePath}/graph/`}>Граф</a>
              <a className="tab" href={`${basePath}/map/`}>Карта</a>
            </nav>
            <div style={{ marginLeft: "auto" }}>
              <SearchBar />
            </div>
            <Controls />
          </div>
        </header>
        <main className="container" style={{ paddingTop: 12 }}>{children}</main>
        <footer><div className="container">© {new Date().getFullYear()}</div></footer>
      </body>
    </html>
  );
}
