"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { withBase } from "@/lib/basePath";
import { loadDataset } from "@/lib/data-loader";

export default function MapPage() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1100, h: 540 });

  // Responsive
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(480, Math.floor(e.contentRect.width));
        const h = Math.round((w / 1100) * 540); // сохраняем пропорцию
        setSize({ w, h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const w = size.w, h = size.h;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("height", h);

    const gRoot = svg.append("g"); // трансформируется zoom'ом
    const gLand = gRoot.append("g");
    const gPlaces = gRoot.append("g");

    // Проекция под размер контейнера
    const projection = d3.geoEqualEarth().fitExtent([[10, 10], [w - 10, h - 10]], { type: "Sphere" } as any);
    const path = d3.geoPath(projection);

    (async () => {
      const world = await fetch(withBase("/geo/world.json")).then((r) => r.json()).catch(() => ({ type: "Sphere" } as any));
      // Земля
      gLand.append("path")
        .datum({ type: "Sphere" } as any)
        .attr("d", path as any)
        .attr("fill", "#0a1022")
        .attr("stroke", "#283259");

      if (Array.isArray((world as any).features)) {
        gLand.selectAll("path.country")
          .data((world as any).features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path as any)
          .attr("fill", "#0e1630")
          .attr("stroke", "#1f2750")
          .attr("stroke-width", 0.5);
      }

      // Точки places
      const ds = await loadDataset();
      const places = ds.nodes.filter((n: any) => n.kind === "Place" && typeof n.lat === "number" && typeof n.lon === "number");

      const pts = gPlaces.selectAll("g.place")
        .data(places)
        .enter()
        .append("g")
        .attr("class", "place")
        .attr("transform", (d: any) => {
          const [x, y] = projection([d.lon, d.lat]) as [number, number];
          return `translate(${x},${y})`;
        });

      pts.append("circle")
        .attr("r", 3.5)
        .attr("fill", "#ffda00")
        .attr("stroke", "#7c3aed")
        .attr("stroke-width", 0.5);

      pts.append("title").text((d: any) => d.names?.ru || d.names?.en || d.id);

      // Zoom/Pan с компенсацией радиуса
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.8, 12])
        .on("zoom", (ev) => {
          const k = ev.transform.k;
          gRoot.attr("transform", ev.transform.toString());
          // радиус маркеров «не раздуваем»: r = base / k
          gPlaces.selectAll("circle").attr("r", 3.5 / k);
          gPlaces.selectAll("circle").attr("stroke-width", 0.5 / Math.sqrt(k));
        });

      svg.call(zoom as any);
    })();
  }, [size.w, size.h]);

  return (
    <div ref={wrapRef}>
      <h2>Карта</h2>
      <svg ref={svgRef} />
    </div>
  );
}
