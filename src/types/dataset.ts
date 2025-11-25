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

/** Базовый узел */
export interface BaseNode {
  id: string;
  nid?: string;
  names: LocaleString;
  descriptions?: LocaleString;
  aliases?: string[];
  /** Для разных kind переопределяется более точным типом */
  attrs?: unknown;
  statements?: Statement[];
}

/** attrs для персон — нужны таймлайну */
export interface PersonAttrs {
  birth?: { year?: number; month?: number; day?: number };
  death?: { year?: number; month?: number; day?: number };
}

export interface Person extends BaseNode {
  kind: "Person";
  attrs?: PersonAttrs;
}

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

/** attrs для событий — соответствуют тому, что пишет scripts/build-connections.js */
export interface EventAttrs {
  date?: { iso?: string };
  range?: { start?: string; end?: string };
}

export interface Event extends BaseNode {
  kind: "Event";
  attrs?: EventAttrs;
  place?: string;
  emoji?: string;
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
    | "participated"; // используется в build-скрипте
  source: string;
  target: string;
  start?: DateApprox;
  end?: DateApprox;
  color?: string;
}

export interface Dataset {
  nodes: Node[];
  edges: Edge[];
  generated
- Закоммить эту замену в main, дождаться GitHub Actions.  
- Если страница была открыта — обнови кэш SW (DevTools → Application → Service Workers → Unregister → Reload), чтобы подтянулся свежий connections.json.

Замеченные несоответствия на будущее
- В Event мы используем attrs.date/attrs.range (как в scripts/build-connections.js). Если решишь хранить дату события на верхнем уровне (Event.date: DateApprox), скажи — синхронизирую build‑скрипт и тайпинги.
