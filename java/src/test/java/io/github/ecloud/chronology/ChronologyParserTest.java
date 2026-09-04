package io.github.ecloud.chronology;

import io.github.ecloud.chronology.model.ParsedEraQuery;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 自然语言纪年字符串解析单元测试
 */
class ChronologyParserTest {

    private static ChronologyService service;

    @BeforeAll
    static void setUp() {
        service = ChronologyService.createDefault();
    }

    @Test
    @DisplayName("解析纯年号加阿拉伯数字")
    void shouldParseEraWithDigits() {
        ParsedEraQuery res = service.parseEraString("崇祯17年");
        assertThat(res.eraName()).isEqualTo("崇祯");
        assertThat(res.eraYear()).isEqualTo(17);
        assertThat(res.dynastyName()).isNull();
    }

    @Test
    @DisplayName("解析带朝代与中文数字")
    void shouldParseDynastyAndChineseNumber() {
        ParsedEraQuery res = service.parseEraString("明崇祯十七年");
        assertThat(res.dynastyName()).isEqualTo("明");
        assertThat(res.eraName()).isEqualTo("崇祯");
        assertThat(res.eraYear()).isEqualTo(17);
    }

    @Test
    @DisplayName("解析元年")
    void shouldParseFirstYear() {
        ParsedEraQuery res = service.parseEraString("顺治元年");
        assertThat(res.eraName()).isEqualTo("顺治");
        assertThat(res.eraYear()).isEqualTo(1);
    }

    @Test
    @DisplayName("解析汉朝/西汉建元年号")
    void shouldParseHanJianyuan() {
        ParsedEraQuery res1 = service.parseEraString("汉建元二年");
        assertThat(res1.dynastyName()).isEqualTo("汉");
        assertThat(res1.eraName()).isEqualTo("建元");
        assertThat(res1.eraYear()).isEqualTo(2);

        ParsedEraQuery res2 = service.parseEraString("西汉建元二年");
        assertThat(res2.dynastyName()).isEqualTo("西汉");
        assertThat(res2.eraName()).isEqualTo("建元");
        assertThat(res2.eraYear()).isEqualTo(2);

        ParsedEraQuery res3 = service.parseEraString("建元元年");
        assertThat(res3.eraName()).isEqualTo("建元");
        assertThat(res3.eraYear()).isEqualTo(1);

        ParsedEraQuery res4 = service.parseEraString("元光元年");
        assertThat(res4.eraName()).isEqualTo("元光");
        assertThat(res4.eraYear()).isEqualTo(1);
    }

    @Test
    @DisplayName("末尾无'年'字也能正常解析纯阿拉伯数字")
    void shouldParseWithoutNianCharacter() {
        ParsedEraQuery res = service.parseEraString("康熙61");
        assertThat(res.eraName()).isEqualTo("康熙");
        assertThat(res.eraYear()).isEqualTo(61);
    }

    @Test
    @DisplayName("支持朝代与年号间带空格与廿/卅自然语言解析")
    void shouldSupportSpacesAndNianSa() {
        ParsedEraQuery res1 = service.parseEraString("唐 贞观八年");
        assertThat(res1.dynastyName()).isEqualTo("唐");
        assertThat(res1.eraName()).isEqualTo("贞观");
        assertThat(res1.eraYear()).isEqualTo(8);

        ParsedEraQuery res2 = service.parseEraString("乾隆廿五年");
        assertThat(res2.eraName()).isEqualTo("乾隆");
        assertThat(res2.eraYear()).isEqualTo(25);
    }

    @Test
    @DisplayName("当仅输入年号而缺少年份数字时应抛出对应异常（防止吞字）")
    void shouldThrowWhenMissingYearNumber() {
        assertThatThrownBy(() -> service.parseEraString("开元"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("输入缺少有效的年份数字");

        assertThatThrownBy(() -> service.parseEraString("唐开元"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("输入缺少有效的年份数字");

        assertThatThrownBy(() -> service.parseEraString("崇祯"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("输入缺少有效的年份数字");
    }

    @Test
    @DisplayName("非法输入应抛出对应异常")
    void shouldThrowWhenInvalidFormat() {
        assertThatThrownBy(() -> service.parseEraString(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法匹配年号格式");

        assertThatThrownBy(() -> service.parseEraString(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法匹配年号格式");

        assertThatThrownBy(() -> service.parseEraString("abcd"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无法匹配年号格式");

        assertThatThrownBy(() -> service.parseEraString("十年"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("输入缺少有效的年号名称");
    }
}
