package io.github.ecloud.chronology.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * 年号信息
 *
 * @param id             年号 ID
 * @param dynastyId      所属朝代 ID
 * @param dynastyName    归一化朝代名称（如 "汉"）
 * @param rawDynastyName 原始朝代名称（如 "西汉"）
 * @param name           年号名称（如 "建元"）
 * @param startYear      起计公历年份（负数表示公元前）
 * @param endYear        止计公历年份
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Era(
        int id, int dynastyId, String dynastyName, String rawDynastyName, String name, int startYear, int endYear) {}
