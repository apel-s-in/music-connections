#!/usr/bin/env node
/* eslint-disable no-console */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const outDir = path.join(ROOT, "public", "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const dataset = {
  nodes: [
    { kind: "Place", id: "L0101", names: { ru: "Санкт‑Петербург", en: "Saint Petersburg" }, lat: 59.93, lon: 30.33 },
    { kind: "Person", id: "heifetz", names: { ru: "Яша Хейфец", en: "Jascha Heifetz" } },
    { kind: "Work", id: "W0001", names: { ru: "Каприс №24", en: "Caprice No. 24" } }
  ],
  edges: [
    { id: "e1", type: "performed", source: "heifetz", target: "W0001", color: "#7c3aed" }
  ],
  generatedAt: new Date().toISOString(),
  version: "data-0"
};

fs.writeFileSync(path.join(outDir, "connections.json"), JSON.stringify(dataset, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "search-index.json"), JSON.stringify({ version: "0", items: [] }, null, 2), "utf8");
console.log("✅ Wrote public/data/connections.json & search-index.json");
