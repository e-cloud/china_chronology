import { describe, it, expect } from "vitest";
import { parseEraYearNumber } from "../src/utils/chinese_number";

describe("parseEraYearNumber", () => {
  it("应正确解析阿拉伯数字", () => {
    expect(parseEraYearNumber("1")).toBe(1);
    expect(parseEraYearNumber("17")).toBe(17);
    expect(parseEraYearNumber("61")).toBe(61);
    expect(parseEraYearNumber(" 100 ")).toBe(100);
  });

  it("应正确解析'元'年为 1", () => {
    expect(parseEraYearNumber("元")).toBe(1);
    expect(parseEraYearNumber(" 元 ")).toBe(1);
  });

  it("应正确解析 1-9 的单个中文数字", () => {
    expect(parseEraYearNumber("一")).toBe(1);
    expect(parseEraYearNumber("二")).toBe(2);
    expect(parseEraYearNumber("两")).toBe(2);
    expect(parseEraYearNumber("三")).toBe(3);
    expect(parseEraYearNumber("四")).toBe(4);
    expect(parseEraYearNumber("五")).toBe(5);
    expect(parseEraYearNumber("六")).toBe(6);
    expect(parseEraYearNumber("七")).toBe(7);
    expect(parseEraYearNumber("八")).toBe(8);
    expect(parseEraYearNumber("九")).toBe(9);
  });

  it("应正确解析十几的中文数字", () => {
    expect(parseEraYearNumber("十")).toBe(10);
    expect(parseEraYearNumber("十一")).toBe(11);
    expect(parseEraYearNumber("十七")).toBe(17);
    expect(parseEraYearNumber("十九")).toBe(19);
  });

  it("应正确解析几十及几十几的中文数字", () => {
    expect(parseEraYearNumber("二十")).toBe(20);
    expect(parseEraYearNumber("二十一")).toBe(21);
    expect(parseEraYearNumber("三十五")).toBe(35);
    expect(parseEraYearNumber("六十一")).toBe(61);
  });

  it("应正确解析古典文献'廿'与'卅'", () => {
    expect(parseEraYearNumber("廿")).toBe(20);
    expect(parseEraYearNumber("廿一")).toBe(21);
    expect(parseEraYearNumber("廿五")).toBe(25);
    expect(parseEraYearNumber("廿九")).toBe(29);
    expect(parseEraYearNumber("卅")).toBe(30);
    expect(parseEraYearNumber("卅一")).toBe(31);
    expect(parseEraYearNumber("卅五")).toBe(35);
  });

  it("非法输入应抛出错误", () => {
    expect(() => parseEraYearNumber("abc")).toThrow("无法识别年份数字");
    expect(() => parseEraYearNumber("")).toThrow("无法识别年份数字");
    expect(() => parseEraYearNumber("百十八")).toThrow("无法识别年份数字");
    expect(() => parseEraYearNumber("十百")).toThrow("无法识别年份数字");
    expect(() => parseEraYearNumber("十十")).toThrow("无法识别年份数字");
    expect(() => parseEraYearNumber("廿零")).toThrow("无法识别年份数字");
    expect(() => parseEraYearNumber("卅零")).toThrow("无法识别年份数字");
    expect(() => parseEraYearNumber("0")).toThrow("非法的年号年份");
    expect(() => parseEraYearNumber("零")).toThrow("非法的年号年份");
  });
});
