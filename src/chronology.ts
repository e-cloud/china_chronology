import type {
  Dynasty,
  Era,
  ChronologyDataset,
  ParsedEraQuery,
  EraMatchResult,
  GregorianMatchResult
} from "./types";
import { parseEraYearNumber } from "./utils/chinese_number";
import { DEFAULT_GANZHI_LIST, gregorianToGanzhi, ganzhiToGregorian } from "./utils/ganzhi";

export class ChronologyService {
  private dynasties: Dynasty[];
  private eras: Era[];
  private ganzhiList: string[];
  private eraNamesSet: Set<string>;
  private sortedDynasties: { name: string }[];

  constructor(data: ChronologyDataset) {
    this.dynasties = data.dynasties;
    this.eras = data.eras;

    // 建立年号快速索引集合
    this.eraNamesSet = new Set(this.eras.map((e) => e.name));

    // 收集所有朝代名以及原始朝代名，按长度降序排列，避免前缀歧义（如“西汉”先于“汉”）
    const allDynastyNames = new Set<string>();
    for (const d of this.dynasties) {
      allDynastyNames.add(d.name);
    }
    for (const e of this.eras) {
      allDynastyNames.add(e.dynastyName);
      if (e.rawDynastyName) allDynastyNames.add(e.rawDynastyName);
    }
    // 补齐常见单字朝代名
    allDynastyNames.add("汉");
    allDynastyNames.add("晋");
    allDynastyNames.add("齐");
    allDynastyNames.add("秦");
    allDynastyNames.add("赵");
    allDynastyNames.add("凉");

    this.sortedDynasties = Array.from(allDynastyNames)
      .filter(Boolean)
      .map((name) => ({ name }))
      .sort((a, b) => b.name.length - a.name.length);

    // 标准化 60 干支列表
    if (data.ganzhi && data.ganzhi.length === 60) {
      this.ganzhiList = data.ganzhi.map((g) => g.name);
    } else {
      this.ganzhiList = [...DEFAULT_GANZHI_LIST];
    }
  }

  // --- 1. 基础数据列表查询 ---

  getDynasties(): Dynasty[] {
    return this.dynasties;
  }

  getEras(dynastyName?: string): Era[] {
    if (!dynastyName) return this.eras;
    return this.eras.filter(
      (e) => e.dynastyName === dynastyName || e.rawDynastyName === dynastyName
    );
  }

  getGanzhiList(): string[] {
    return this.ganzhiList;
  }

  // --- 2. 文本解析辅助函数 ---

  /**
   * 解析自然语言纪年字符串
   * 示例：
   * - "崇祯17年" -> { eraName: "崇祯", eraYear: 17 }
   * - "明崇祯十七年" -> { dynastyName: "明", eraName: "崇祯", eraYear: 17 }
   * - "顺治元年" -> { eraName: "顺治", eraYear: 1 }
   * - "汉建元二年" -> { dynastyName: "汉", eraName: "建元", eraYear: 2 }
   * - "西汉建元二年" -> { dynastyName: "西汉", eraName: "建元", eraYear: 2 }
   */
  parseEraString(input: string): ParsedEraQuery {
    const trimmed = input.trim();
    const match = trimmed.match(/^(.*?)(\d+|[一二两三四五六七八九十]+|元)年?$/);
    if (!match) {
      throw new Error(`无法匹配年号格式: "${input}"`);
    }

    const prefix = match[1].trim();
    const yearStr = match[2];
    const eraYear = parseEraYearNumber(yearStr);

    if (!prefix) {
      throw new Error(`输入缺少有效的年号名称: "${input}"`);
    }

    // 情况 A: 前缀即为年号（如 "崇祯"）
    if (this.eraNamesSet.has(prefix)) {
      return { eraName: prefix, eraYear };
    }

    // 情况 B: 前缀包含朝代（如 "明崇祯"、"西汉建元"、"汉建元"）
    for (const d of this.sortedDynasties) {
      if (prefix.startsWith(d.name)) {
        const remaining = prefix.slice(d.name.length);
        if (this.eraNamesSet.has(remaining)) {
          return {
            dynastyName: d.name,
            eraName: remaining,
            eraYear
          };
        }
      }
    }

    // 兜底返回前缀
    return { eraName: prefix, eraYear };
  }

