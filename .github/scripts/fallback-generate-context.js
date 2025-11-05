/* eslint-disable no-console */
"use strict";

// Fallback-генератор .meta, не требует внешних зависимостей.
// Запуск в CI: node .github/scripts/fallback-generate-context.js

const fs = require("fs");
const path = require("path");

const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const META = path.join(ROOT, ".meta");
if (!fs.existsSync(META)) fs.mkdirSync(META, { recursive: true });

// Игнорируем системные каталоги и любые скрытые (кроме .github)
const BLOCK_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out", "coverage",
  ".meta", ".vscode", ".idea", ".cache", ".husky"
]);
const ALLOW_DOT_DIRS = new Set([".github"]);

// Расширения, которые считаем текстовыми
const TEXT_EXTS = new Set([
  ".ts",".tsx",".js",".jsx",".json",".yaml",".yml",".md",".css",".scss",".less",
  ".txt",".html",".webmanifest",".env",".env.example",".yml",".cjs",".mjs"
]);

const toUnix = (p) => p.replace(/\\/g, "/");

function shouldSkip(rel, name, isDir) {
  const u = toUnix(rel);
  for (const b of BLOCK_DIRS) {
    if (u === b || u.startsWith(`${b}/`) || u.includes(`/${b}/`)) return true;
  }
  if (isDir) {
    if (name.startsWith(".") && !ALLOW_DOT_DIRS.has(name)) return true;
  }
  return false;
}

function normalizedExt(file) {
  // Убираем завершающие точки (случай "generate-context.js.")
  let base = path.basename(file);
  while (base.endsWith(".")) base = base.slice(0, -1);
  return path.extname(base).toLowerCase();
}

function isLikelyTextBySample(absPath) {
  try {
    const fd = fs.openSync(absPath, "r");
    const buf = Buffer.alloc(4096);
    const read = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    if (read === 0) return true;
    let control = 0;
    for (let i = 0; i < read; i++) {
      const c = buf[i];
      // 0x00 (NUL) или много управляющих — вероятно бинарник
      if (c === 0x00 || (c < 0x09) || (c > 0x0D && c < 0x20)) control++;
    }
    return control / read < 0.02; // <2% управляющих — считаем текстом
  } catch {
    return false;
  }
}

function isText(file, absPath) {
  const ext = normalizedExt(file);
  if (TEXT_EXTS.has(ext)) return true;
  // Попытка эвристики: если нет подходящего расширения, читаем образец
  return isLikelyTextBySample(absPath);
}

function listFiles() {
  const res = [];
  const stack = [ROOT];
  while (stack.length) {
    const d = stack.pop();
    let ents = [];
    try {
      ents = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const it of ents) {
      const full = path.join(d, it.name);
      const rel = toUnix(path.relative(ROOT, full)) || ".";
      if (shouldSkip(rel, it.name, it.isDirectory())) continue;
      try {
        if (it.isDirectory()) stack.push(full);
        else if (it.isFile()) res.push(rel);
      } catch {}
    }
  }
  return res.sort();
}

