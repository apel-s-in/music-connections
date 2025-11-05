export default function Home() {
  const basePath = typeof window !== 'undefined' 
    ? (document.querySelector('base')?.getAttribute('href') || '/').replace(/\/$/, '')
    : '';

  return (
    <div className="panel">
      <h1>Музыкальные связи</h1>
      <p>Интерактивный атлас музыкальной истории: временная шкала, граф связей, карта без политических границ.</p>
      <div className="tabs">
        <a className="tab active" href={`${basePath}/timeline/`}>Перейти к Таймлайну</a>
        <a className="tab" href={`${basePath}/graph/`}>Перейти к Графу</a>
        <a className="tab" href={`${basePath}/map/`}>Перейти к Карте</a>
      </div>
    </div>
  );
}