  // --- 3. 公历与干支互转 ---

  /**
   * 公历年转干支
   * @param year 公历年份（负数表示公元前，如 -221 表示公元前221年，无公元0年）
   */
  gregorianToGanzhi(year: number): string {
    return gregorianToGanzhi(year, this.ganzhiList);
  }

  /**
   * 干支纪年转公历年份（60年一循环，须指定范围）
   */
  ganzhiToGregorian(ganzhi: string, startYear: number, endYear: number): number[] {
    return ganzhiToGregorian(ganzhi, startYear, endYear, this.ganzhiList);
  }

  // --- 4. 公历与朝代年号互转 ---

  /**
   * 公历年查询朝代年号（同一年可能存在多个政权或改元并立）
   */
  gregorianToEra(year: number): EraMatchResult[] {
    if (year === 0) {
      throw new Error("历史上无公元 0 年");
    }

    const ganzhi = this.gregorianToGanzhi(year);
    const matches: EraMatchResult[] = [];

    for (const era of this.eras) {
      if (year >= era.startYear && year <= era.endYear) {
        let eraYearNum: number;
        // 跨公元前后无 0 年修正
        if (era.startYear < 0 && year > 0) {
          eraYearNum = year - era.startYear;
        } else {
          eraYearNum = year - era.startYear + 1;
        }

        const displayStr = eraYearNum === 1 ? "元" : eraYearNum.toString();

        matches.push({
          dynastyName: era.dynastyName,
          eraName: era.name,
          eraYear: eraYearNum,
          eraYearDisplay: `${era.name}${displayStr}年`,
          gregorianYear: year,
          ganzhi
        });
      }
    }

    return matches;
  }

  /**
   * 年号转公历年（重载函数，支持传字符串或结构化参数）
   */
  eraToGregorian(input: string): GregorianMatchResult[];
  eraToGregorian(
    eraName: string,
    eraYear: number | string,
    dynastyName?: string
  ): GregorianMatchResult[];
  eraToGregorian(arg1: string, arg2?: number | string, arg3?: string): GregorianMatchResult[] {
    let targetEraName: string;
    let targetEraYear: number;
    let targetDynasty: string | undefined;

    if (arg2 === undefined) {
      // 单参数文本输入："崇祯17年" 或 "明崇祯十七年"
      const parsed = this.parseEraString(arg1);
      targetEraName = parsed.eraName;
      targetEraYear = parsed.eraYear;
      targetDynasty = parsed.dynastyName;
    } else {
      targetEraName = arg1;
      targetEraYear = typeof arg2 === "string" ? parseEraYearNumber(arg2) : arg2;
      targetDynasty = arg3;
    }

    if (isNaN(targetEraYear) || targetEraYear <= 0) {
      throw new Error(`非法的年号年份: ${targetEraYear}`);
    }

    let candidates = this.eras.filter((e) => e.name === targetEraName);
    if (targetDynasty) {
      const td = targetDynasty;
      candidates = candidates.filter((e) => e.dynastyName === td || e.rawDynastyName === td);
    }

    const results: GregorianMatchResult[] = [];

    for (const era of candidates) {
      let calcYear = era.startYear + targetEraYear - 1;

      // 跨越公元无 0 年修正
      if (era.startYear < 0 && calcYear >= 0) {
        calcYear += 1;
      }

      if (calcYear <= era.endYear) {
        results.push({
          gregorianYear: calcYear,
          dynastyName: era.dynastyName,
          eraName: era.name,
          eraYear: targetEraYear,
          ganzhi: this.gregorianToGanzhi(calcYear)
        });
      }
    }

    return results;
  }
}
