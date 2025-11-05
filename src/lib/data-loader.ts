import { Dataset } from "@/types/dataset";
import { withBase } from "./basePath";

export async function loadDataset(): Promise<Dataset> {
  try {
    const res = await fetch(withBase("/data/connections.json"));
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as Dataset;
  } catch {
    // Заглушка: минимальный датасет для первого запуска
    return {
      nodes: [
        { kind: "Place", id: "L0101", names: { ru: "Санкт‑Петербург", en: "Saint Petersburg" }, lat: 59.93, lon: 30.33 },
        { kind: "Person", id: "heifetz", names: { ru: "Яша Хейфец", en: "Jascha Heifetz" } },
        { kind: "Work", id: "W0001", names: { ru: "Каприс №24", en: "Caprice No. 24" }, attrs: { composer: "paganini" } }
      ] as any,
      edges: [
        { id: "e1", type: "performed", source: "heifetz", target: "W0001", color: "#7c3aed" }
      ],
      generatedAt: new Date().toISOString(),
      version: "data-0"
    };
  }
}
