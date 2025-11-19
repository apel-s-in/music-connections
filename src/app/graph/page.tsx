"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Background, Controls as RFControls, MiniMap, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { loadDataset } from "@/lib/data-loader";
import { isFavorite, setFavorite } from "@/lib/offline";

type RFNode = any;
type RFEdge = any;

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    const h = (typeof window !== "undefined" && window.location.hash) ? decodeURIComponent(window.location.hash.slice(1)) : "";
    setFocusId(h || null);
  }, []);

  useEffect(() => {
    loadDataset().then(async (ds) => {
      const want = ds.nodes.slice(0, 20);
      // Загрузим избранное
      const f = new Set<string>();
      for (const n of want) if (await isFavorite(n.id)) f.add(n.id);
      setFavs(f);

      const ns = want.map((n, i) => {
        const name = (n.names?.ru || n.names?.en || n.id || "").slice(0, 32);
        const starred = f.has(n.id);
        const isFocus = focusId && focusId === n.id;
        return {
          id: n.id,
          data: {
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const nextOn = !f.has(n.id);
                    await setFavorite(n.id, nextOn);
                    setFavs(prev => {
                      const copy = new Set(prev);
                      if (nextOn) copy.add(n.id); else copy.delete(n.id);
                      return copy;
                    });
                    setNodes(nds => nds.map(nd => nd.id === n.id
                      ? { ...nd, data: { ...nd.data, label: (nd.data as any).label } }
                      : nd));
                  }}
                  title={starred ? "Убрать из избранного" : "В избранное"}
                  style={{ border: "1px solid #283259", borderRadius: 6, width: 22, height: 22, lineHeight: "18px", textAlign: "center", background: "#0f1530", color: "#e6e7ee" }}
                >
                  {starred ? "★" : "☆"}
                </button>
                <span>{name}</span>
              </div>
            )
          },
          position: { x: 120 + (i % 5) * 200, y: 80 + Math.floor(i / 5) * 140 },
          style: {
            background: "#0f1530",
            color: "#e6e7ee",
            border: `2px solid ${isFocus ? "#ffda00" : "#283259"}`,
            borderRadius: 8,
            padding: 4
          }
        };
      });

      const es = ds.edges.slice(0, 40).map(e => ({
        id: e.id, source: e.source, target: e.target, animated: true, style: { stroke: e.color || "#7c3aed" }
      }));

      setNodes(ns as any);
      setEdges(es as any);
    });
  }, [setNodes, setEdges, focusId]);

  return (
    <div style={{ height: 560 }}>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
        <Background />
        <MiniMap />
        <RFControls />
      </ReactFlow>
    </div>
  );
}
