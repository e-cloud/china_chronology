package io.github.ecloud.chronology.model;

/**
 * 年号纪年匹配结果
 *
 * @param dynastyName    朝代名称
 * @param eraName        年号名称
 * @param eraYear        年号年份数字
 * @param eraYearDisplay 年号年份展示文本（如 "贞观元年"）
 * @param gregorianYear  对应公历年份
 * @param ganzhi         对应干支
 */
public record EraMatchResult(
        String dynastyName, String eraName, int eraYear, String eraYearDisplay, int gregorianYear, String ganzhi) {}
