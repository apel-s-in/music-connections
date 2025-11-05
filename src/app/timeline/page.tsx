"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { loadDataset } from "@/lib/data-loader";

export default function TimelinePage() {
  const [ver, setVer] = useState<string>("");
  const ref = useRef<SVGSVGElement>(null);
  const [range, setRange] = useState<[Date, Date]>([new Date(1780,0,1), new Date(2000,0,1)]);

  useEffect(() => {
    loadDataset().then(ds => setVer(`${ds.version} · ${new Date(ds.generatedAt).toISOString().slice(0,10)}`));
  }, []);

  useEffect(() => {
    const svg = d3.select(ref.current!);
    const w = 1100, h = 220, m = {l:50, r:20, t:20, b:30};
    svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("height", 260);
    svg.selectAll("*").remove();

    const x = d3.scaleTime().domain(range).range([m.l, w - m.r]);
    const axis = d3.axisBottom<Date>(x).ticks(10).tickSizeOuter(0);
    svg.append("g").attr("transform", `translate(0,${h - m.b})`).attr("color", "#6b7280").call(axis as any);

    // Пример “лент жизни” — две тестовые полосы
    const bands = [
      { name: "Яша Хейфец", color: "#22c55e", start: new Date(1901,1,2), end: new Date(1987,11,10) },
      { name: "Н. Паганини", color: "#ef4444", start: new Date(1782,1,27), end: new Date(1840,7,27) }
    ];
    const y0 = 50, rowH = 24, gap = 12;
    bands.forEach((b, i) => {
      const y = y0 + i*(rowH+gap);
      svg.append("rect")
        .attr("x", x(b.start)).attr("y", y)
        .attr("width", Math.max(2, x(b.end)-x(b.start))).attr("height", rowH)
        .attr("rx", 8).attr("fill", b.color).attr("opacity", 0.85);
      svg.append("text")
        .attr("x", x(b.start)+6).attr("y", y+rowH/2+5)
        .attr("font-size", 12).attr("fill", "#0b1020").text(b.name);
    });

    // Зум/панорамирование
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .on("zoom", (ev) => {
        const t = ev.transform;
        const zx = t.rescaleX(x);
        svg.selectAll("g").filter(function() { return (this as SVGGElement).getAttribute("data-axis") !== null; });
        svg.selectAll("g").remove();
        const axis2 = d3.axisBottom<Date>(zx).ticks(10).tickSizeOuter(0);
        svg.append("g").attr("transform", `translate(0,${h - m.b})`).attr("color", "#6b7280").attr("data-axis", "1").call(axis2 as any);
        bands.forEach((b, i) => {
          const y = y0 + i*(rowH+gap);
          svg.selectAll(`rect.band-${i}`).remove();
          svg.append("rect").attr("class", `band-${i}`)
            .attr("x", zx(b.start)).attr("y", y)
            .attr("width", Math.max(2, zx(b.end)-zx(b.start))).attr("height", rowH)
            .attr("rx", 8).attr("fill", b.color).attr("opacity", 0.85);
          svg.selectAll(`text.band-${i}`).remove();
          svg.append("text").attr("class", `band-${i}`)
            .attr("x", zx(b.start)+6).attr("y", y+rowH/2+5)
            .attr("font-size", 12).attr("fill", "#0b1020").text(b.name);
        });
      });
    svg.call(zoom as any);
  }, [range]);

  return (
    <div className="panel">
      <h2>Таймлайн</h2>
      <svg ref={ref} role="img" aria-label="Временная шкала" />
      <hr />
      <small style={{ color: "var(--muted)" }}>Версия данных: {ver || "—"}</small>
    </div>
  );
}
