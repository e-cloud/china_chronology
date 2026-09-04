const TG = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DZ = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const DEFAULT_GANZHI_LIST: string[] = Array.from(
  { length: 60 },
  (_, i) => `${TG[i % 10]}${DZ[i % 12]}`
);

/**
 * 公历年转干支
 * @param year 公历年份（负数表示公元前，如 -221 表示公元前221年，无公元0年）
 * @param ganzhiList 60干支列表（可选）
 */
export function gregorianToGanzhi(
  year: number,
  ganzhiList: string[] = DEFAULT_GANZHI_LIST
): string {
  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw new Error(`非法的公历年份: ${year}`);
  }
  if (year === 0) {
    throw new Error("历史上无公元 0 年");
  }

  // 公元前1年记为数学 0，公元前2年记为 -1
  const mathYear = year > 0 ? year : year + 1;
  let offset = (mathYear - 4) % 60;
  if (offset < 0) {
    offset += 60;
  }

  return ganzhiList[offset];
}

/**
 * 干支纪年转公历年份（60年一循环，须指定范围）
 */
export function ganzhiToGregorian(
  ganzhi: string,
  startYear: number,
  endYear: number,
  ganzhiList: string[] = DEFAULT_GANZHI_LIST
): number[] {
  if (
    typeof startYear !== "number" ||
    !Number.isInteger(startYear) ||
    typeof endYear !== "number" ||
    !Number.isInteger(endYear)
  ) {
    throw new Error(`非法的公历检索范围: [${startYear}, ${endYear}]`);
  }
  if (startYear === 0 || endYear === 0) {
    throw new Error("历史上无公元 0 年");
  }
  if (startYear > endYear) {
    return [];
  }
  if (endYear - startYear > 10000) {
    throw new Error(`公历检索范围跨度过大 (最大允许 10000 年): [${startYear}, ${endYear}]`);
  }

  const targetIdx = ganzhiList.indexOf(ganzhi);
  if (targetIdx === -1) {
    throw new Error(`无效的干支名称: "${ganzhi}"`);
  }

  // 快速查找首个匹配年份（最多检索 60 次）
  let firstMatch: number | null = null;
  const searchLimit = Math.min(startYear + 60, endYear);
  for (let y = startYear; y <= searchLimit; y++) {
    if (y === 0) continue;
    if (gregorianToGanzhi(y, ganzhiList) === ganzhi) {
      firstMatch = y;
      break;
    }
  }

  if (firstMatch === null) {
    return [];
  }

  const matchedYears: number[] = [];
  let curr = firstMatch;
  while (curr <= endYear) {
    matchedYears.push(curr);
    // 跨越公元无 0 年修正（公元前1年跳到公元1年）
    if (curr < 0 && curr + 60 >= 0) {
      curr = curr + 60 + 1;
    } else {
      curr += 60;
    }
  }
  return matchedYears;
}
