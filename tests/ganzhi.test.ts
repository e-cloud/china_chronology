import { describe, it, expect } from "vitest";
import {
  DEFAULT_GANZHI_LIST,
  gregorianToGanzhi,
  ganzhiToGregorian
} from "../src/utils/ganzhi";

describe("ganzhi utils", () => {
  it("DEFAULT_GANZHI_LIST 长度应为 60 且以甲子开头、癸亥结尾", () => {
    expect(DEFAULT_GANZHI_LIST).toHaveLength(60);
    expect(DEFAULT_GANZHI_LIST[0]).toBe("甲子");
    expect(DEFAULT_GANZHI_LIST[59]).toBe("癸亥");
  });

  describe("gregorianToGanzhi", () => {
    it("历史上无公元 0 年应抛出异常", () => {
      expect(() => gregorianToGanzhi(0)).toThrow("历史上无公元 0 年");
    });

    it("常见公历年份干支计算", () => {
      // 1644年 明亡清兴 甲申之变
      expect(gregorianToGanzhi(1644)).toBe("甲申");
      // 1984年 甲子年
      expect(gregorianToGanzhi(1984)).toBe("甲子");
      // 2024年 甲辰年
      expect(gregorianToGanzhi(2024)).toBe("甲辰");
    });

    it("公元前年份干支计算（无0年修正）", () => {
      // 公元前 140 年（西汉汉武帝建元年）对应辛丑
      expect(gregorianToGanzhi(-140)).toBe("辛丑");
      // 公元前 139 年（建元二年）对应壬寅
      expect(gregorianToGanzhi(-139)).toBe("壬寅");
    });
  });

  describe("ganzhiToGregorian", () => {
    it("无效干支名称应抛出异常", () => {
      expect(() => ganzhiToGregorian("无效干支", 1600, 1650)).toThrow("无效的干支名称");
    });

    it("在给定年份范围内检索干支年份", () => {
      // 1600-1650 年间的甲申年
      expect(ganzhiToGregorian("甲申", 1600, 1650)).toEqual([1644]);
      // 1900-2000 年间的甲子年
      expect(ganzhiToGregorian("甲子", 1900, 2000)).toEqual([1924, 1984]);
    });
  });
});
