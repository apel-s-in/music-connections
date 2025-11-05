export function basePath() {
  // На CI и в собранном экспорте Next сам подставит basePath/assetPrefix,
  // но для fetch удобно явно строить относительный путь.
  const bp = (typeof window !== "undefined" && (window as any).__BASE_PATH__) || "";
  return bp;
}

export function withBase(path: string) {
  const bp = basePath();
  if (!bp) return path;
  return path.startsWith("/") ? `${bp}${path}` : `${bp}/${path}`;
}
