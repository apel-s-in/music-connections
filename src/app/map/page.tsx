"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { withBase } from "@/lib/basePath";
import { loadDataset } from "@/lib/data-loader";

export default function MapPage() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    (async () => {
      const svg = d3.select(ref.current!);
      const w = 1100, h = 540;
      svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("height", 540);
      svg.selectAll("*").remove();

      const projection = d3.geoEqualEarth().fitExtent([[10,10],[w-10,h-10]], { type:"Sphere" } as any);
      const path = d3.geoPath(projection);
      const g = svg.append("g");

      // Земля — без политических границ (мы рисуем по вашему world.json только land-геометрию, но файл у вас — страны).
      // Для старта отрисуем контуры стран тонкой линией, заливая «материк».
      const world: any = await fetch(withBase("/geo/world.json")).then(r => r.json());
      g.selectAll("path.country")
        .data(world.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path as any)
        .attr("fill", "#0d1330")
        .attr("stroke", "#26304d")
        .attr("stroke-width", 0.6)
        .attr("opacity", 0.7);

      // Пример точек Place из датасета
      const ds = await loadDataset();
      const places = ds.nodes.filter((n: any) => n.kind === "Place" && typeof n.lat === "number" && typeof n.lon === "number");
      const pts = g.selectAll("circle.place")
        .data(places)
        .enter()
        .append("circle")
        .attr("class", "place")
        .attr("r", 3.5)
        .attr("fill", "#22c55e")
        .attr("stroke", "#091024")
        .attr("stroke-width", 1);

      pts.attr("cx", (d: any) => projection([d.lon, d.lat])![0])
         .attr("cy", (d: any) => projection([d.lon, d.lat])![1]);

      // Зум/панорамирование
      svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 8]).on("zoom", (ev) => {
        g.attr("transform", String(ev.transform));
      }) as any);
    })();
  }, []);

  return (
    <div className="panel">
      <h2>Карта</h2>
      <svg ref={ref} role="img" aria-label="Карта Equal Earth" />
    </div>
  );
}
