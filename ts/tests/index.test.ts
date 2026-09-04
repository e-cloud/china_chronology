import { describe, it, expect } from "vitest";
import chronology, {
  ChronologyService,
  defaultDataset,
  parseEraYearNumber,
  gregorianToGanzhi,
  ganzhiToGregorian
} from "../src/index";

describe("china-chronology 模块统一导出与开箱即用实例验证", () => {
  it("应成功导出所有核心符号", () => {
    expect(chronology).toBeInstanceOf(ChronologyService);
    expect(defaultDataset).toBeDefined();
    expect(typeof parseEraYearNumber).toBe("function");
    expect(typeof gregorianToGanzhi).toBe("function");
    expect(typeof ganzhiToGregorian).toBe("function");
  });

  it("范例 1：字符串解析与转换（支持阿拉伯数字与中文数字）", () => {
    expect(chronology.eraToGregorian("崇祯17年")).toEqual([
      { gregorianYear: 1644, dynastyName: "明", eraName: "崇祯", eraYear: 17, ganzhi: "甲申" }
    ]);

    expect(chronology.eraToGregorian("明崇祯十七年")).toEqual([
      { gregorianYear: 1644, dynastyName: "明", eraName: "崇祯", eraYear: 17, ganzhi: "甲申" }
    ]);

    expect(chronology.eraToGregorian("康熙元年")).toEqual([
      { gregorianYear: 1662, dynastyName: "清", eraName: "康熙", eraYear: 1, ganzhi: "壬寅" }
    ]);
  });

  it("范例 2：重名年号消歧验证（建元）", () => {
    const unspecific = chronology.eraToGregorian("建元2年");
    // 未指定朝代时包含 汉、东晋、前秦、南齐
    expect(unspecific).toContainEqual({
      gregorianYear: -139,
      dynastyName: "汉",
      eraName: "建元",
      eraYear: 2,
      ganzhi: "壬寅"
    });
    expect(unspecific).toContainEqual({
      gregorianYear: 344,
      dynastyName: "东晋",
      eraName: "建元",
      eraYear: 2,
      ganzhi: "甲辰"
    });
    expect(unspecific).toContainEqual({
      gregorianYear: 366,
      dynastyName: "前秦",
      eraName: "建元",
      eraYear: 2,
      ganzhi: "丙寅"
    });
    expect(unspecific).toContainEqual({
      gregorianYear: 480,
      dynastyName: "南齐",
      eraName: "建元",
      eraYear: 2,
      ganzhi: "庚申"
    });

    // 指定朝代（汉建元二年）
    const specificHan = chronology.eraToGregorian("汉建元二年");
    expect(specificHan).toEqual([
      { gregorianYear: -139, dynastyName: "汉", eraName: "建元", eraYear: 2, ganzhi: "壬寅" }
    ]);
  });

  it("范例 3：公历查朝代年号与干支（1644年查询）", () => {
    const result1644 = chronology.gregorianToEra(1644);
    expect(result1644).toContainEqual({
      dynastyName: "明",
      eraName: "崇祯",
      eraYear: 17,
      eraYearDisplay: "崇祯17年",
      gregorianYear: 1644,
      ganzhi: "甲申"
    });
    expect(result1644).toContainEqual({
      dynastyName: "清",
      eraName: "顺治",
      eraYear: 1,
      eraYearDisplay: "顺治元年",
      gregorianYear: 1644,
      ganzhi: "甲申"
    });
  });

  it("范例 4：干支跨度检索（1600-1650年间的甲申年）", () => {
    expect(chronology.ganzhiToGregorian("甲申", 1600, 1650)).toEqual([1644]);
  });
});
