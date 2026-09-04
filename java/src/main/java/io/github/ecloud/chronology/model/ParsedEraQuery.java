package io.github.ecloud.chronology.model;

import java.util.Optional;

/**
 * 解析后的年号查询结构
 *
 * @param dynastyName 朝代名称（可选）
 * @param eraName     年号名称（如 "贞观"）
 * @param eraYear     年号年份序号（如 1、8）
 */
public record ParsedEraQuery(
        String dynastyName,
        String eraName,
        int eraYear
) {
    /**
     * 获取朝代名称 Optional
     */
    public Optional<String> optDynastyName() {
        return Optional.ofNullable(dynastyName);
    }
}
