"use client";

import React, { useEffect, useState } from "react";
import {
  Background,
  Controls as RFControls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  Node as RFNode,
  Edge as RFEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { loadDataset } from "@/lib/data-loader";
import { isFavorite, setFavorite } from "@/lib/offline";

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    const h = typeof window !== "undefined" ? decodeURIComponent(window.location.hash.slice(1)) : "";
    setFocusId(h || null);
  }, []);

  useEffect(() => {
    (async () => {
      const ds = await loadDataset();
      const want = ds.nodes.slice(0, 30);

      const f = new Set<string>();
      for (const n of want) if (await isFavorite(n.id)) f.add(n.id);
      setFavs(f);

      const ns: RFNode[] = want.map((n: any, i: number) => {
        const name = (n.names?.ru || n.names?.en || n.id || "").slice(0, 42);
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
                    const on = !f.has(n.id);
                    await setFavorite(n.id, on);
                    setFavs((prev) => {
                      const copy = new Set(prev);
                      if (on) copy.add(n.id); else copy.delete(n.id);
                      return copy;
                    });
                  }}
                  title={starred ? "Убрать из избранного" : "В избранное"}
                  style={{ border: "1px solid #283259", borderRadius: 6, width: 22, height: 22, lineHeight: "18px", textAlign: "center", background: "#0f1530", color: "#e6e7ee" }}
                >
                  {f.has(n.id) ? "★" : "☆"}
                </button>
                <span>{name}</span>
              </div>
            ),
          },
          position: { x: 120 + (i % 6) * 180, y: 80 + Math.floor(i / 6) * 120 },
          style: {
            background: "#0f1530",
            color: "#e6e7ee",
            border: `2px solid ${isFocus ? "#ffda00" : "#283259"}`,
            borderRadius: 8,
            padding: 4,
          },
        } as RFNode;
      });

      const es: RFEdge[] = ds.edges.slice(0, 200).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: e.color || "#7c3aed" },
      }));

      setNodes(ns);
      setEdges(es);
    })();
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
