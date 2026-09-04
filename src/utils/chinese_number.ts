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

  // 支持古典文献中的 "廿" (20) 与 "卅" (30)
  if (trimmed === "廿") return 20;
  if (trimmed.startsWith("廿")) {
    const ones = cnNumMap[trimmed.slice(1)];
    if (ones !== undefined && ones > 0) return 20 + ones;
  }
  if (trimmed === "卅") return 30;
  if (trimmed.startsWith("卅")) {
    const ones = cnNumMap[trimmed.slice(1)];
    if (ones !== undefined && ones > 0) return 30 + ones;
  }

  if (trimmed === "十") return 10;
  if (trimmed.includes("十")) {
    const parts = trimmed.split("十");
    if (parts.length === 2) {
      const [tensPart, onesPart] = parts;
      const tens = tensPart ? (cnNumMap[tensPart] ?? -1) : 1;
      const ones = onesPart ? (cnNumMap[onesPart] ?? -1) : 0;
      if (tens >= 0 && ones >= 0) {
        return tens * 10 + ones;
      }
    }
  }

  const singleDigit = cnNumMap[trimmed];
  if (singleDigit !== undefined) {
    return singleDigit;
  }

  throw new Error(`无法识别年份数字: "${yearStr}"`);
}
