export function basePath(): string {
  if (typeof window !== 'undefined') {
    // В браузере берём из <base> или глобальной переменной
    const base = document.querySelector('base')?.getAttribute('href') || '';
    return base.replace(/\/$/, '');
  }
  // На сервере возвращаем пустую строку (Next сам обработает basePath)
  return '';
}

export function withBase(path: string): string {
  // Только для клиентского использования (fetch, динамические URL)
  if (typeof window === 'undefined') {
    return path; // На сервере не модифицируем
  }
  
  const bp = basePath();
  if (!bp) return path;
  
  // Убираем дублирование basePath
  if (path.startsWith(bp)) return path;
  
  return path.startsWith('/') ? `${bp}${path}` : `${bp}/${path}`;
}
