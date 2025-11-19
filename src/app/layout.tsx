import "./globals.css";
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
  const basePath = process.env.GITHUB_ACTIONS === 'true' ? '/music-connections' : '';
  return (
    <html lang="ru">
      <head>
        <base href={`${basePath}/`} />
      </head>
      <body>
        <header>
          <div className="container" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href={`${basePath}/`} className="tab">Музыкальные связи</a>
            <nav className="tabs" style={{ flexWrap: "wrap" }}>
              <a className="tab" href={`${basePath}/timeline/`}>Таймлайн</a>
              <a className="tab" href={`${basePath}/graph/`}>Граф</a>
              <a className="tab" href={`${basePath}/map/`}>Карта</a>
            </nav>
            <div style={{ marginLeft: "auto" }}>
              {/* Поиск по локальному датасету */}
              {/* eslint-disable-next-line @next/next/no-sync-scripts */}
              {/* SearchBar — клиентский компонент */}
              {/* @ts-expect-error Server/Client boundary ok (client comp inside layout body) */}
              <(await import("../components/SearchBar")).default />
            </div>
            {/* Глобальные клиентские инициализации (контраст, SW и т.п.) */}
            {/* @ts-expect-error Server/Client boundary ok */}
            <(await import("./Controls")).default />
          </div>
        </header>
        <main className="container" style={{ paddingTop: 12 }}>{children}</main>
        <footer><div className="container">© {new Date().getFullYear()} • Версия данных и сборки отображаются в футере экранов</div></footer>
      </body>
    </html>
  );
}

