"use client";
import React, { useEffect, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { loadDataset } from "@/lib/data-loader";

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadDataset().then(ds => {
      const ns = ds.nodes.slice(0, 12).map((n, i) => ({
        id: n.id,
        data: { label: (n.names.ru || n.names.en || n.id || "").slice(0, 24) },
        position: { x: 100 + (i % 4)*220, y: 80 + Math.floor(i/4)*140 },
        style: { background: "#0f1530", color: "#e6e7ee", border: "1px solid #283259", borderRadius: 8, padding: 4 }
      }));
      const es = ds.edges.slice(0, 16).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: e.color || "#7c3aed" }
      }));
      setNodes(ns as any);
      setEdges(es as any);
    });
  }, [setNodes, setEdges]);

  return (
    <div className="panel" style={{ height: 540 }}>
      <h2 style={{ marginTop: 0 }}>Граф связей</h2>
      <div style={{ height: 480 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
