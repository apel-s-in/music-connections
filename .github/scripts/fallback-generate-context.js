/* eslint-disable no-console */
"use strict";

// Fallback для .meta — только файлы (полный путь) и полный код. Без дерева/дат/размеров.

const fs = require("fs");
const path = require("path");

const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const META = path.join(ROOT, ".meta");
if (!fs.existsSync(META)) fs.mkdirSync(META, { recursive: true });

const toUnix = (p) => p.replace(/\\/g, "/");

const BLOCK_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out", "coverage",
  ".meta", ".vscode", ".idea", ".cache", ".husky"
]);
const ALLOW_DOT_DIRS = new Set([".github"]);
const TEXT_EXTS = new Set([
  ".ts",".tsx",".js",".jsx",".json",".yaml",".yml",".md",".css",".scss",".less",
  ".txt",".html",".webmanifest",".env",".env.example",".cjs",".mjs",".yml"
]);

function normalizedExt(file) {
  let base = path.basename(file);
  while (base.endsWith(".")) base = base.slice(0, -1);
  return path.extname(base).toLowerCase();
}
function isText(rel) { return TEXT_EXTS.has(normalizedExt(rel)); }

function shouldSkip(rel, name, isDir) {
  const u = toUnix(rel);
  for (const b of BLOCK_DIRS) {
    if (u === b || u.startsWith(`${b}/`) || u.includes(`/${b}/`)) return true;
  }
  if (isDir && name.startsWith(".") && !ALLOW_DOT_DIRS.has(name)) return true;
  return false;
}

function listFiles() {
  const res = [];
  const stack = [ROOT];
  while (stack.length) {
    const d = stack.pop();
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
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
    "Данные: YAML/JSON; сборка датасета (js-yaml + zod). Таймлайн/d3, Граф/@xyflow/react, Карта/d3-geo.",
    "Поиск: Fuse + фасеты. RU/EN/ORIG. PWA офлайн (IndexedDB). Zero-backend.",
  ].join("\n");

  const llmRules = [
    "ПРАВИЛА ДЛЯ НЕЙРОСЕТЕЙ:",
    "- Язык — RU. Код только в ```<язык> блоках.",
    "- Ссылайся на полные пути. Патчи — минимальные или целиком файл.",
    "- Не выдумывай зависимости; при отсутствии данных — запрос уточнений.",
    "- i18n: RU→EN→ORIG. Даты: ISO 8601, circa, календарь.",
    "- PDF в MVP — print CSS. CI контекст — автономен.",
    "- Никогда не генерируй весь файл целиком — только конкретные блоки для замены.",
  ].join("\n");

  const now = new Date().toISOString();
  let version = "0.0.0";
  try { version = require(path.join(ROOT, "package.json")).version || version; } catch {}

  return [
    "=== ОБЗОР ПРОЕКТА ===",
    overview, "", llmRules, "",
    `Сгенерировано: ${now}`, `Версия проекта: ${version}`, ""
  ].join("\n");
}

function run() {
  const files = listFiles().filter(isText);
  let full = headerBlock();

  for (const rel of files) {
    const label = "/" + toUnix(rel);
    let body = "";
    try { body = fs.readFileSync(path.join(ROOT, rel), "utf8"); }
    catch (e) { body = `// read error: ${e.message}`; }
    full += `\n// FILE: ${label}\n${body}\n`;
  }

  fs.writeFileSync(path.join(META, "project-full.txt"), full, "utf8");

  // adaptive такой же формат (без обрезки — fallback не ограничивает)
  fs.writeFileSync(path.join(META, "project-adaptive.txt"), full, "utf8");

  console.log("Fallback generation done (files only, full code).");
}

try { run(); } catch (e) { console.error(e); process.exit(1); }
