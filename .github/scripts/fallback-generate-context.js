/* eslint-disable no-console */
"use strict";

// Fallback-генератор .meta, не требует внешних зависимостей.
// Запуск: node .github/scripts/fallback-generate-context.js

const fs = require("fs");
const path = require("path");

const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const META = path.join(ROOT, ".meta");

if (!fs.existsSync(META)) fs.mkdirSync(META, { recursive: true });

const BLOCK_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out", "coverage",
  ".meta", ".vscode", ".idea", ".cache", ".husky"
]);
const ALLOW_DOT_DIRS = new Set([".github"]); // .github оставляем
const TEXT_EXTS = new Set([
  ".ts",".tsx",".js",".jsx",".json",".yaml",".yml",".md",".css",".scss",".less",
  ".txt",".html",".webmanifest",".env",".env.example",".yml"
]);

const toUnix = (p) => p.replace(/\\/g, "/");

function shouldSkip(rel, name, isDir) {
  const u = toUnix(rel);
  // Явные системные каталоги в любом месте пути
  for (const b of BLOCK_DIRS) {
    if (u === b || u.startsWith(`${b}/`) || u.includes(`/${b}/`)) return true;
  }
  if (isDir) {
    // Любая скрытая папка, кроме whitelisted (.github)
    if (name.startsWith(".") && !ALLOW_DOT_DIRS.has(name)) return true;
  }
  return false;
}

function isText(file) {
  const low = file.toLowerCase();
  for (const ext of TEXT_EXTS) if (low.endsWith(ext)) return true;
  return false;
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

function generate() {
  const files = listFiles();

  // Простое «дерево» из уникальных директорий
  const dirSet = new Set(files.map((f) => toUnix(path.dirname(f))));
  const treeLines = Array.from(dirSet)
    .sort()
    .map((d) => (d === "." ? "/" : d + "/"));

  // FULL
  let full = `Context fallback file
Generated: ${new Date().toISOString()}

# TREE (approx)
${treeLines.join("\n")}

# FILES
`;

  for (const f of files) {
    const p = path.join(ROOT, f);
    let body = "";
    if (isText(f)) {
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

  // ADAPTIVE
  let adaptive = "# COMPACT STRUCTURE\n";
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
