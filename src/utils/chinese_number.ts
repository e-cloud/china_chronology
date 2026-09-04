/**
 * 将中文纪年数字或阿拉伯数字解析为整数
 * 支持 "元" -> 1, "十七" -> 17, "61" -> 61, "二十" -> 20, "六十一" -> 61
 */
export function parseEraYearNumber(yearStr: string): number {
  const trimmed = yearStr.trim();
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  if (trimmed === "元") {
    return 1;
  }

  const cnNumMap: Record<string, number> = {
    零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
    六: 6, 七: 7, 八: 8, 九: 9
  };

  if (trimmed === "十") return 10;
  if (trimmed.startsWith("十")) {
    const digit = cnNumMap[trimmed[1]];
    if (digit !== undefined) return 10 + digit;
  }
  if (trimmed.includes("十")) {
    const [tensPart, onesPart] = trimmed.split("十");
    const tens = cnNumMap[tensPart] ?? 1;
    const ones = onesPart ? (cnNumMap[onesPart] ?? 0) : 0;
    return tens * 10 + ones;
  }

  const singleDigit = cnNumMap[trimmed];
  if (singleDigit !== undefined) {
    return singleDigit;
  }

  throw new Error(`无法识别年份数字: "${yearStr}"`);
}
