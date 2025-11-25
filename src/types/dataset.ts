export type Lang = "ru" | "en" | "orig";
export type LocaleString = Partial<Record<Lang, string>>;

export interface DateApprox {
  iso?: string;
  year?: number;
  month?: number;
  day?: number;
  circa?: boolean;
  calendar?: "gregorian" | "julian";
}

export interface Statement {
  pid: string; // P100, P200...
  value: unknown;
  qualifiers?: Record<string, unknown>;
  sources?: Array<{ title: string; url?: string }>;
  confidence?: number;
}

export interface BaseNode {
  id: string;
  nid?: string;
  names: LocaleString;
  descriptions?: LocaleString;
  aliases?: string[];
  attrs?: Record<string, unknown>;
  statements?: Statement[];
}

export interface Person extends BaseNode { kind: "Person"; }
export interface Work extends BaseNode {
  kind: "Work";
  catalog?: Record<string, unknown>;
  composer?: string;
  year?: number;
}
export interface Instrument extends BaseNode {
  kind: "Instrument";
  maker?: string;
  year?: number;
  model?: string;
  serial?: string;
}
export interface Place extends BaseNode {
  kind: "Place";
  lat: number;
  lon: number;
  countries?: Array<{ name: LocaleString; from?: DateApprox; to?: DateApprox }>;
}
export interface Event extends BaseNode {
  kind: "Event";
  date?: DateApprox;
  place?: string;
}

export type Node = Person | Work | Instrument | Place | Event;

export interface Edge {
  id: string;
  type:
    | "teacher"
    | "concert"
    | "family"
    | "luthier"
    | "friend"
    | "performed"
    | "used"
    | "residence"
    | "attended"
    | "participated";
  source: string;
  target: string;
  start?: DateApprox;
  end?: DateApprox;
  color?: string;
}

export interface Dataset {
  nodes: Node[];
  edges: Edge[];
  generatedAt: string;
  version: string;
}
