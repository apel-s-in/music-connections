#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const outDir = path.join(ROOT, "public", "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const now = new Date().toISOString();

// ДЕМО-ДАТАСЕТ: 8 мест, 10 персон, 3 события, связи "teacher" и "participated"
const dataset = {
  version: "demo-1.1",
  generatedAt: now,
  nodes: [
    // Places
    { kind: "Place", id: "bordeaux", names: { ru: "Бордо", en: "Bordeaux" }, lat: 44.84, lon: -0.58 },
    { kind: "Place", id: "vienna", names: { ru: "Вена", en: "Vienna" }, lat: 48.2082, lon: 16.3738 },
    { kind: "Place", id: "hanover", names: { ru: "Ганновер", en: "Hanover" }, lat: 52.3759, lon: 9.732 },
    { kind: "Place", id: "st_petersburg", names: { ru: "Санкт‑Петербург", en: "St. Petersburg" }, lat: 59.9343, lon: 30.3351 },
    { kind: "Place", id: "odessa", names: { ru: "Одесса", en: "Odesa" }, lat: 46.4825, lon: 30.7233 },
    { kind: "Place", id: "moscow", names: { ru: "Москва", en: "Moscow" }, lat: 55.7558, lon: 37.6173 },
    { kind: "Place", id: "bucharest", names: { ru: "Бухарест", en: "Bucharest" }, lat: 44.4268, lon: 26.1025 },
    { kind: "Place", id: "new_york", names: { ru: "Нью‑Йорк", en: "New York" }, lat: 40.7128, lon: -74.006 },

    // Persons (важно: есть attrs.birth/death для таймлайна)
    { kind: "Person", id: "rode", names: { ru: "Пьер Роде", en: "Pierre Rode", orig: "Pierre Rode" }, aliases: ["Rode"], attrs: { birth: { year: 1774 }, death: { year: 1830 } } },
    { kind: "Person", id: "boehm", names: { ru: "Иозеф Бём", en: "Joseph Böhm", orig: "Joseph Böhm" }, aliases: ["Boehm","Böhm"], attrs: { birth: { year: 1795 }, death: { year: 1876 } } },
    { kind: "Person", id: "joachim", names: { ru: "Иозеф Иоахим", en: "Joseph Joachim" }, aliases: ["Joachim"], attrs: { birth: { year: 1831 }, death: { year: 1907 } } },
    { kind: "Person", id: "auer", names: { ru: "Леопольд Ауэр", en: "Leopold Auer" }, aliases: ["Auer"], attrs: { birth: { year: 1845 }, death: { year: 1930 } } },
    { kind: "Person", id: "heifetz", names: { ru: "Яша Хейфец", en: "Jascha Heifetz" }, aliases: ["Heifetz"], attrs: { birth: { year: 1901 }, death: { year: 1987 } } },
    { kind: "Person", id: "milstein", names: { ru: "Натан Мильштейн", en: "Nathan Milstein" }, aliases: ["Milstein"], attrs: { birth: { year: 1904 }, death: { year: 1992 } } },
    { kind: "Person", id: "oistrakh", names: { ru: "Давид Ойстрах", en: "David Oistrakh" }, aliases: ["Oistrakh"], attrs: { birth: { year: 1908 }, death: { year: 1974 } } },
    { kind: "Person", id: "stolyarsky", names: { ru: "Пётр Столярский", en: "Pyotr Stolyarsky" }, aliases: ["Stolyarsky"], attrs: { birth: { year: 1871 }, death: { year: 1944 } } },
    { kind: "Person", id: "menuhin", names: { ru: "Ехуди Менухин", en: "Yehudi Menuhin" }, aliases: ["Menuhin"], attrs: { birth: { year: 1916 }, death: { year: 1999 } } },
    { kind: "Person", id: "enescu", names: { ru: "Джордже Энеску", en: "George Enescu" }, aliases: ["Enesco","Enescu"], attrs: { birth: { year: 1881 }, death: { year: 1955 } } },

    // Events (точечные/диапазонные)
    { kind: "Event", id: "evt_auer_class_1912", names: { ru: "Класс Ауэра (концерт)", en: "Auer class concert" }, attrs: { date: { iso: "1912-03-10" } }, place: "st_petersburg", emoji: "🎻" },
    { kind: "Event", id: "evt_menuhin_enescu_1927", names: { ru: "Уроки Менухина у Энеску", en: "Menuhin with Enescu" }, attrs: { range: { start: "1927-01-01", end: "1927-12-31" } }, place: "paris", emoji: "🎼" },
    { kind: "Event", id: "evt_oistrakh_moscow_1935", names: { ru: "Концерт Ойстраха (Москва)", en: "Oistrakh concert, Moscow" }, attrs: { date: { iso: "1935-11-20" } }, place: "moscow", emoji: "⭐" }
  ],
  edges: [
    // Учебные связи
    { id: "e1", type: "teacher", source: "rode", target: "boehm", start: { year: 1810 }, end: { year: 1815 } },
    { id: "e2", type: "teacher", source: "boehm", target: "joachim", start: { year: 1840 }, end: { year: 1848 } },
    { id: "e3", type: "teacher", source: "joachim", target: "auer", start: { year: 1864 }, end: { year: 1867 } },
    { id: "e4", type: "teacher", source: "auer", target: "heifetz", start: { year: 1910 }, end: { year: 1917 } },
    { id: "e5", type: "teacher", source: "auer", target: "milstein", start: { year: 1912 }, end: { year: 1917 } },
    { id: "e6", type: "teacher", source: "stolyarsky", target: "oistrakh", start: { year: 1923 }, end: { year: 1930 } },
    { id: "e7", type: "teacher", source: "enescu", target: "menuhin", start: { year: 1927 }, end: { year: 1935 } },

    // Участие в событиях (Event ←→ Person)
    { id: "p1", type: "participated", source: "heifetz", target: "evt_auer_class_1912" },
    { id: "p2", type: "participated", source: "milstein", target: "evt_auer_class_1912" },
    { id: "p3", type: "participated", source: "menuhin", target: "evt_menuhin_enescu_1927" },
    { id: "p4", type: "participated", source: "enescu", target: "evt_menuhin_enescu_1927" },
    { id: "p5", type: "participated", source: "oistrakh", target: "evt_oistrakh_moscow_1935" }
  ]
};

// Поисковый индекс
const searchIndex = dataset.nodes.map((n) => ({
  id: n.id,
  kind: n.kind,
  label: (n.names && (n.names.ru || n.names.en || n.names.orig)) || n.id,
  aliases: n.aliases || []
}));

fs.writeFileSync(path.join(outDir, "connections.json"), JSON.stringify(dataset, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "search-index.json"), JSON.stringify(searchIndex, null, 2), "utf8");
console.log("Wrote public/data/connections.json & search-index.json (demo dataset with events).");
