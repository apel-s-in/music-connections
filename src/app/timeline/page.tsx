"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { loadDataset } from "@/lib/data-loader";
import { isFavorite, setFavorite } from "@/lib/offline";

type PersonBand = { id: string; name: string; start: Date; end: Date };
type EventPoint = { id: string; name: string; date?: Date; start?: Date; end?: Date; emoji?: string };

type Toggles = {
  showEvents: boolean;
  showTeacherLinks: boolean;
  showOtherLinks: boolean; // участники/дружба и т.п.
};

function fmtYear(d: Date) { return d.getFullYear(); }
function initials(s: string) {
  const parts = s.split(/\s+/).filter(Boolean);
  const take = (w: string) => (w[0] || "").toUpperCase();
  return (take(parts[0] || "") + (parts[1] ? take(parts[1]) : "")).slice(0, 2) || "•";
}

export default function TimelinePage() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [persons, setPersons] = useState<PersonBand[]>([]);
  const [events, setEvents] = useState<EventPoint[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1100, h: 420 });
  const [domain, setDomain] = useState<[Date, Date]>([new Date(1800, 0, 1), new Date()]);
  const [selectedPersons, setSelectedPersons] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [toggles, setToggles] = useState<Toggles>({ showEvents: true, showTeacherLinks: true, showOtherLinks: true });
  const [featured, setFeatured] = useState<string[]>([]); // 5 id персон для “кружочков” сверху

  // 1) Загрузка данных
  useEffect(() => {
    (async () => {
      const ds = await loadDataset();

      const ps: PersonBand[] = [];
      for (const n of ds.nodes) {
        if (n.kind === "Person") {
          const b = n.attrs?.birth?.year;
          const d = n.attrs?.death?.year;
          if (typeof b === "number" && typeof d === "number") {
            ps.push({ id: n.id, name: n.names?.ru || n.names?.en || n.id, start: new Date(b, 0, 1), end: new Date(d, 0, 1) });
          }
        }
      }
      ps.sort((a, b) => fmtYear(a.start) - fmtYear(b.start));

      const evs: EventPoint[] = [];
      for (const n of ds.nodes) {
        if (n.kind === "Event") {
          const name = n.names?.ru || n.names?.en || n.id;
          const emoji = (n as any).emoji as string | undefined;
          const d = n.attrs?.date?.iso ? new Date(n.attrs.date.iso) : undefined;
          const s = n.attrs?.range?.start ? new Date(n.attrs.range.start) : undefined;
          const e = n.attrs?.range?.end ? new Date(n.attrs.range.end) : undefined;
          evs.push({ id: n.id, name, date: d, start: s, end: e, emoji });
        }
      }

      const f = new Set<string>();
      for (const p of ps) if (await isFavorite(p.id)) f.add(p.id);

      setFavs(f);
      setPersons(ps);
      setEvents(evs);
      setEdges(ds.edges || []);

      // домен — от самого раннего до сегодня
      const minYear = Math.min(
        ps.length ? fmtYear(ps[0].start) : 9999,
        evs.length && evs[0].date ? evs.reduce((m, e) => Math.min(m, e.date ? e.date.getFullYear() : m), 9999) : 9999
      );
      const min = new Date((isFinite(minYear) ? minYear : 1800) - 5, 0, 1);
      setDomain([min, new Date()]);

      // 5 “featured” персон — простой ротационный выбор
      const ids = ps.map((p) => p.id);
      const shuffled = ids.sort(() => 0.5 - Math.random()).slice(0, 5);
      setFeatured(shuffled);
    })();
  }, []);

  // Ротация “featured” каждые 10 секунд
  useEffect(() => {
    if (!persons.length) return;
    const t = setInterval(() => {
      const ids = persons.map((p) => p.id);
      const next = ids.sort(() => 0.5 - Math.random()).slice(0, 5);
      setFeatured(next);
    }, 10000);
    return () => clearInterval(t);
  }, [persons.length]);

  // Responsive
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(640, Math.floor(e.contentRect.width));
        const rowH = 22, gap = 10, mTop = 72, mBottom = 46; // сверху место под линейку и “кружочки”
        const h = mTop + mBottom + persons.length * (rowH + gap) + 30;
        setSize({ w, h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [persons.length]);

  // Полезные индексы
  const participantIndex = useMemo(() => {
    // EventID -> Set<PersonID>, PersonID -> Set<EventID>
    const evToPe = new Map<string, Set<string>>();
    const peToEv = new Map<string, Set<string>>();
    for (const e of edges) {
      if (e.type === "participated") {
        const pe = String(e.source);
        const ev = String(e.target);
        if (!evToPe.has(ev)) evToPe.set(ev, new Set());
        if (!peToEv.has(pe)) peToEv.set(pe, new Set());
        evToPe.get(ev)!.add(pe);
        peToEv.get(pe)!.add(ev);
      }
    }
    return { evToPe, peToEv };
  }, [edges]);

  // 2) Рендер
  useEffect(() => {
    if (!svgRef.current || persons.length === 0) return;

    const w = size.w, h = size.h;
    const m = { l: 80, r: 20, t: 56, b: 46 }; // верх больше: линейка + панель
    const rowH = 22, gap = 10, y0 = m.t + 50; // + место под “кружочки”

    // Ось/масштаб
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("height", h);

    let x = d3.scaleTime().domain(domain).range([m.l, w - m.r]);
    const g = svg.append("g");

    // Панель управления
    const ui = svg.append("g").attr("transform", `translate(${m.l},${20})`);
    const pills: Array<{ key: keyof Toggles; text: string }> = [
      { key: "showEvents", text: "События" },
      { key: "showTeacherLinks", text: "Учебные связи" },
      { key: "showOtherLinks", text: "Другие связи" }
    ];
    let offsetX = 0;
    pills.forEach((p) => {
      const on = (toggles as any)[p.key] as boolean;
      const gP = ui.append("g").attr("cursor", "pointer").attr("transform", `translate(${offsetX},0)`);
      const wP = 130, hP = 22;
      gP.append("rect").attr("x", 0).attr("y", -16).attr("rx", 12).attr("width", wP).attr("height", hP)
        .attr("fill", on ? "#263b8e" : "#1a2248").attr("stroke", "#39407a");
      gP.append("text").attr("x", 10).attr("y", 0).attr("dominant-baseline", "middle").attr("fill", "#e6e7ee").attr("font-size", 12).text(p.text);
      gP.on("click", () => {
        setToggles((t) => ({ ...t, [p.key]: !t[p.key] }));
      });
      offsetX += wP + 8;
    });
    // Кнопка сброса
    const gReset = ui.append("g").attr("cursor", "pointer").attr("transform", `translate(${offsetX},0)`);
    gReset.append("rect").attr("x", 0).attr("y", -16).attr("rx", 12).attr("width", 80).attr("height", 22).attr("fill", "#3b1f38").attr("stroke", "#6b335f");
    gReset.append("text").attr("x", 10).attr("y", 0).attr("dominant-baseline", "middle").attr("fill", "#ffd1e8").attr("font-size", 12).text("Сброс");
    gReset.on("click", () => { setSelectedPersons(new Set()); setSelectedEvents(new Set()); });

    // “Кружочки” с 5 персонами
    const gFeat = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    let fx = 0;
    for (const id of featured) {
      const p = persons.find((pp) => pp.id === id);
      if (!p) continue;
      const label = p.name;
      const gF = gFeat.append("g").attr("cursor", "pointer").attr("transform", `translate(${fx},0)`);
      gF.append("circle").attr("r", 18).attr("cx", 18).attr("cy", 18).attr("fill", "#20306a").attr("stroke", "#7c94ff");
      gF.append("text").attr("x", 18).attr("y", 20).attr("text-anchor", "middle").attr("fill", "#e6e7ee").attr("font-size", 12).text(initials(label));
      gF.append("title").text(label);
      gF.on("click", () => {
        const mid = new Date((p.start.getTime() + p.end.getTime()) / 2);
        const k = 2; // приблизим х2
        const tx = (w / 2) - k * x(mid);
        const transform = d3.zoomIdentity.translate(tx, 0).scale(k);
        (svg as any).transition().duration(350).call(zoom.transform as any, transform);
      });
      fx += 44;
    }

    // Рисуем “деревянную линейку” (ось сверху)
    const gRuler = g.append("g").attr("transform", `translate(0,${m.t - 8})`);
    function drawRuler(ax: d3.ScaleTime<number, number>) {
      gRuler.selectAll("*").remove();
      const pxPerDay = Math.abs(ax(new Date(2000, 0, 2)) - ax(new Date(2000, 0, 1)));
      // выбираем шаг: день/неделя/месяц/год — чтобы деление было ~≥ 60px
      let tickEvery: any = d3.timeDay.every(1);
      if (pxPerDay < 2) tickEvery = d3.timeWeek.every(1);
      if (pxPerDay < 0.3) tickEvery = d3.timeMonth.every(1);
      if (pxPerDay < 0.04) tickEvery = d3.timeYear.every(1);

      // фон линейки
      gRuler.append("rect")
        .attr("x", m.l).attr("y", -24).attr("width", w - m.l - m.r).attr("height", 28)
        .attr("fill", "#2a2a1f").attr("stroke", "#756d44");

      const axis = d3.axisTop(ax).ticks(tickEvery).tickSize(8).tickPadding(6);
      gRuler.append("g").attr("transform", `translate(0,0)`).attr("color", "#e6e7ee").call(axis as any);

      // мелкие засечки под каждый день, если достаточно места
      if (pxPerDay >= 6) {
        const dayInterval = d3.timeDay.every(1) ?? d3.timeDay;
        const days = ax.ticks(dayInterval);
        gRuler.selectAll("line.day")
          .data(days)
          .enter()
          .append("line")
          .attr("class", "day")
          .attr("x1", (d: any) => ax(d)).attr("x2", (d: any) => ax(d))
          .attr("y1", 4).attr("y2", 10)
          .attr("stroke", "#cbbf86");
      }
    }

    // Слои
    const gAxis = g.append("g").attr("transform", `translate(0,${h - m.b})`).attr("color", "#8a90a5");
    const gRows = g.append("g");
    const gEvents = g.append("g");
    const gLinks = g.append("g").attr("pointer-events", "none"); // линии-подсветки

    // Предварительные функции рисования
    function drawAxis(ax: d3.ScaleTime<number, number>) {
      gAxis.selectAll("*").remove();
      const axis = d3.axisBottom(ax).ticks(Math.round(w / 110)).tickSizeOuter(0);
      gAxis.call(axis as any);
    }

    function isSelectedPerson(id: string) { return selectedPersons.has(id); }
    function isSelectedEvent(id: string) { return selectedEvents.has(id); }

    function drawBands(ax: d3.ScaleTime<number, number>) {
      gRows.selectAll("*").remove();

      const yFor = (idx: number) => y0 + idx * (rowH + gap);

      persons.forEach((b, i) => {
        const y = yFor(i);
        const selected = isSelectedPerson(b.id);
        const alpha = selectedPersons.size || selectedEvents.size
          ? (selected ? 1 : 0.25)
          : 1;

        // фоновая лента
        gRows.append("rect")
          .attr("x", ax(b.start)).attr("y", y)
          .attr("width", Math.max(2, ax(b.end) - ax(b.start))).attr("height", rowH)
          .attr("rx", 8)
          .attr("fill", selected ? "#3042a8" : "#2e3770")
          .attr("opacity", 0.9 * alpha);

        // подпись
        gRows.append("text")
          .attr("x", ax(b.start) + 6).attr("y", y + rowH / 2 + 5)
          .attr("font-size", 12).attr("fill", "#e6e7ee").attr("opacity", alpha)
          .text(`${b.name} (${fmtYear(b.start)}–${fmtYear(b.end)})`);

        // звезда избранного
        gRows.append("text")
          .attr("x", m.l - 24).attr("y", y + rowH / 2 + 5)
          .attr("font-size", 14).attr("fill", "#ffda00").attr("cursor", "pointer").attr("opacity", alpha)
          .text(favs.has(b.id) ? "★" : "☆")
          .on("click", async () => {
            const on = !favs.has(b.id);
            await setFavorite(b.id, on);
            setFavs((prev) => {
              const next = new Set(prev);
              if (on) next.add(b.id); else next.delete(b.id);
              return next;
            });
          });

        // клик по ленте — выбор/сброс
        gRows.append("rect")
          .attr("x", ax(b.start)).attr("y", y)
          .attr("width", Math.max(2, ax(b.end) - ax(b.start))).attr("height", rowH)
          .attr("rx", 8).attr("fill", "transparent")
          .on("click", () => {
            setSelectedPersons((prev) => {
              const next = new Set(prev);
              if (next.has(b.id)) next.delete(b.id); else next.add(b.id);
              return next;
            });
          });
      });
    }

    function drawEventLayer(ax: d3.ScaleTime<number, number>) {
      gEvents.selectAll("*").remove();
      if (!toggles.showEvents) return;

      const baseY = m.t + 18; // под линейкой
      const k = 1; // масштаб пиктограмм

      events.forEach((ev) => {
        const isPoint = !!ev.date || (!!ev.start && !ev.end);
        const cx = ev.date ? ax(ev.date) : (ev.start && ev.end) ? (ax(ev.start) + ax(ev.end)) / 2 : ax(new Date());
        const sel = isSelectedEvent(ev.id);
        const alpha = selectedPersons.size || selectedEvents.size
          ? (sel ? 1 : 0.25)
          : 1;

        if (isPoint) {
          // кружок/эмодзи
          gEvents.append("circle").attr("cx", cx).attr("cy", baseY).attr("r", 6 * k)
            .attr("fill", sel ? "#ffd34d" : "#ff9f1a").attr("stroke", "#7c3aed").attr("opacity", alpha);
          gEvents.append("text").attr("x", cx).attr("y", baseY - 12)
            .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#e6e7ee").attr("opacity", alpha)
            .text(ev.emoji || "●");
        } else {
          // диапазон — ромбики по краям + линия
          const sx = ax(ev.start!);
          const ex = ax(ev.end!);
          gEvents.append("line").attr("x1", sx).attr("x2", ex).attr("y1", baseY).attr("y2", baseY)
            .attr("stroke", sel ? "#ffd34d" : "#ff9f1a").attr("stroke-width", 2).attr("opacity", alpha);
          [sx, ex].forEach((xv) => {
            gEvents.append("rect").attr("x", xv - 5).attr("y", baseY - 5).attr("width", 10).attr("height", 10)
              .attr("transform", `rotate(45,${xv},${baseY})`)
              .attr("fill", sel ? "#ffd34d" : "#ff9f1a").attr("stroke", "#7c3aed").attr("opacity", alpha);
          });
        }

        gEvents.append("title").text(ev.name);
        // клик — выбор/сброс
        gEvents.append("rect")
          .attr("x", cx - 8).attr("y", baseY - 14).attr("width", 16).attr("height", 18)
          .attr("fill", "transparent")
          .on("click", () => {
            setSelectedEvents((prev) => {
              const next = new Set(prev);
              if (next.has(ev.id)) next.delete(ev.id); else next.add(ev.id);
              return next;
            });
          });
      });
    }

    function drawLinks(ax: d3.ScaleTime<number, number>) {
      gLinks.selectAll("*").remove();

      // Подсветка связей участия: Event ↔ Person
      if (toggles.showOtherLinks && (selectedPersons.size || selectedEvents.size)) {
        const yFor = (idx: number) => y0 + idx * (rowH + gap);
        const idToIndex = new Map<string, number>();
        persons.forEach((p, i) => idToIndex.set(p.id, i));

        // Рисуем вертикальные прожекторы от события к строкам персон
        for (const ev of events) {
          const cx = ev.date ? ax(ev.date) : (ev.start && ev.end) ? (ax(ev.start) + ax(ev.end)) / 2 : null;
          if (cx == null) continue;

          const participants = participantIndex.evToPe.get(ev.id) || new Set<string>();
          const anySelected =
            (selectedEvents.size && selectedEvents.has(ev.id)) ||
            (selectedPersons.size && [...participants].some((pid) => selectedPersons.has(pid)));

          const alpha = (selectedEvents.size || selectedPersons.size) ? (anySelected ? 0.9 : 0.1) : 0.15;

          participants.forEach((pid) => {
            const row = idToIndex.get(pid);
            if (row == null) return;
            const y = yFor(row) + rowH / 2;
            gLinks.append("line")
              .attr("x1", cx).attr("x2", cx).attr("y1", m.t + 22).attr("y2", y)
              .attr("stroke", "#ffd34d").attr("stroke-opacity", alpha).attr("stroke-dasharray", "3,3");
          });
        }
      }

      // Учебные связи: горизонтальные “подсветки” между лентами в периоде обучения
      if (toggles.showTeacherLinks) {
        const idToIndex = new Map<string, number>();
        persons.forEach((p, i) => idToIndex.set(p.id, i));
        for (const e of edges) {
          if (e.type !== "teacher") continue;
          const a = idToIndex.get(e.source); const b = idToIndex.get(e.target);
          if (a == null || b == null) continue;
          const ya = (y0 + a * (rowH + gap)) + rowH / 2;
          const yb = (y0 + b * (rowH + gap)) + rowH / 2;
          const sx = e.start?.year ? ax(new Date(e.start.year, 0, 1)) : ax(domain[0]);
          const ex = e.end?.year ? ax(new Date(e.end.year, 0, 1)) : ax(domain[1]);

          const selected = selectedPersons.has(e.source) || selectedPersons.has(e.target);
          const alpha = selectedPersons.size ? (selected ? 0.9 : 0.15) : 0.3;

          gLinks.append("path")
            .attr("d", `M${sx},${ya} C${(sx + ex) / 2},${ya} ${(sx + ex) / 2},${yb} ${ex},${yb}`)
            .attr("fill", "none")
            .attr("stroke", "#7c3aed")
            .attr("stroke-opacity", alpha)
            .attr("stroke-width", 2);
        }
      }
    }

    function redraw(ax: d3.ScaleTime<number, number>) {
      drawRuler(ax);
      drawAxis(ax);
      drawEventLayer(ax);
      drawBands(ax);
      drawLinks(ax);
    }

    // Инициал: отрисовать
    redraw(x);

    // Zoom/Pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 200])
      .translateExtent([[m.l - 10000, 0], [w - m.r + 10000, h]])
      .on("zoom", (ev) => {
        const zx = ev.transform.rescaleX(x);
        redraw(zx);
      });

    svg.call(zoom as any);

    // Ctrl+0 — сброс масштаба к домену
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        svg.transition().duration(300).call(zoom.transform as any, d3.zoomIdentity);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [persons, events, edges, favs, selectedPersons, selectedEvents, toggles, domain, size]);

  return (
    <div ref={wrapRef}>
      <h2>Таймлайн</h2>
      <svg ref={svgRef} />
    </div>
  );
}
