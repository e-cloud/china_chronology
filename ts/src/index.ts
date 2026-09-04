import { ChronologyService } from "./chronology";
import { defaultDataset } from "./data";

export * from "./types";
export * from "./chronology";
export * from "./utils/chinese_number";
export * from "./utils/ganzhi";
export { defaultDataset } from "./data";

/**
 * 开箱即用的默认单例实例（已预置哈佛/中研院/北大 CBDB 清洗后的标准历代纪年数据集）
 */
export const chronology: ChronologyService = new ChronologyService(defaultDataset);

export default chronology;
