import { describe, it, expect, beforeAll } from "vitest";
import { ChronologyService } from "../src/chronology";
import { defaultDataset } from "../src/data";

describe("ChronologyService parseEraString 自然语言解析", () => {
  let service: ChronologyService;

  beforeAll(() => {
    service = new ChronologyService(defaultDataset);
  });

  it("解析纯年号加阿拉伯数字", () => {
    const res = service.parseEraString("崇祯17年");
    expect(res).toEqual({
      eraName: "崇祯",
      eraYear: 17
    });
  });

  it("解析带朝代与中文数字", () => {
    const res = service.parseEraString("明崇祯十七年");
    expect(res).toEqual({
      dynastyName: "明",
      eraName: "崇祯",
      eraYear: 17
    });
  });

  it("解析元年", () => {
    const res = service.parseEraString("顺治元年");
    expect(res).toEqual({
      eraName: "顺治",
      eraYear: 1
    });
  });

  it("解析汉朝/西汉建元年号", () => {
    const res1 = service.parseEraString("汉建元二年");
    expect(res1).toEqual({
      dynastyName: "汉",
      eraName: "建元",
      eraYear: 2
    });

    const res2 = service.parseEraString("西汉建元二年");
    expect(res2).toEqual({
      dynastyName: "西汉",
      eraName: "建元",
      eraYear: 2
    });

    const res3 = service.parseEraString("建元元年");
    expect(res3).toEqual({
      eraName: "建元",
      eraYear: 1
    });

    const res4 = service.parseEraString("元光元年");
    expect(res4).toEqual({
      eraName: "元光",
      eraYear: 1
    });
  });

  it("末尾无'年'字也能正常解析", () => {
    const res = service.parseEraString("康熙61");
    expect(res).toEqual({
      eraName: "康熙",
      eraYear: 61
    });
  });

  it("非法输入应抛出对应异常", () => {
    expect(() => service.parseEraString("")).toThrow("无法匹配年号格式");
    expect(() => service.parseEraString("十年")).toThrow("输入缺少有效的年号名称");
  });
});
