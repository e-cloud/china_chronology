package io.github.ecloud.chronology.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Constructor;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 干支历法计算单元测试
 */
class GanzhiUtilTest {

    @Test
    @DisplayName("私有构造函数应可以通过反射调用")
    void testPrivateConstructor() throws Exception {
        Constructor<GanzhiUtil> constructor = GanzhiUtil.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        GanzhiUtil instance = constructor.newInstance();
        assertThat(instance).isNotNull();
    }

    @Test
    @DisplayName("默认干支表长度应为 60 且以甲子开头、癸亥结尾")
    void shouldHaveValidDefaultGanzhiList() {
        List<String> list = GanzhiUtil.DEFAULT_GANZHI_LIST;
        assertThat(list).hasSize(60);
        assertThat(list.get(0)).isEqualTo("甲子");
        assertThat(list.get(59)).isEqualTo("癸亥");
    }

    @Test
    @DisplayName("历史上无公元 0 年应抛出 IllegalArgumentException")
    void shouldThrowWhenYearIsZero() {
        assertThatThrownBy(() -> GanzhiUtil.gregorianToGanzhi(0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("历史上无公元 0 年");
    }

    @Test
    @DisplayName("常见公历年份干支计算")
    void shouldCalculateCommonGregorianToGanzhi() {
        // 1644年 明亡清兴 甲申之变
        assertThat(GanzhiUtil.gregorianToGanzhi(1644)).isEqualTo("甲申");
        // 1984年 甲子年
        assertThat(GanzhiUtil.gregorianToGanzhi(1984)).isEqualTo("甲子");
        // 2024年 甲辰年
        assertThat(GanzhiUtil.gregorianToGanzhi(2024)).isEqualTo("甲辰");
    }

    @Test
    @DisplayName("公元前年份干支计算（无 0 年修正）")
    void shouldCalculateBceGregorianToGanzhi() {
        // 公元前 140 年（西汉汉武帝建元年）对应辛丑
        assertThat(GanzhiUtil.gregorianToGanzhi(-140)).isEqualTo("辛丑");
        // 公元前 139 年（建元二年）对应壬寅
        assertThat(GanzhiUtil.gregorianToGanzhi(-139)).isEqualTo("壬寅");
    }

    @Test
    @DisplayName("无效干支名称应抛出 IllegalArgumentException")
    void shouldThrowWhenInvalidGanzhiName() {
        assertThatThrownBy(() -> GanzhiUtil.ganzhiToGregorian("无效干支", 1600, 1650))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无效的干支名称");
    }

    @Test
    @DisplayName("在给定年份范围内检索干支年份")
    void shouldFindYearsByGanzhiInRange() {
        // 1600-1650 年间的甲申年
        assertThat(GanzhiUtil.ganzhiToGregorian("甲申", 1600, 1650)).containsExactly(1644);
        // 1900-2000 年间的甲子年
        assertThat(GanzhiUtil.ganzhiToGregorian("甲子", 1900, 2000)).containsExactly(1924, 1984);
        // 跨公元前后区间（-2 到 2，测试过滤 0 年逻辑）
        assertThat(GanzhiUtil.ganzhiToGregorian("庚申", -2, 2)).containsExactly(-1);

        assertThatThrownBy(() -> GanzhiUtil.ganzhiToGregorian("甲子", 0, 2020))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("历史上无公元 0 年");
        assertThatThrownBy(() -> GanzhiUtil.ganzhiToGregorian("甲子", 1900, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("历史上无公元 0 年");
        assertThatThrownBy(() -> GanzhiUtil.ganzhiToGregorian("甲子", 1, 10002))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("公历检索范围跨度过大");
        assertThat(GanzhiUtil.ganzhiToGregorian("甲子", 2020, 2000)).isEmpty();
    }
}
