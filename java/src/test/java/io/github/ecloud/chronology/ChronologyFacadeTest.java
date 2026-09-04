package io.github.ecloud.chronology;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.ecloud.chronology.model.Dynasty;
import io.github.ecloud.chronology.model.Era;
import io.github.ecloud.chronology.model.EraMatchResult;
import io.github.ecloud.chronology.model.GregorianMatchResult;
import io.github.ecloud.chronology.model.ParsedEraQuery;
import java.lang.reflect.Constructor;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 静态工具门面类单元测试
 */
class ChronologyFacadeTest {

    @Test
    @DisplayName("Chronology 私有构造函数应可以通过反射调用")
    void testPrivateConstructor() throws Exception {
        Constructor<Chronology> constructor = Chronology.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        Chronology instance = constructor.newInstance();
        assertThat(instance).isNotNull();
    }

    @Test
    @DisplayName("ParsedEraQuery optDynastyName 行为验证")
    void testParsedEraQueryOptDynasty() {
        ParsedEraQuery withDynasty = new ParsedEraQuery("唐", "贞观", 8);
        assertThat(withDynasty.optDynastyName()).contains("唐");

        ParsedEraQuery withoutDynasty = new ParsedEraQuery(null, "贞观", 8);
        assertThat(withoutDynasty.optDynastyName()).isEmpty();
    }

    @Test
    @DisplayName("Chronology 静态方法应正确代理 ChronologyService")
    void shouldDelegateCallsProperly() {
        // 1. 获取朝代与年号
        List<Dynasty> dynasties = Chronology.getDynasties();
        assertThat(dynasties).isNotEmpty();

        List<Era> eras = Chronology.getEras();
        assertThat(eras).isNotEmpty();

        List<Era> mingEras = Chronology.getEras("明");
        assertThat(mingEras).isNotEmpty();

        // 2. 获取干支列表
        List<String> ganzhi = Chronology.getGanzhiList();
        assertThat(ganzhi).hasSize(60);

        // 3. 解析文本
        ParsedEraQuery parsed = Chronology.parseEraString("明崇祯十七年");
        assertThat(parsed.dynastyName()).isEqualTo("明");
        assertThat(parsed.eraName()).isEqualTo("崇祯");
        assertThat(parsed.eraYear()).isEqualTo(17);

        // 4. 公历转干支与干支查公历
        assertThat(Chronology.gregorianToGanzhi(1644)).isEqualTo("甲申");
        assertThat(Chronology.ganzhiToGregorian("甲申", 1600, 1650)).containsExactly(1644);

        // 5. 公历查年号
        List<EraMatchResult> eraMatches = Chronology.gregorianToEra(1644);
        assertThat(eraMatches).isNotEmpty();

        // 6. 年号转公历（多重载）
        List<GregorianMatchResult> res1 = Chronology.eraToGregorian("崇祯17年");
        assertThat(res1).isNotEmpty();

        List<GregorianMatchResult> res2 = Chronology.eraToGregorian("崇祯", 17);
        assertThat(res2).isNotEmpty();

        List<GregorianMatchResult> res3 = Chronology.eraToGregorian("崇祯", 17, "明");
        assertThat(res3).isNotEmpty();

        List<GregorianMatchResult> res4 = Chronology.eraToGregorian("崇祯", "十七", "明");
        assertThat(res4).isNotEmpty();
    }
}
