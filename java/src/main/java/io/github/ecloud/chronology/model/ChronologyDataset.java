package io.github.ecloud.chronology.model;

import java.util.List;

/**
 * 纪年全量基准数据集
 *
 * @param dynasties 朝代列表
 * @param eras      年号列表
 * @param ganzhi    六十甲子列表
 */
public record ChronologyDataset(List<Dynasty> dynasties, List<Era> eras, List<GanzhiItem> ganzhi) {}
