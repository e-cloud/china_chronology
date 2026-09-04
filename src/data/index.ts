import rawData from "./chronology_data.json";
import type { ChronologyDataset } from "../types";

export const defaultDataset: ChronologyDataset = rawData as ChronologyDataset;
export default defaultDataset;
