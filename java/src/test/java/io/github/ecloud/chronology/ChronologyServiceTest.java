package io.github.ecloud.chronology;

import io.github.ecloud.chronology.model.ChronologyDataset;
import io.github.ecloud.chronology.model.Dynasty;
import io.github.ecloud.chronology.model.Era;
import io.github.ecloud.chronology.model.EraMatchResult;
import io.github.ecloud.chronology.model.GregorianMatchResult;
import io.github.ecloud.chronology.model.ParsedEraQuery;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 核心纪年互转、重名消歧与朝代别名测试
 */
class ChronologyServiceTest {

    private static ChronologyService service;

    @BeforeAll
    static void setUp() {
        service = ChronologyService.createDefault();
    }

    @Test
    @DisplayName("支持常见明清年号与中文/阿拉伯数字转换")
    void shouldConvertMingQingEras() {
        // 崇祯17年
        List<GregorianMatchResult> resChongzhen1 = service.eraToGregorian("崇祯17年");
        assertThat(resChongzhen1).containsExactly(
                new GregorianMatchResult(1644, "明", "崇祯", 17, "甲申")
        );

        // 明崇祯十七年
        List<GregorianMatchResult> resChongzhen2 = service.eraToGregorian("明崇祯十七年");
        assertThat(resChongzhen2).containsExactly(
                new GregorianMatchResult(1644, "明", "崇祯", 17, "甲申")
        );

        // 康熙元年
        List<GregorianMatchResult> resKangxi = service.eraToGregorian("康熙元年");
        assertThat(resKangxi).containsExactly(
                new GregorianMatchResult(1662, "清", "康熙", 1, "壬寅")
        );
    }

    @Test
    @DisplayName("重名年号消歧：未指定朝代与指定朝代")
    void shouldDisambiguateDuplicateEras() {
        // 未指定朝代：建元2年
        List<GregorianMatchResult> allJianyuan = service.eraToGregorian("建元2年");
        assertThat(allJianyuan.size()).isGreaterThanOrEqualTo(4);

        assertThat(allJianyuan).contains(
                new GregorianMatchResult(-139, "汉", "建元", 2, "壬寅"),
                new GregorianMatchResult(344, "东晋", "建元", 2, "甲辰")
        );

        // 指定朝代：自然语言 "汉建元二年"
        List<GregorianMatchResult> resHanText = service.eraToGregorian("汉建元二年");
        assertThat(resHanText).containsExactly(
                new GregorianMatchResult(-139, "汉", "建元", 2, "壬寅")
        );

        // 指定朝代：多参数重载 ("建元", 2, "汉")
        List<GregorianMatchResult> resHanArgs = service.eraToGregorian("建元", 2, "汉");
        assertThat(resHanArgs).containsExactly(
                new GregorianMatchResult(-139, "汉", "建元", 2, "壬寅")
        );

        // 也支持传入西汉作为朝代
        List<GregorianMatchResult> resXiHan = service.eraToGregorian("建元", 2, "西汉");
        assertThat(resXiHan).containsExactly(
                new GregorianMatchResult(-139, "汉", "建元", 2, "壬寅")
        );
    }

    @Test
    @DisplayName("超出年号在位年份应返回空列表")
    void shouldReturnEmptyWhenOutOfRange() {
        // 崇祯仅在位17年，第20年不存在
        List<GregorianMatchResult> res = service.eraToGregorian("崇祯20年");
        assertThat(res).isEmpty();
    }

    @Test
    @DisplayName("1644 年应同时查询到明崇祯17年与清顺治元年")
    void shouldFindMingAndQingIn1644() {
        List<EraMatchResult> res1644 = service.gregorianToEra(1644);
        assertThat(res1644).contains(
                new EraMatchResult("明", "崇祯", 17, "崇祯17年", 1644, "甲申"),
                new EraMatchResult("清", "顺治", 1, "顺治元年", 1644, "甲申")
        );
    }

    @Test
    @DisplayName("查询公元前年份年号（如公元前139年）")
    void shouldFindBceEra() {
        List<EraMatchResult> resBC139 = service.gregorianToEra(-139);
        assertThat(resBC139).contains(
                new EraMatchResult("汉", "建元", 2, "建元2年", -139, "壬寅")
        );
    }

