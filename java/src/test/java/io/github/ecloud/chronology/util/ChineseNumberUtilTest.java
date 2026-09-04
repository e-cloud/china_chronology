package io.github.ecloud.chronology.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ChineseNumberUtilTest {

    @Test
    @DisplayName("私有构造函数应可以通过反射调用")
    void testPrivateConstructor() throws Exception {
        Constructor<ChineseNumberUtil> constructor = ChineseNumberUtil.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        ChineseNumberUtil instance = constructor.newInstance();
        assertThat(instance).isNotNull();
    }

    @Test
    @DisplayName("应正确解析阿拉伯数字")
    void testArabicNumbers() {
        assertThat(ChineseNumberUtil.parseEraYearNumber("1")).isEqualTo(1);
        assertThat(ChineseNumberUtil.parseEraYearNumber("17")).isEqualTo(17);
        assertThat(ChineseNumberUtil.parseEraYearNumber("61")).isEqualTo(61);
        assertThat(ChineseNumberUtil.parseEraYearNumber(" 100 ")).isEqualTo(100);
    }

    @Test
    @DisplayName("应正确解析'元'年为 1")
    void testYuan() {
        assertThat(ChineseNumberUtil.parseEraYearNumber("元")).isEqualTo(1);
        assertThat(ChineseNumberUtil.parseEraYearNumber(" 元 ")).isEqualTo(1);
    }

    @Test
    @DisplayName("应正确解析 1-9 的单个中文数字")
    void testSingleDigits() {
        assertThat(ChineseNumberUtil.parseEraYearNumber("一")).isEqualTo(1);
        assertThat(ChineseNumberUtil.parseEraYearNumber("二")).isEqualTo(2);
        assertThat(ChineseNumberUtil.parseEraYearNumber("两")).isEqualTo(2);
        assertThat(ChineseNumberUtil.parseEraYearNumber("三")).isEqualTo(3);
        assertThat(ChineseNumberUtil.parseEraYearNumber("四")).isEqualTo(4);
        assertThat(ChineseNumberUtil.parseEraYearNumber("五")).isEqualTo(5);
        assertThat(ChineseNumberUtil.parseEraYearNumber("六")).isEqualTo(6);
        assertThat(ChineseNumberUtil.parseEraYearNumber("七")).isEqualTo(7);
        assertThat(ChineseNumberUtil.parseEraYearNumber("八")).isEqualTo(8);
        assertThat(ChineseNumberUtil.parseEraYearNumber("九")).isEqualTo(9);
    }

    @Test
    @DisplayName("应正确解析十几的中文数字")
    void testTeens() {
        assertThat(ChineseNumberUtil.parseEraYearNumber("十")).isEqualTo(10);
        assertThat(ChineseNumberUtil.parseEraYearNumber("十一")).isEqualTo(11);
        assertThat(ChineseNumberUtil.parseEraYearNumber("十七")).isEqualTo(17);
        assertThat(ChineseNumberUtil.parseEraYearNumber("十九")).isEqualTo(19);
    }

    @Test
    @DisplayName("应正确解析几十及几十几的中文数字")
    void testTens() {
        assertThat(ChineseNumberUtil.parseEraYearNumber("二十")).isEqualTo(20);
        assertThat(ChineseNumberUtil.parseEraYearNumber("二十一")).isEqualTo(21);
        assertThat(ChineseNumberUtil.parseEraYearNumber("三十五")).isEqualTo(35);
        assertThat(ChineseNumberUtil.parseEraYearNumber("六十一")).isEqualTo(61);
    }

    @Test
    @DisplayName("应正确解析古典文献'廿'与'卅'")
    void testNianAndSa() {
        assertThat(ChineseNumberUtil.parseEraYearNumber("廿")).isEqualTo(20);
        assertThat(ChineseNumberUtil.parseEraYearNumber("廿一")).isEqualTo(21);
        assertThat(ChineseNumberUtil.parseEraYearNumber("廿五")).isEqualTo(25);
        assertThat(ChineseNumberUtil.parseEraYearNumber("廿九")).isEqualTo(29);
        assertThat(ChineseNumberUtil.parseEraYearNumber("卅")).isEqualTo(30);
        assertThat(ChineseNumberUtil.parseEraYearNumber("卅一")).isEqualTo(31);
        assertThat(ChineseNumberUtil.parseEraYearNumber("卅五")).isEqualTo(35);
    }

    @Test
    @DisplayName("非法输入应抛出异常")
    void testInvalidInputs() {
        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("abc"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法识别年份数字");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法识别年份数字");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("百十八"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法识别年份数字");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("十百"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法识别年份数字");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("十十"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法识别年份数字");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("廿零"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法识别年份数字");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("卅零"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法识别年份数字");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("0"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("非法的年号年份");

        assertThatThrownBy(() -> ChineseNumberUtil.parseEraYearNumber("零"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("非法的年号年份");
    }
}
