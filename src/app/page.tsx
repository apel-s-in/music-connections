import Link from "next/link";
import { withBase } from "@/lib/basePath";

export default function Home() {
  return (
    <div className="panel">
      <h1>Музыкальные связи</h1>
      <p>Интерактивный атлас музыкальной истории: временная шкала, граф связей, карта без политических границ.</p>
      <div className="tabs">
        <Link className="tab active" href={withBase("/timeline/") as string}>Перейти к Таймлайну</Link>
        <Link className="tab" href={withBase("/graph/") as string}>Перейти к Графу</Link>
        <Link className="tab" href={withBase("/map/") as string}>Перейти к Карте</Link>
      </div>
    </div>
  );
}
