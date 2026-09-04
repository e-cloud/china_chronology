package io.github.ecloud.chronology.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 天干地支历法计算工具类
 */
public final class GanzhiUtil {

    private static final String[] TIANGAN = {"甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"};

    private static final String[] DIZHI = {"子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"};

    /**
     * 六十甲子干支表（只读）
     */
    public static final List<String> DEFAULT_GANZHI_LIST;

    static {
        List<String> list = new ArrayList<>(60);
        for (int i = 0; i < 60; i++) {
            list.add(TIANGAN[i % 10] + DIZHI[i % 12]);
        }
        DEFAULT_GANZHI_LIST = Collections.unmodifiableList(list);
    }

    private GanzhiUtil() {
        // 工具类禁止实例化
    }

    /**
     * 公历年份转干支
     *
     * @param year 公历年份（负数表示公元前，如 -221 表示公元前 221 年，无公元 0 年）
     * @return 对应的天干地支名称
     * @throws IllegalArgumentException 当传入年份为 0 时抛出
     */
    public static String gregorianToGanzhi(int year) {
        return gregorianToGanzhi(year, DEFAULT_GANZHI_LIST);
    }

    /**
     * 公历年份转干支（指定干支对照表）
     *
     * @param year 公历年份
     * @param ganzhiList 干支列表
     * @return 对应的天干地支名称
     */
    public static String gregorianToGanzhi(int year, List<String> ganzhiList) {
        if (year == 0) {
            throw new IllegalArgumentException("历史上无公元 0 年");
        }

        // 公元前 1 年对应数学 0，公元前 2 年对应 -1
        int mathYear = year > 0 ? year : year + 1;
        int offset = (mathYear - 4) % 60;
        if (offset < 0) {
            offset += 60;
        }

        return ganzhiList.get(offset);
    }

    /**
     * 干支纪年转公历年份列表（60 年一循环，须指定年份检索范围）
     *
     * @param ganzhi 干支名称（如 "甲申"）
     * @param startYear 起始公历年份
     * @param endYear 结束公历年份
     * @return 范围内的公历年份列表（已自动跳过公元 0 年）
     * @throws IllegalArgumentException 当干支名称不在对照表中时抛出
     */
    public static List<Integer> ganzhiToGregorian(String ganzhi, int startYear, int endYear) {
        return ganzhiToGregorian(ganzhi, startYear, endYear, DEFAULT_GANZHI_LIST);
    }

    /**
     * 干支纪年转公历年份列表（指定干支对照表）
     *
     * @param ganzhi 干支名称
     * @param startYear 起始公历年份
     * @param endYear 结束公历年份
     * @param ganzhiList 干支列表
     * @return 范围内的公历年份列表
     */
    public static List<Integer> ganzhiToGregorian(String ganzhi, int startYear, int endYear, List<String> ganzhiList) {
        if (startYear > endYear) {
            return List.of();
        }

        int targetIdx = ganzhiList.indexOf(ganzhi);
        if (targetIdx == -1) {
            throw new IllegalArgumentException("无效的干支名称: \"" + ganzhi + "\"");
        }

        Integer firstMatch = null;
        int searchLimit = (int) Math.min((long) startYear + 60, (long) endYear);
        for (int y = startYear; y <= searchLimit; y++) {
            if (y == 0) {
                continue;
            }
            if (gregorianToGanzhi(y, ganzhiList).equals(ganzhi)) {
                firstMatch = y;
                break;
            }
        }

        if (firstMatch == null) {
            return List.of();
        }

        List<Integer> matchedYears = new ArrayList<>();
        int curr = firstMatch;
        while (curr <= endYear) {
            matchedYears.add(curr);
            if (curr < 0 && curr + 60 >= 0) {
                curr = curr + 60 + 1;
            } else {
                curr += 60;
            }
        }
        return Collections.unmodifiableList(matchedYears);
    }
}
