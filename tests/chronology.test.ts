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

  describe("基础查询接口与构造选项覆盖", () => {
    it("getDynasties 应返回朝代列表", () => {
      const dynasties = service.getDynasties();
      expect(dynasties.length).toBeGreaterThan(0);
    });

    it("getEras 应支持全部与按朝代过滤", () => {
      const allEras = service.getEras();
      expect(allEras.length).toBeGreaterThan(0);

      const mingEras = service.getEras("明");
      expect(mingEras.every((e) => e.dynastyName === "明")).toBe(true);

      const hanEras = service.getEras("汉");
      expect(hanEras.length).toBeGreaterThan(0);

      const rawXiHanEras = service.getEras("西汉");
      expect(rawXiHanEras.length).toBeGreaterThan(0);
    });

    it("getGanzhiList 应返回 60 干支", () => {
      const list = service.getGanzhiList();
      expect(list).toHaveLength(60);
    });

    it("构造函数在未传入有效 ganzhi 时应自动回退到默认 60 干支", () => {
      const fallbackService = new ChronologyService({
        dynasties: [{ id: 1, name: "明" }],
        eras: [
          { id: 1, dynastyId: 1, dynastyName: "明", name: "洪武", startYear: 1368, endYear: 1398 }
        ],
        ganzhi: []
      });
      expect(fallbackService.getGanzhiList()).toHaveLength(60);
    });
  });

  describe("异常分支与特殊边界覆盖", () => {
    it("parseEraString 兜底匹配未知年号与朝代匹配但年号未知情况", () => {
      const parsed1 = service.parseEraString("未知年号3年");
      expect(parsed1).toEqual({
        eraName: "未知年号",
        eraYear: 3
      });

      // 朝代匹配成功，但后续不是已知年号
      const parsed2 = service.parseEraString("明未命名年号5年");
      expect(parsed2).toEqual({
        eraName: "明未命名年号",
        eraYear: 5
      });
    });

    it("eraToGregorian 支持字符串年份与参数校验", () => {
      // 传中文数字字符串作为年份
      const resStr = service.eraToGregorian("建元", "二", "汉");
      expect(resStr).toEqual([
        { gregorianYear: -139, dynastyName: "汉", eraName: "建元", eraYear: 2, ganzhi: "壬寅" }
      ]);

      expect(() => service.eraToGregorian("崇祯", 0)).toThrow("非法的年号年份");
      expect(() => service.eraToGregorian("崇祯", -1)).toThrow("非法的年号年份");
      expect(() => service.eraToGregorian("崇祯", NaN)).toThrow("非法的年号年份");
    });

    it("跨越公元前后无 0 年的年号双向互转修正", () => {
      // 创建跨越公元前后的虚拟年号：-2 到 3（对应公元前2, 前1, 公元1, 2, 3年，共5年）
      const crossService = new ChronologyService({
        dynasties: [{ id: 1, name: "虚拟朝代" }],
        eras: [
          {
            id: 1,
            dynastyId: 1,
            dynastyName: "虚拟朝代",
            name: "跨元",
            startYear: -2,
            endYear: 3
          }
        ],
        ganzhi: defaultDataset.ganzhi
      });

      // 公历公元 2 年：跨越公元前无0年，元年(-2), 二年(-1), 三年(1), 四年(2)
      const eraRes = crossService.gregorianToEra(2);
      expect(eraRes).toEqual([
        {
          dynastyName: "虚拟朝代",
          eraName: "跨元",
          eraYear: 4,
          eraYearDisplay: "跨元4年",
          gregorianYear: 2,
          ganzhi: "壬戌"
        }
      ]);

      // 年号转公历：跨元4年 -> 公元 2 年
      const gregRes = crossService.eraToGregorian("跨元4年");
      expect(gregRes).toEqual([
        {
          dynastyName: "虚拟朝代",
          eraName: "跨元",
          eraYear: 4,
          ganzhi: "壬戌",
          gregorianYear: 2
        }
      ]);
    });
  });
});
