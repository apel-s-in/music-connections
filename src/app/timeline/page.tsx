"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { loadDataset } from "@/lib/data-loader";
import { isFavorite, setFavorite } from "@/lib/offline";

type Band = { id: string; name: string; start: Date; end: Date };

export default function TimelinePage() {
  const [bands, setBands] = useState<Band[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    (async () => {
      const ds = await loadDataset();
      const persons = ds.nodes.filter((n: any) => n.kind === "Person");
      const bs: Band[] = [];
      for (const p of persons) {
        const b = p.attrs?.birth?.year;
        const d = p.attrs?.death?.year;
        if (typeof b === "number" && typeof d === "number") {
          bs.push({
            id: p.id,
            name: (p.names?.ru || p.names?.en || p.id)!,
            start: new Date(b, 0, 1),
            end: new Date(d, 0, 1),
          });
        }
      }
      bs.sort((a, b) => a.start.getFullYear() - b.start.getFullYear());
      const f = new Set<string>();
      for (const b of bs) if (await isFavorite(b.id)) f.add(b.id);
      setFavs(f);
      setBands(bs.slice(0, 20));
    })();
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    const w = 1100, h = 280, m = { l: 60, r: 20, t: 20, b: 34 };
    svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("height", h);
    svg.selectAll("*").remove();

    const min = bands.reduce((m, b) => Math.min(m, b.start.getFullYear()), 9999);
    const max = bands.reduce((m, b) => Math.max(m, b.end.getFullYear()), 0);
    const domain: [Date, Date] = [new Date(min - 10, 0, 1), new Date(max + 10, 0, 1)];

    const x = d3.scaleTime().domain(domain).range([m.l, w - m.r]);
    const axis = d3.axisBottom(x).ticks(10).tickSizeOuter(0);
    svg.append("g").attr("transform", `translate(0,${h - m.b})`).attr("color", "#6b7280").call(axis as any);

    const y0 = 50, rowH = 22, gap = 10;
    bands.forEach((b, i) => {
      const y = y0 + i * (rowH + gap);
      svg.append("rect")
        .attr("x", x(b.start)).attr("y", y)
        .attr("width", Math.max(2, x(b.end) - x(b.start))).attr("height", rowH)
        .attr("rx", 8).attr("fill", "#2e3770").attr("opacity", 0.9);

      svg.append("text")
        .attr("x", x(b.start) + 6).attr("y", y + rowH / 2 + 5)
        .attr("font-size", 12).attr("fill", "#e6e7ee")
        .text(`${b.name} (${b.start.getFullYear()}–${b.end.getFullYear()})`);

      const starX = x(domain[0]) + 10;
      svg.append("text")
        .attr("x", starX).attr("y", y + rowH / 2 + 5)
        .attr("font-size", 14).attr("fill", "#ffda00")
        .attr("cursor", "pointer")
        .text(favs.has(b.id) ? "★" : "☆")
        .on("click", async () => {
          const on = !favs.has(b.id);
          await setFavorite(b.id, on);
          const next = new Set(favs);
          if (on) next.add(b.id); else next.delete(b.id);
          setFavs(next);
        });
    });
  }, [bands, favs]);

  return (
    <div>
      <h2>Таймлайн</h2>
      <svg ref={ref} />
    </div>
  );
}
