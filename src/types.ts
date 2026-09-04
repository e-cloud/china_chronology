export interface Dynasty {
  id: number;
  name: string;
}

export interface Era {
  id: number;
  dynastyId: number;
  dynastyName: string;
  rawDynastyName?: string;
  name: string;
  startYear: number;
  endYear: number;
}

export interface GanzhiItem {
  id: number;
  name: string;
}

export interface ChronologyDataset {
  dynasties: Dynasty[];
  eras: Era[];
  ganzhi: GanzhiItem[];
}

export interface ParsedEraQuery {
  dynastyName?: string;
  eraName: string;
  eraYear: number;
}

export interface EraMatchResult {
  dynastyName: string;
  eraName: string;
  eraYear: number;
  eraYearDisplay: string;
  gregorianYear: number;
  ganzhi: string;
}

export interface GregorianMatchResult {
  gregorianYear: number;
  dynastyName: string;
  eraName: string;
  eraYear: number;
  ganzhi: string;
}
