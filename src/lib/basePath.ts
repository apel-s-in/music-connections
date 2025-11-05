/**
 * Получение базового пути из <base> тега (только клиентская сторона)
 */
export function basePath(): string {
  if (typeof window === 'undefined') return '';
  
  const base = document.querySelector('base')?.getAttribute('href') || '';
  return base.replace(/\/$/, '');
}

/**
 * Добавление базового пути к URL (только для клиентских fetch/динамических ссылок)
 */
export function withBase(path: string): string {
  if (typeof window === 'undefined') return path;
  
  const bp = basePath();
  if (!bp || bp === '/') return path;
  
  // Убираем дублирование
  if (path.startsWith(bp)) return path;
  
  return path.startsWith('/') ? `${bp}${path}` : `${bp}/${path}`;
}