function headerBlock() {
  const overview = [
    "Музыкальные Связи — PWA на Next.js (App Router).",
    "Данные: YAML/JSON; сборка датасета на build-стадии (js-yaml + zod).",
    "Визуализации: Таймлайн (d3-scale/zoom), Граф (@xyflow/react), Карта (d3-geo, без политических границ).",
    "Поиск: Fuse + фасеты. Локализация: RU/EN/ORIG с фоллбеком. PWA с офлайн-«избранным» (IndexedDB).",
    "Zero-backend, дешёвый хостинг, Cloudflare WAF/Rate Limiting. Бэкапы: rclone → Яндекс.Диск.",
  ].join("\n");

  const mvp = [
    "Рамки MVP:",
    "- Этап 1: без админки/ИИ/PDF; RU полностью; имена RU/EN/Orig; таймлайн, граф, карта; офлайн-избранное.",
    "- Этап 2: источники/обоснования, админка, ИИ-рекомендации, продвинутый поиск.",
    "- Этап 3: универсальный PDF (CJK/RTL), донаты.",
  ].join("\n");

  const dataModel = [
    "Модель данных (коротко):",
    "- Узлы: Person, Work, Instrument, Place, Event.",
    "- Реестр свойств Pxxx (schema/properties.yaml) + Statements с квалификаторами (PQx).",
    "- Из statements генерируются рёбра: teacher, performed, used, residence и т.д.",
    "- Дата: ISO 8601 с точностью (год/месяц/день) и circa; календарь gregorian/julian.",
    "- Локализация value-полей: { ru, en, orig } с фоллбеком ru→en→orig.",
  ].join("\n");

  const llmRules = [
    "ПРАВИЛА ДЛЯ НЕЙРОСЕТЕЙ (важно для качества ответов):",
    "- Язык ответов: по умолчанию RU. Английский — если явно попросят или в именах/терминах.",
    "- Всегда указывай точные пути файлов при ссылках (например, src/app/(main)/timeline/page.tsx).",
    "- Любой код выводи ТОЛЬКО в тройных бэктиках с указанием языка, например:",
    "  ```ts",
    "  export function x() {}",
    "  ```",
    "- Не используй тяжелое форматирование. Разрешены: списки, короткие таблицы. Избегай сложной разметки.",
    "- Если требуются изменения в файле — показывай минимальный патч (unified diff) или целиком обновлённый файл, но не смешивай.",
    "- Не выдумывай зависимости и API. Если данных нет — явно скажи «нет данных/нужно уточнение».",
    "- Перед предложением архитектурных решений проверяй совместимость библиотек (Next 14 App Router, @xyflow/react, d3, next-intl 3.x).",
    "- Для команд терминала используй блоки ```bash, без интерактивных шагов. Секреты и токены не логируй; предлагай использовать переменные окружения.",
    "- При ответах по i18n всегда учитывай RU/EN/ORIG и фоллбеки (ru -> en -> orig).",
    "- При работе с датами придерживайся ISO 8601; поддерживай точность (год/месяц/день) и признак circa/календарь, как в типах.",
    "- Для PDF: на MVP только print CSS. Полноценный PDF с CJK/RTL — позже (pdfmake/@react-pdf или серверный Puppeteer).",
    "- В примерах кода придерживайся TypeScript strict, ESM/Next-стиля импорта и двух пробелов отступа.",
    "- Если предлагаешь CI/Actions — учитывай, что сборка контекста должна работать автономно даже при сломанном приложении.",
    "- НИКОГДА не генерируйте весь файл целиком — только конкретные блоки для замены.",
    "- ФОРМАТ для изменений: -> ФАЙЛ ДЛЯ ИЗМЕНЕНИЯ: путь/к/файлу.tsx НАЙТИ ЭТОТ БЛОК КОДА: [дословно] -> ЗАМЕНИТЬ НА: [полный новый блок].",
    "- СОХРАНЯЙТЕ: комментарии, форматирование, структуру импортов.",
    "- Если удаляем участок, укажите «до какой строки» (реальная строка из кода) и «какая следующая строка» после удаления (реальная).",
    "- Всегда пиши максимально подробные пояснения, что и почему делаем.",
  ].join("\n");

  const now = new Date().toISOString();
  let version = "0.0.0";
  try {
    version = require(path.join(ROOT, "package.json")).version || version;
  } catch {}

  return [
    "=== ОБЗОР ПРОЕКТА ===",
    overview,
    "",
    mvp,
    "",
    dataModel,
    "",
    llmRules,
    "",
    `Сгенерировано: ${now}`,
    `Версия проекта: ${version}`,
    "",
  ].join("\n");
}

function generate() {
  const files = listFiles();

  // Дерево директорий
  const dirSet = new Set(files.map((f) => toUnix(path.dirname(f))));
  const treeLines = Array.from(dirSet).sort().map((d) => (d === "." ? "/" : d + "/"));

  // FULL
  let full = headerBlock();
  full += "# TREE (approx)\n" + treeLines.join("\n") + "\n\n# FILES\n";

  for (const f of files) {
    const p = path.join(ROOT, f);
    let body = "";
    if (isText(f, p)) {
      try {
        body = fs.readFileSync(p, "utf8");
      } catch (e) {
        body = `// read error: ${e.message}`;
      }
    } else {
      try {
        const st = fs.statSync(p);
        body = `// binary or non-text file (${Math.round(st.size / 1024)} KB)`;
      } catch {
        body = "// unknown file";
      }
    }
    full += `\n// ---- FILE: ${f} ----\n${body}\n`;
  }
  fs.writeFileSync(path.join(META, "project-full.txt"), full, "utf8");

  // ADAPTIVE (тоже с заголовком)
  let adaptive = headerBlock() + "# COMPACT STRUCTURE\n";
  const dirMap = new Map();
  for (const f of files) {
    const d = toUnix(path.dirname(f));
    const b = path.basename(f);
    if (!dirMap.has(d)) dirMap.set(d, []);
    dirMap.get(d).push(b);
  }
  for (const d of Array.from(dirMap.keys()).sort()) {
    adaptive += (d === "." ? "/" : d + "/") + " " + dirMap.get(d).sort().join(", ") + "\n";
  }
  fs.writeFileSync(path.join(META, "project-adaptive.txt"), adaptive, "utf8");

  console.log("Fallback generation done.");
}

try {
  generate();
} catch (e) {
  console.error("Fallback error:", e);
  process.exit(1);
}
