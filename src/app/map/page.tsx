"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { withBase } from "@/lib/basePath";
import { loadDataset } from "@/lib/data-loader";

export default function MapPage() {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    (async () => {
      const svg = d3.select(ref.current!);
      const w = 1100, h = 540;
      svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("height", 540);
      svg.selectAll("*").remove();

      const world = await fetch(withBase("/geo/world.json")).then((r) => r.json());
      const projection = d3.geoEqualEarth().fitExtent([[10, 10], [w - 10, h - 10]], { type: "Sphere" } as any);
      const path = d3.geoPath(projection);

      const g = svg.append("g");
      // Земля
      g.append("path")
        .datum({ type: "Sphere" } as any)
        .attr("d", path as any)
        .attr("fill", "#0a1022")
        .attr("stroke", "#283259");

      // Контуры стран (если в world.json страны)
      if (Array.isArray(world.features)) {
        g.selectAll("path.country")
          .data(world.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path as any)
          .attr("fill", "#0e1630")
          .attr("stroke", "#1f2750")
          .attr("stroke-width", 0.5);
      }

      const ds = await loadDataset();
      const places = ds.nodes.filter((n: any) => n.kind === "Place" && typeof n.lat === "number" && typeof n.lon === "number");
      g.selectAll("circle.place")
        .data(places)
        .enter()
        .append("circle")
        .attr("class", "place")
        .attr("cx", (d: any) => projection([d.lon, d.lat])![0])
        .attr("cy", (d: any) => projection([d.lon, d.lat])![1])
        .attr("r", 3.5)
        .attr("fill", "#ffda00")
        .append("title")
        .text((d: any) => d.names?.ru || d.names?.en || d.id);
    })();
  }, []);

  return (
    <div>
      <h2>Карта</h2>
      <svg ref={ref} />
    </div>
  );
}
