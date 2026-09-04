package io.github.ecloud.chronology.model;

/**
 * 六十甲子干支数据项
 *
 * @param id   干支序号（1-60）
 * @param name 干支名称（如 "甲子"）
 */
public record GanzhiItem(int id, String name) {}
