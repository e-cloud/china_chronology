package io.github.ecloud.chronology.model;

/**
 * 公历年份反查匹配结果
 *
 * @param gregorianYear 公历年份
 * @param dynastyName   朝代名称
 * @param eraName       年号名称
 * @param eraYear       年号第几年
 * @param ganzhi        天干地支
 */
public record GregorianMatchResult(
        int gregorianYear,
        String dynastyName,
        String eraName,
        int eraYear,
        String ganzhi
) {
}
