package io.github.ecloud.chronology;

import io.github.ecloud.chronology.model.Dynasty;
import io.github.ecloud.chronology.model.Era;
import io.github.ecloud.chronology.model.EraMatchResult;
import io.github.ecloud.chronology.model.GregorianMatchResult;
import io.github.ecloud.chronology.model.ParsedEraQuery;
import java.util.List;

/**
 * 中国历代纪年工具类门面（开箱即用静态 API）
 */
public final class Chronology {

    private static final class InstanceHolder {
        private static final ChronologyService INSTANCE = ChronologyService.createDefault();
    }

    private Chronology() {
        // 工具类禁止实例化
    }

    /**
     * 获取默认全局服务单例
     *
     * @return ChronologyService 单例
     */
    public static ChronologyService getDefaultService() {
        return InstanceHolder.INSTANCE;
    }

    /**
     * 获取全量朝代列表
     */
    public static List<Dynasty> getDynasties() {
        return getDefaultService().getDynasties();
    }

    /**
     * 获取全量年号列表
     */
    public static List<Era> getEras() {
        return getDefaultService().getEras();
    }

    /**
     * 按朝代（或朝代别名）过滤年号列表
     *
     * @param dynastyName 朝代名称（如 "汉"、"西汉"、"唐"、"曹魏"）
     * @return 年号列表
     */
    public static List<Era> getEras(String dynastyName) {
        return getDefaultService().getEras(dynastyName);
    }

    /**
     * 获取六十甲子干支列表
     */
    public static List<String> getGanzhiList() {
        return getDefaultService().getGanzhiList();
    }

    /**
     * 解析自然语言纪年字符串
     *
     * @param input 自然语言文本（如 "崇祯17年"、"明崇祯十七年"）
     * @return 解析结果
     */
    public static ParsedEraQuery parseEraString(String input) {
        return getDefaultService().parseEraString(input);
    }

    /**
     * 公历年份转干支
     *
     * @param year 公历年份（负数表示公元前，无公元 0 年）
     * @return 干支名称
     */
    public static String gregorianToGanzhi(int year) {
        return getDefaultService().gregorianToGanzhi(year);
    }

    /**
     * 干支纪年转公历年份列表
     *
     * @param ganzhi    干支名称（如 "甲申"）
     * @param startYear 起始公历年份
     * @param endYear   结束公历年份
     * @return 范围内的公历年份列表
     */
    public static List<Integer> ganzhiToGregorian(String ganzhi, int startYear, int endYear) {
        return getDefaultService().ganzhiToGregorian(ganzhi, startYear, endYear);
    }

    /**
     * 公历年份反查朝代年号
     *
     * @param year 公历年份
     * @return 匹配的年号纪年列表
     */
    public static List<EraMatchResult> gregorianToEra(int year) {
        return getDefaultService().gregorianToEra(year);
    }

    /**
     * 自然语言年号转公历年份
     *
     * @param input 自然语言纪年（如 "明崇祯十七年"）
     * @return 公历反查结果列表
     */
    public static List<GregorianMatchResult> eraToGregorian(String input) {
        return getDefaultService().eraToGregorian(input);
    }

    /**
     * 年号转公历年份
     *
     * @param eraName 年号名称
     * @param eraYear 年号第几年
     * @return 公历反查结果列表
     */
    public static List<GregorianMatchResult> eraToGregorian(String eraName, int eraYear) {
        return getDefaultService().eraToGregorian(eraName, eraYear);
    }

    /**
     * 年号转公历年份（指定朝代消歧）
     *
     * @param eraName     年号名称
     * @param eraYear     年号第几年
     * @param dynastyName 朝代名称
     * @return 公历反查结果列表
     */
    public static List<GregorianMatchResult> eraToGregorian(String eraName, int eraYear, String dynastyName) {
        return getDefaultService().eraToGregorian(eraName, eraYear, dynastyName);
    }

    /**
     * 年号转公历年份（字符年份重载）
     *
     * @param eraName     年号名称
     * @param eraYearStr  年号年份字符串（如 "二"、"元"）
     * @param dynastyName 朝代名称
     * @return 公历反查结果列表
     */
    public static List<GregorianMatchResult> eraToGregorian(String eraName, String eraYearStr, String dynastyName) {
        return getDefaultService().eraToGregorian(eraName, eraYearStr, dynastyName);
    }
}
