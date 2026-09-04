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

export const DYNASTY_ALIASES: Record<string, string[]> = {
  汉: ["西汉", "东汉", "汉"],
  西汉: ["汉", "西汉"],
  东汉: ["汉", "东汉"],
  晋: ["西晋", "东晋", "晋"],
  西晋: ["晋", "西晋"],
  东晋: ["晋", "东晋"],
  齐: ["南齐", "北齐", "齐"],
  南齐: ["齐", "南齐"],
  北齐: ["齐", "北齐"],
  秦: ["前秦", "后秦", "西秦", "秦"],
  前秦: ["秦", "前秦"],
  后秦: ["秦", "后秦"],
  西秦: ["秦", "西秦"],
  赵: ["前赵", "后赵", "赵"],
  前赵: ["赵", "前赵"],
  后赵: ["赵", "后赵"],
  凉: ["前凉", "后凉", "西凉", "北凉", "南凉", "凉"],
  前凉: ["凉", "前凉"],
  后凉: ["凉", "后凉"],
  西凉: ["凉", "西凉"],
  北凉: ["凉", "北凉"],
  南凉: ["凉", "南凉"],
  燕: ["前燕", "后燕", "南燕", "北燕", "燕"],
  前燕: ["燕", "前燕"],
  后燕: ["燕", "后燕"],
  南燕: ["燕", "南燕"],
  北燕: ["燕", "北燕"],
  魏: ["三国魏", "曹魏", "魏"],
  曹魏: ["三国魏", "曹魏", "魏"],
  三国魏: ["三国魏", "曹魏", "魏"],
  蜀: ["三国蜀", "蜀汉", "蜀"],
  蜀汉: ["三国蜀", "蜀汉", "蜀"],
  三国蜀: ["三国蜀", "蜀汉", "蜀"],
  吴: ["三国吴", "孙吴", "东吴", "吴"],
  孙吴: ["三国吴", "孙吴", "东吴", "吴"],
  东吴: ["三国吴", "孙吴", "东吴", "吴"],
  三国吴: ["三国吴", "孙吴", "东吴", "吴"],
  武周: ["周", "武周"],
  周: ["周", "武周", "北周", "后周"]
};

function matchDynasty(target: string, eraDynasty: string, eraRawDynasty?: string): boolean {
  if (target === eraDynasty || (eraRawDynasty && target === eraRawDynasty)) {
    return true;
  }
  const aliases = DYNASTY_ALIASES[target];
  if (aliases) {
    if (aliases.includes(eraDynasty)) return true;
    if (eraRawDynasty && aliases.includes(eraRawDynasty)) return true;
  }
  return false;
}

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

    // 收集所有朝代名、原始朝代名及别名，按长度降序排列
    const allDynastyNames = new Set<string>();
    for (const d of this.dynasties) {
      allDynastyNames.add(d.name);
    }
    for (const e of this.eras) {
      allDynastyNames.add(e.dynastyName);
      if (e.rawDynastyName) allDynastyNames.add(e.rawDynastyName);
    }
    for (const [k, list] of Object.entries(DYNASTY_ALIASES)) {
      allDynastyNames.add(k);
      for (const alias of list) allDynastyNames.add(alias);
    }

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
    return this.eras.filter((e) => matchDynasty(dynastyName, e.dynastyName, e.rawDynastyName));
  }

  getGanzhiList(): string[] {
    return this.ganzhiList;
  }

  // --- 2. 文本解析辅助函数 ---

  /**
   * 解析自然语言纪年字符串
   */
  parseEraString(input: string): ParsedEraQuery {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error(`无法匹配年号格式: "${input}"`);
    }

    // 若用户直接输入了纯年号或朝代+年号且无年份数字，抛出明确异常，防止将年号末尾“元”误吞为元年
    if (this.eraNamesSet.has(trimmed)) {
      throw new Error(`输入缺少有效的年份数字: "${input}"`);
    }
    for (const d of this.sortedDynasties) {
      if (trimmed.startsWith(d.name)) {
        const remaining = trimmed.slice(d.name.length).trim();
        if (this.eraNamesSet.has(remaining)) {
          throw new Error(`输入缺少有效的年份数字: "${input}"`);
        }
      }
    }

    // 格式切分：末尾带“年”或纯阿拉伯数字
    let match: RegExpMatchArray | null = null;
    if (trimmed.endsWith("年")) {
      match = trimmed.match(/^(.*?)(\d+|[一二两三四五六七八九十廿卅]+|元)年$/);
    } else {
      match = trimmed.match(/^(.*?)(\d+)$/);
    }

    if (!match) {
      throw new Error(`无法匹配年号格式: "${input}"`);
    }

    const prefix = match[1].trim();
    const yearStr = match[2];
    const eraYear = parseEraYearNumber(yearStr);

    if (!prefix) {
      throw new Error(`输入缺少有效的年号名称: "${input}"`);
    }

    // 情况 A: 前缀即为年号（如 "崇祯", "开元"）
    if (this.eraNamesSet.has(prefix)) {
      return { eraName: prefix, eraYear };
    }

    // 情况 B: 前缀包含朝代（如 "明崇祯"、"曹魏黄初"、"晋泰始"、"武周天授"）
    for (const d of this.sortedDynasties) {
      if (prefix.startsWith(d.name)) {
        const remaining = prefix.slice(d.name.length).trim();
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
      candidates = candidates.filter((e) => matchDynasty(td, e.dynastyName, e.rawDynastyName));
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
