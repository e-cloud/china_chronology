import { describe, it, expect, beforeAll } from "vitest";
import { ChronologyService } from "../src/chronology";
import { defaultDataset } from "../src/data";

describe("ChronologyService 核心互转与消歧", () => {
  let service: ChronologyService;

  beforeAll(() => {
    service = new ChronologyService(defaultDataset);
  });

  describe("字符串与年号转公历 (eraToGregorian)", () => {
    it("支持常见明清年号与中文/阿拉伯数字转换", () => {
      // 崇祯17年
      const resChongzhen1 = service.eraToGregorian("崇祯17年");
      expect(resChongzhen1).toEqual([
        { gregorianYear: 1644, dynastyName: "明", eraName: "崇祯", eraYear: 17, ganzhi: "甲申" }
      ]);

      // 明崇祯十七年
      const resChongzhen2 = service.eraToGregorian("明崇祯十七年");
      expect(resChongzhen2).toEqual([
        { gregorianYear: 1644, dynastyName: "明", eraName: "崇祯", eraYear: 17, ganzhi: "甲申" }
      ]);

      // 康熙元年
      const resKangxi = service.eraToGregorian("康熙元年");
      expect(resKangxi).toEqual([
        { gregorianYear: 1662, dynastyName: "清", eraName: "康熙", eraYear: 1, ganzhi: "壬寅" }
      ]);
    });

    it("重名年号消歧：未指定朝代与指定朝代", () => {
      // 未指定朝代：建元2年
      const allJianyuan = service.eraToGregorian("建元2年");
      expect(allJianyuan.length).toBeGreaterThanOrEqual(4);
      
      const hanMatch = allJianyuan.find((m) => m.dynastyName === "汉");
      expect(hanMatch).toEqual({
        gregorianYear: -139,
        dynastyName: "汉",
        eraName: "建元",
        eraYear: 2,
        ganzhi: "壬寅"
      });

      const jinMatch = allJianyuan.find((m) => m.dynastyName === "东晋");
      expect(jinMatch).toEqual({
        gregorianYear: 344,
        dynastyName: "东晋",
        eraName: "建元",
        eraYear: 2,
        ganzhi: "甲辰"
      });

      // 指定朝代：自然语言 "汉建元二年"
      const resHanText = service.eraToGregorian("汉建元二年");
      expect(resHanText).toEqual([
        { gregorianYear: -139, dynastyName: "汉", eraName: "建元", eraYear: 2, ganzhi: "壬寅" }
      ]);

      // 指定朝代：多参数重载 ("建元", 2, "汉")
      const resHanArgs = service.eraToGregorian("建元", 2, "汉");
      expect(resHanArgs).toEqual([
        { gregorianYear: -139, dynastyName: "汉", eraName: "建元", eraYear: 2, ganzhi: "壬寅" }
      ]);

      // 也支持传入西汉作为朝代
      const resXiHan = service.eraToGregorian("建元", 2, "西汉");
      expect(resXiHan).toEqual([
        { gregorianYear: -139, dynastyName: "汉", eraName: "建元", eraYear: 2, ganzhi: "壬寅" }
      ]);
    });

    it("超出年号在位年份应返回空数组", () => {
      // 崇祯仅在位17年，第20年不存在
      const res = service.eraToGregorian("崇祯20年");
      expect(res).toEqual([]);
    });
  });

  describe("公历查朝代年号 (gregorianToEra)", () => {
    it("1644 年应同时查询到明崇祯17年与清顺治元年", () => {
      const res1644 = service.gregorianToEra(1644);
      expect(res1644).toContainEqual({
        dynastyName: "明",
        eraName: "崇祯",
        eraYear: 17,
        eraYearDisplay: "崇祯17年",
        gregorianYear: 1644,
        ganzhi: "甲申"
      });

      expect(res1644).toContainEqual({
        dynastyName: "清",
        eraName: "顺治",
        eraYear: 1,
        eraYearDisplay: "顺治元年",
        gregorianYear: 1644,
        ganzhi: "甲申"
      });
    });

    it("查询公元前年份年号（如公元前139年）", () => {
      const resBC139 = service.gregorianToEra(-139);
      expect(resBC139).toContainEqual({
        dynastyName: "汉",
        eraName: "建元",
        eraYear: 2,
        eraYearDisplay: "建元2年",
        gregorianYear: -139,
        ganzhi: "壬寅"
      });
    });

    it("查询公元 0 年应抛出异常", () => {
      expect(() => service.gregorianToEra(0)).toThrow("历史上无公元 0 年");
    });
  });

  describe("干支跨度检索 (ganzhiToGregorian)", () => {
    it("1600-1650 年间的甲申年检索", () => {
      const res = service.ganzhiToGregorian("甲申", 1600, 1650);
      expect(res).toEqual([1644]);
    });
  });
});
