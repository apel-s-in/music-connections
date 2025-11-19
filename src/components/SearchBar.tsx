"use client";

import { useEffect, useMemo, useState } from "react";
import { loadDataset } from "@/lib/data-loader";

type Item = { id: string; label: string; kind: string };

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadDataset().then((ds) => {
      if (cancelled) return;
      const arr: Item[] = ds.nodes.map((n: any) => {
        const label = n.names?.ru || n.names?.en || n.names?.orig || n.id;
        return { id: n.id, label, kind: n.kind || "Node" };
      });
      setItems(arr);
    });
    return () => { cancelled = true; };
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const nq = norm(q);
    const res: Item[] = [];
    for (const it of items) {
      const hay = norm(it.label);
      if (hay.includes(nq)) res.push(it);
      if (res.length >= 12) break;
    }
    return res;
  }, [q, items]);

  function goto(id: string) {
    const base = (document.querySelector("base")?.getAttribute("href") || "/").replace(/\/$/, "");
    window.location.assign(`${base}/graph/#${encodeURIComponent(id)}`);
  }

  return (
    <div style={{ position: "relative", width: 360 }}>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) goto(results[0].id);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Поиск по именам…"
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 8,
          border: "1px solid #26304d", background: "#0f1530", color: "#e6e7ee"
        }}
      />
      {open && q && results.length > 0 && (
        <div
          style={{
            position: "absolute", top: 40, left: 0, right: 0, zIndex: 20,
            background: "#0f1530", border: "1px solid #283259", borderRadius: 8
          }}
        >
          {results.map((r) => (
            <div
              key={r.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goto(r.id)}
              style={{ padding: "8px 10px", cursor: "pointer" }}
              title={`Перейти к узлу ${r.id}`}
            >
              <span style={{ opacity: 0.7, marginRight: 6 }}>{r.kind}</span>
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
