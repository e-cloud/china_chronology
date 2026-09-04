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
    it("getDynasties 应返回合法的数值 ID 与有效朝代名称列表（非垃圾数据）", () => {
      const dynasties = service.getDynasties();
      expect(dynasties.length).toBeGreaterThan(50);
      expect(typeof dynasties[0].id).toBe("number");
      expect(typeof dynasties[0].name).toBe("string");
      expect(dynasties[0].name).not.toBe("name");
      expect(dynasties[0].name).not.toBe("id");
      expect(dynasties.some((d) => d.name === "唐")).toBe(true);
      expect(dynasties.some((d) => d.name === "明")).toBe(true);
      expect(dynasties.some((d) => d.name === "汉")).toBe(true);
    });

    it("getEras 应支持全部与按朝代及朝代别名过滤", () => {
      const allEras = service.getEras();
      expect(allEras.length).toBeGreaterThan(0);

      const mingEras = service.getEras("明");
      expect(mingEras.every((e) => e.dynastyName === "明")).toBe(true);

      const hanEras = service.getEras("汉");
      expect(hanEras.length).toBeGreaterThan(0);

      const rawXiHanEras = service.getEras("西汉");
      expect(rawXiHanEras.length).toBeGreaterThan(0);

      // 三国与武周别名过滤
      expect(service.getEras("曹魏").length).toBeGreaterThan(0);
      expect(service.getEras("蜀汉").length).toBeGreaterThan(0);
      expect(service.getEras("孙吴").length).toBeGreaterThan(0);
      expect(service.getEras("武周").length).toBeGreaterThan(0);
      expect(service.getEras("不存在朝代")).toEqual([]);

      // 验证 rawDynastyName 命中别名分支
      const customAliasService = new ChronologyService({
        dynasties: [{ id: 1, name: "地方割据" }],
        eras: [
          {
            id: 1,
            dynastyId: 1,
            dynastyName: "地方割据",
            rawDynastyName: "西汉",
            name: "自建年号",
            startYear: 10,
            endYear: 15
          }
        ],
        ganzhi: defaultDataset.ganzhi
      });
      expect(customAliasService.getEras("汉")).toHaveLength(1);
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

  describe("真实历史学复杂政权消歧与繁简汉字全域验证", () => {
    it("三国政权别名消歧（曹魏/魏、孙吴/东吴/吴、蜀汉/蜀）", () => {
      const resWei1 = service.eraToGregorian("曹魏黄初元年");
      expect(resWei1).toEqual([
        { gregorianYear: 220, dynastyName: "三国魏", eraName: "黄初", eraYear: 1, ganzhi: "庚子" }
      ]);

      const resWei2 = service.eraToGregorian("魏黄初元年");
      expect(resWei2).toEqual([
        { gregorianYear: 220, dynastyName: "三国魏", eraName: "黄初", eraYear: 1, ganzhi: "庚子" }
      ]);

      const resWu1 = service.eraToGregorian("孙吴黄武元年");
      expect(resWu1).toEqual([
        { gregorianYear: 222, dynastyName: "三国吴", eraName: "黄武", eraYear: 1, ganzhi: "壬寅" }
      ]);

      const resWu2 = service.eraToGregorian("东吴黄龙元年");
      expect(resWu2).toEqual([
        { gregorianYear: 229, dynastyName: "三国吴", eraName: "黄龙", eraYear: 1, ganzhi: "己酉" }
      ]);
    });

    it("晋代单字与分期朝代消歧（彻底解决单字假闭环反噬）", () => {
      // 输入全称单字朝代 "晋泰始元年"
      const resJin1 = service.eraToGregorian("晋泰始元年");
      expect(resJin1).toEqual([
        { gregorianYear: 265, dynastyName: "西晋", eraName: "泰始", eraYear: 1, ganzhi: "乙酉" }
      ]);

      // 输入具体朝代 "西晋泰始元年"
      const resJin2 = service.eraToGregorian("西晋泰始元年");
      expect(resJin2).toEqual([
        { gregorianYear: 265, dynastyName: "西晋", eraName: "泰始", eraYear: 1, ganzhi: "乙酉" }
      ]);
    });

    it("武周政权与周朝别名消歧", () => {
      const resZhou1 = service.eraToGregorian("武周天授元年");
      expect(resZhou1).toEqual([
        { gregorianYear: 690, dynastyName: "周", eraName: "天授", eraYear: 1, ganzhi: "庚寅" }
      ]);

      const resZhou2 = service.eraToGregorian("周天授元年");
      expect(resZhou2).toEqual([
        { gregorianYear: 690, dynastyName: "周", eraName: "天授", eraYear: 1, ganzhi: "庚寅" }
      ]);
    });

    it("两宋别名消歧（宋/南宋/北宋）", () => {
      // 南宋绍兴元年 (1131年，辛亥)
      const resNanSong = service.eraToGregorian("南宋绍兴元年");
      expect(resNanSong).toEqual([
        { gregorianYear: 1131, dynastyName: "宋", eraName: "绍兴", eraYear: 1, ganzhi: "辛亥" }
      ]);

      // 北宋熙宁十年 (1077年，丁巳)
      const resBeiSong = service.eraToGregorian("北宋熙宁十年");
      expect(resBeiSong).toEqual([
        { gregorianYear: 1077, dynastyName: "宋", eraName: "熙宁", eraYear: 10, ganzhi: "丁巳" }
      ]);

      // 通称宋绍兴元年
      const resSong = service.eraToGregorian("宋绍兴元年");
      expect(resSong).toEqual([
        { gregorianYear: 1131, dynastyName: "宋", eraName: "绍兴", eraYear: 1, ganzhi: "辛亥" }
      ]);
    });

    it("魏朝与北魏消歧及刘宋朝代支持", () => {
      // 北魏太和二十年 (496年，丙子)
      const resBeiWei = service.eraToGregorian("北魏太和二十年");
      expect(resBeiWei).toEqual([
        { gregorianYear: 496, dynastyName: "北魏", eraName: "太和", eraYear: 20, ganzhi: "丙子" }
      ]);

      // 通称魏太和二十年（太和在位477-499，20年仅北魏存在）
      const resWei = service.eraToGregorian("魏太和二十年");
      expect(resWei).toContainEqual(
        { gregorianYear: 496, dynastyName: "北魏", eraName: "太和", eraYear: 20, ganzhi: "丙子" }
      );

      // 刘宋元嘉元年 (424年，甲子)
      const resLiuSong = service.eraToGregorian("刘宋元嘉元年");
      expect(resLiuSong).toEqual([
        { gregorianYear: 424, dynastyName: "刘宋", eraName: "元嘉", eraYear: 1, ganzhi: "甲子" }
      ]);
    });

    it("繁体字清洗后的年号（地节、鸿嘉、居摄）正常检索", () => {
      // 汉宣帝 地节元年 (-69年)
      expect(service.eraToGregorian("汉地节元年")).toEqual([
        { gregorianYear: -69, dynastyName: "汉", eraName: "地节", eraYear: 1, ganzhi: "壬子" }
      ]);

      // 汉成帝 鸿嘉元年 (-20年)
      expect(service.eraToGregorian("汉鸿嘉元年")).toEqual([
        { gregorianYear: -20, dynastyName: "汉", eraName: "鸿嘉", eraYear: 1, ganzhi: "辛丑" }
      ]);

      // 孺子婴 居摄元年 (公元6年)
      expect(service.eraToGregorian("汉居摄元年")).toEqual([
        { gregorianYear: 6, dynastyName: "汉", eraName: "居摄", eraYear: 1, ganzhi: "丙寅" }
      ]);
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

    it("朝代消歧穿透防护：西汉/东汉、北宋/南宋严格互斥", () => {
      // 1. 东汉历史上无“建元”年号，查东汉建元应为空
      expect(service.eraToGregorian("建元", 1, "东汉")).toEqual([]);
      expect(service.eraToGregorian("东汉建元元年")).toEqual([]);

      // 2. 西汉历史上无“建武”年号，查西汉建武应为空
      expect(service.eraToGregorian("建武", 1, "西汉")).toEqual([]);
      expect(service.eraToGregorian("西汉建武元年")).toEqual([]);

      // 3. getEras("西汉") 绝不应包含东汉年号（如“建武”）
      const xiHanEras = service.getEras("西汉");
      expect(xiHanEras.some((e) => e.name === "建武")).toBe(false);
      expect(xiHanEras.some((e) => e.name === "建元")).toBe(true);

      // 4. 北宋开国建隆（960年），查南宋建隆应为空
      expect(service.eraToGregorian("建隆", 1, "南宋")).toEqual([]);
      expect(service.eraToGregorian("南宋建隆元年")).toEqual([]);

      // 5. 查北宋建隆或宋建隆应正常匹配
      expect(service.eraToGregorian("建隆", 1, "北宋")).toHaveLength(1);
      expect(service.eraToGregorian("建隆", 1, "宋")).toHaveLength(1);
    });

    it("近现代纪年分期截断与'民国'简称开箱即用", () => {
      // 1. 2024 年不应再反查出中华民国或民国年号
      const res2024 = service.gregorianToEra(2024);
      expect(res2024.some((e) => e.dynastyName === "中华民国" || e.eraName === "民国")).toBe(false);

      // 2. 1945 年（抗战胜利）应正常包含民国34年
      const res1945 = service.gregorianToEra(1945);
      expect(res1945.some((e) => e.eraYear === 34 && (e.eraName === "中华民国" || e.eraName === "民国"))).toBe(true);

      // 3. 支持“民国”简称自然语言查询
      const resMinguoYuan = service.eraToGregorian("民国元年");
      expect(resMinguoYuan.some((e) => e.gregorianYear === 1912)).toBe(true);

      const resMinguo34 = service.eraToGregorian("民国34年");
      expect(resMinguo34.some((e) => e.gregorianYear === 1945)).toBe(true);

      const resMinguoZh = service.eraToGregorian("民国三十四年");
      expect(resMinguoZh.some((e) => e.gregorianYear === 1945)).toBe(true);
    });

    it("末尾无'年'字时的纯中文数字自然语言切分支持", () => {
      // 明崇祯十七
      const p1 = service.parseEraString("明崇祯十七");
      expect(p1).toEqual({ dynastyName: "明", eraName: "崇祯", eraYear: 17 });

      // 崇祯十七
      const p2 = service.parseEraString("崇祯十七");
      expect(p2).toEqual({ eraName: "崇祯", eraYear: 17 });

      // 贞观二
      const p3 = service.parseEraString("贞观二");
      expect(p3).toEqual({ eraName: "贞观", eraYear: 2 });

      // 康熙六十一
      const p4 = service.parseEraString("康熙六十一");
      expect(p4).toEqual({ eraName: "康熙", eraYear: 61 });
    });

    it("TS 运行时整型数值防御：拦截浮点数与 NaN", () => {
      expect(() => service.gregorianToEra(2024.5)).toThrow("非法的公历年份");
      expect(() => service.gregorianToEra(NaN)).toThrow("非法的公历年份");
      expect(() => service.eraToGregorian("崇祯", 1.5)).toThrow("非法的年号年份");
    });
  });
});
