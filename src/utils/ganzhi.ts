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
  const targetIdx = ganzhiList.indexOf(ganzhi);
  if (targetIdx === -1) {
    throw new Error(`无效的干支名称: "${ganzhi}"`);
  }

  const matchedYears: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    if (y === 0) continue;
    if (gregorianToGanzhi(y, ganzhiList) === ganzhi) {
      matchedYears.push(y);
    }
  }
  return matchedYears;
}