    @Test
    @DisplayName("查询公元 0 年应抛出异常")
    void shouldThrowWhenGregorianYearIsZero() {
        assertThatThrownBy(() -> service.gregorianToEra(0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("历史上无公元 0 年");
    }

    @Test
    @DisplayName("getDynasties 应返回合法的数值 ID 与有效朝代名称列表")
    void shouldGetDynasties() {
        List<Dynasty> dynasties = service.getDynasties();
        assertThat(dynasties.size()).isGreaterThan(50);
        assertThat(dynasties.stream().anyMatch(d -> "唐".equals(d.name()))).isTrue();
        assertThat(dynasties.stream().anyMatch(d -> "明".equals(d.name()))).isTrue();
        assertThat(dynasties.stream().anyMatch(d -> "汉".equals(d.name()))).isTrue();
    }

    @Test
    @DisplayName("getEras 应支持全部与按朝代及朝代别名过滤")
    void shouldGetErasWithFiltering() {
        List<Era> allEras = service.getEras();
        assertThat(allEras).isNotEmpty();

        List<Era> mingEras = service.getEras("明");
        assertThat(mingEras).allMatch(e -> "明".equals(e.dynastyName()));

        List<Era> hanEras = service.getEras("汉");
        assertThat(hanEras).isNotEmpty();

        List<Era> rawXiHanEras = service.getEras("西汉");
        assertThat(rawXiHanEras).isNotEmpty();

        // 三国与武周别名过滤
        assertThat(service.getEras("曹魏")).isNotEmpty();
        assertThat(service.getEras("蜀汉")).isNotEmpty();
        assertThat(service.getEras("孙吴")).isNotEmpty();
        assertThat(service.getEras("武周")).isNotEmpty();
        assertThat(service.getEras("不存在朝代")).isEmpty();
        assertThat(service.getEras(null)).isEqualTo(allEras);

        // 验证 rawDynastyName 命中别名分支
        ChronologyService customAliasService = new ChronologyService(new ChronologyDataset(
                List.of(new Dynasty(1, "地方割据")),
                List.of(new Era(1, 1, "地方割据", "西汉", "自建年号", 10, 15)),
                null
        ));
        assertThat(customAliasService.getEras("汉")).hasSize(1);
    }

    @Test
    @DisplayName("getGanzhiList 应返回 60 干支，未传入时回退到默认列表")
    void shouldGetGanzhiListAndFallback() {
        assertThat(service.getGanzhiList()).hasSize(60);

        ChronologyService fallbackService = new ChronologyService(new ChronologyDataset(
                List.of(new Dynasty(1, "明")),
                List.of(new Era(1, 1, "明", null, "洪武", 1368, 1398)),
                List.of()
        ));
        assertThat(fallbackService.getGanzhiList()).hasSize(60);
    }

    @Test
    @DisplayName("三国政权别名消歧（曹魏/魏、孙吴/东吴/吴、蜀汉/蜀）")
    void shouldDisambiguateThreeKingdoms() {
        List<GregorianMatchResult> resWei1 = service.eraToGregorian("曹魏黄初元年");
        assertThat(resWei1).containsExactly(
                new GregorianMatchResult(220, "三国魏", "黄初", 1, "庚子")
        );

        List<GregorianMatchResult> resWei2 = service.eraToGregorian("魏黄初元年");
        assertThat(resWei2).containsExactly(
                new GregorianMatchResult(220, "三国魏", "黄初", 1, "庚子")
        );

        List<GregorianMatchResult> resWu1 = service.eraToGregorian("孙吴黄武元年");
        assertThat(resWu1).containsExactly(
                new GregorianMatchResult(222, "三国吴", "黄武", 1, "壬寅")
        );

        List<GregorianMatchResult> resWu2 = service.eraToGregorian("东吴黄龙元年");
        assertThat(resWu2).containsExactly(
                new GregorianMatchResult(229, "三国吴", "黄龙", 1, "己酉")
        );
    }

    @Test
    @DisplayName("晋代单字与分期朝代消歧")
    void shouldDisambiguateJinDynasty() {
        // 输入全称单字朝代 "晋泰始元年"
        List<GregorianMatchResult> resJin1 = service.eraToGregorian("晋泰始元年");
        assertThat(resJin1).containsExactly(
                new GregorianMatchResult(265, "西晋", "泰始", 1, "乙酉")
        );

        // 输入具体朝代 "西晋泰始元年"
        List<GregorianMatchResult> resJin2 = service.eraToGregorian("西晋泰始元年");
        assertThat(resJin2).containsExactly(
                new GregorianMatchResult(265, "西晋", "泰始", 1, "乙酉")
        );
    }

    @Test
    @DisplayName("武周政权与周朝别名消歧")
    void shouldDisambiguateWuZhou() {
        List<GregorianMatchResult> resZhou1 = service.eraToGregorian("武周天授元年");
        assertThat(resZhou1).containsExactly(
                new GregorianMatchResult(690, "周", "天授", 1, "庚寅")
        );

        List<GregorianMatchResult> resZhou2 = service.eraToGregorian("周天授元年");
        assertThat(resZhou2).containsExactly(
                new GregorianMatchResult(690, "周", "天授", 1, "庚寅")
        );
    }

    @Test
    @DisplayName("繁体字清洗后的年号（地节、鸿嘉、居摄）正常检索")
    void shouldFindCleanedEraNames() {
        // 汉宣帝 地节元年 (-69年)
        assertThat(service.eraToGregorian("汉地节元年")).containsExactly(
                new GregorianMatchResult(-69, "汉", "地节", 1, "壬子")
        );

        // 汉成帝 鸿嘉元年 (-20年)
        assertThat(service.eraToGregorian("汉鸿嘉元年")).containsExactly(
                new GregorianMatchResult(-20, "汉", "鸿嘉", 1, "辛丑")
        );

        // 孺子婴 居摄元年 (公元6年)
        assertThat(service.eraToGregorian("汉居摄元年")).containsExactly(
                new GregorianMatchResult(6, "汉", "居摄", 1, "丙寅")
        );
    }

    @Test
    @DisplayName("parseEraString 兜底匹配未知年号与朝代匹配但年号未知情况")
    void shouldHandleUnknownEraNames() {
        ParsedEraQuery parsed1 = service.parseEraString("未知年号3年");
        assertThat(parsed1.eraName()).isEqualTo("未知年号");
        assertThat(parsed1.eraYear()).isEqualTo(3);
        assertThat(parsed1.dynastyName()).isNull();

        ParsedEraQuery parsed2 = service.parseEraString("明未命名年号5年");
        assertThat(parsed2.eraName()).isEqualTo("明未命名年号");
        assertThat(parsed2.eraYear()).isEqualTo(5);
        assertThat(parsed2.dynastyName()).isNull();
    }

    @Test
    @DisplayName("eraToGregorian 支持字符串年份与参数校验")
    void shouldValidateEraYear() {
        // 传中文数字字符串作为年份
        List<GregorianMatchResult> resStr = service.eraToGregorian("建元", "二", "汉");
        assertThat(resStr).containsExactly(
                new GregorianMatchResult(-139, "汉", "建元", 2, "壬寅")
        );

        assertThatThrownBy(() -> service.eraToGregorian("崇祯", 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("非法的年号年份");

        assertThatThrownBy(() -> service.eraToGregorian("崇祯", -1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("非法的年号年份");
    }

    @Test
    @DisplayName("跨越公元前后无 0 年的年号双向互转修正")
    void shouldHandleEraCrossingZeroYear() {
        ChronologyService crossService = new ChronologyService(new ChronologyDataset(
                List.of(new Dynasty(1, "虚拟朝代")),
                List.of(new Era(1, 1, "虚拟朝代", null, "跨元", -2, 3)),
                null
        ));

        // 公历公元 2 年：跨越公元前无0年，元年(-2), 二年(-1), 三年(1), 四年(2)
        List<EraMatchResult> eraRes = crossService.gregorianToEra(2);
        assertThat(eraRes).containsExactly(
                new EraMatchResult("虚拟朝代", "跨元", 4, "跨元4年", 2, "壬戌")
        );

        // 年号转公历：跨元4年 -> 公元 2 年
        List<GregorianMatchResult> gregRes = crossService.eraToGregorian("跨元4年");
        assertThat(gregRes).containsExactly(
                new GregorianMatchResult(2, "虚拟朝代", "跨元", 4, "壬戌")
        );
    }

    @Test
    @DisplayName("空数据集与两参数重载测试")
    void shouldHandleEdgeCases() {
        assertThatThrownBy(() -> new ChronologyService(null))
                .isInstanceOf(NullPointerException.class);

        ChronologyService emptyService = new ChronologyService(new ChronologyDataset(null, null, null));
        assertThat(emptyService.getDynasties()).isEmpty();
        assertThat(emptyService.getEras()).isEmpty();
        assertThat(emptyService.getGanzhiList()).hasSize(60);

        List<GregorianMatchResult> res = service.eraToGregorian("贞观", 1);
        assertThat(res).isNotEmpty();
    }
}
