import Link from "next/link";
import { withBase } from "@/lib/basePath";

export default function Home() {
  return (
    <div className="panel">
      <h1>Музыкальные связи</h1>
      <p>Интерактивный атлас музыкальной истории: временная шкала, граф связей, карта без политических границ.</p>
      <div className="tabs">
        <a className="tab active" href={withBase("/timeline/")}>Перейти к Таймлайну</a>
        <a className="tab" href={withBase("/graph/")}>Перейти к Графу</a>
        <a className="tab" href={withBase("/map/")}>Перейти к Карте</a>
      </div>
    </div>
  );
}
