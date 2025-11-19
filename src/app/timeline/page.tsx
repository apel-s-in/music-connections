"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { loadDataset } from "@/lib/data-loader";
import { isFavorite, setFavorite } from "@/lib/offline";

type Band = { id: string; name: string; start: Date; end: Date };

export default function TimelinePage() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [bands, setBands] = useState<Band[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1100, h: 320 });

  // 1) Данные
  useEffect(() => {
    (async () => {
      const ds = await loadDataset();
      const persons = ds.nodes.filter((n: any) => n.kind === "Person");
      const bs: Band[] = [];
      for (const p of persons) {
        const by = p.attrs?.birth?.year;
        const dy = p.attrs?.death?.year;
        if (typeof by === "number" && typeof dy === "number") {
          bs.push({
            id: p.id,
            name: (p.names?.ru || p.names?.en || p.id)!,
            start: new Date(by, 0, 1),
            end: new Date(dy, 0, 1),
          });
        }
      }
      bs.sort((a, b) => a.start.getFullYear() - b.start.getFullYear());
      const fav = new Set<string>();
      for (const b of bs) if (await isFavorite(b.id)) fav.add(b.id);
      setFavs(fav);
      setBands(bs);
    })();
  }, []);

  // 2) Responsive: наблюдаем за контейнером
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(480, Math.floor(e.contentRect.width));
        // высоту считаем от количества лент
        const rowH = 22, gap = 10, mTop = 20, mBottom = 36;
        const h = mTop + mBottom + bands.length * (rowH + gap) + 20;
        setSize({ w, h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [bands.length]);

  // 3) Рендер + Zoom/Pan
  useEffect(() => {
    if (!svgRef.current || bands.length === 0) return;

    const w = size.w, h = size.h;
    const m = { l: 70, r: 20, t: 20, b: 36 };
    const rowH = 22, gap = 10, y0 = m.t + 10;

    const minYear = d3.min(bands, (b) => b.start.getFullYear()) ?? 1800;
    const maxYear = d3.max(bands, (b) => b.end.getFullYear()) ?? 2000;
    const domain0: [Date, Date] = [new Date(minYear - 10, 0, 1), new Date(maxYear + 10, 0, 1)];

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("height", h);

    const g = svg.append("g");
    const gAxis = g.append("g").attr("transform", `translate(0,${h - m.b})`).attr("color", "#8a90a5");
    const gRows = g.append("g");

    let x = d3.scaleTime().domain(domain0).range([m.l, w - m.r]);

    function draw(currentX: d3.ScaleTime<number, number>) {
      gAxis.selectAll("*").remove();
      const axis = d3.axisBottom(currentX).ticks(Math.round(w / 100)).tickSizeOuter(0);
      gAxis.call(axis as any);

      gRows.selectAll("*").remove();
      bands.forEach((b, i) => {
        const y = y0 + i * (rowH + gap);
        gRows.append("rect")
          .attr("x", currentX(b.start)).attr("y", y)
          .attr("width", Math.max(2, currentX(b.end) - currentX(b.start))).attr("height", rowH)
          .attr("rx", 8).attr("fill", "#2e3770").attr("opacity", 0.95);

        // подпись
        gRows.append("text")
          .attr("x", currentX(b.start) + 6).attr("y", y + rowH / 2 + 5)
          .attr("font-size", 12).attr("fill", "#e6e7ee")
          .text(`${b.name} (${b.start.getFullYear()}–${b.end.getFullYear()})`);

        // звезда (фиксированная на полосе, не «прыгает» при зуме)
        gRows.append("text")
          .attr("x", m.l - 20).attr("y", y + rowH / 2 + 5)
          .attr("font-size", 14).attr("fill", "#ffda00")
          .attr("cursor", "pointer")
          .text(favs.has(b.id) ? "★" : "☆")
          .on("click", async () => {
            const on = !favs.has(b.id);
            await setFavorite(b.id, on);
            const next = new Set(favs);
            if (on) next.add(b.id); else next.delete(b.id);
            setFavs(next);
            draw(currentX); // перерисуем значок
          });
      });
    }

    draw(x);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 50])
      .translateExtent([[m.l - 200, 0], [w - m.r + 200, h]])
      .on("zoom", (ev) => {
        const zx = ev.transform.rescaleX(x);
        draw(zx);
      });

    svg.call(zoom as any);

    // Ctrl+0 — «fit to data»
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        svg.transition().duration(300).call(zoom.transform as any, d3.zoomIdentity);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bands, favs, size.w, size.h]);

  return (
    <div ref={wrapRef}>
      <h2>Таймлайн</h2>
      <svg ref={svgRef} />
    </div>
  );
}
