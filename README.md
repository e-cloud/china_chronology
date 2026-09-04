# china-chronology

中国历代纪年、公历年份与天干地支双向互转库。基于哈佛大学、台湾中研院与北京大学联合主持的 **CBDB（中国历代人物传记资料库）** 权威 SQLite 数据抽取清洗，支持规范简体中文输入、重名年号消歧、自然语言解析及历史无公元 0 年修正。提供 **TypeScript / JavaScript** 与 **Java 17+** 双生态原生实现。

- **多语言双生态**: TypeScript (Vite 8, ESM+CJS) 与 Java 17+ (Gradle, Maven Central) 对等设计，共享同一权威基准数据集。
- **纯同步零 IO**: 内置清洗后的历代年号与干支全量数据集，前端浏览器、Node.js 与 Java 应用均可极速同步初始化。
- **智能消歧与解析**: 支持中文纪年（“元”、“十七”、“六十一”）、朝代名称识别（支持全称与简称，如“汉”/“西汉”）、重名年号消歧。

## 安装

### TypeScript / JavaScript (npm)

```bash
npm install china-chronology
# 或
pnpm add china-chronology
```

### Java (Gradle / Maven)

#### Gradle (Kotlin DSL)
```kotlin
implementation("io.github.e-cloud:china-chronology:0.1.0")
```

#### Maven
```xml
<dependency>
    <groupId>io.github.e-cloud</groupId>
    <artifactId>china-chronology</artifactId>
    <version>0.1.0</version>
</dependency>
```

## 快速使用

### TypeScript / JavaScript

```typescript
import { chronology, gregorianToGanzhi, ganzhiToGregorian } from "china-chronology";

// 1. 自然语言年号转公历（支持阿拉伯数字与中文数字）
chronology.eraToGregorian("崇祯17年");
// => [ { gregorianYear: 1644, dynastyName: '明', eraName: '崇祯', eraYear: 17, ganzhi: '甲申' } ]

chronology.eraToGregorian("明崇祯十七年");
// => [ { gregorianYear: 1644, dynastyName: '明', eraName: '崇祯', eraYear: 17, ganzhi: '甲申' } ]

chronology.eraToGregorian("康熙元年");
// => [ { gregorianYear: 1662, dynastyName: '清', eraName: '康熙', eraYear: 1, ganzhi: '壬寅' } ]

// 2. 重名年号消歧验证（以“建元”为例）
// 未指定朝代时，列出历史上所有叫“建元”的政权对应年份
chronology.eraToGregorian("建元2年");
// => [
//   { gregorianYear: -139, dynastyName: '汉', eraName: '建元', eraYear: 2, ganzhi: '壬寅' },
//   { gregorianYear: 344, dynastyName: '东晋', eraName: '建元', eraYear: 2, ganzhi: '甲辰' },
//   { gregorianYear: 366, dynastyName: '前秦', eraName: '建元', eraYear: 2, ganzhi: '丙寅' },
//   { gregorianYear: 480, dynastyName: '南齐', eraName: '建元', eraYear: 2, ganzhi: '庚申' }
// ]

// 指定朝代：精准消歧（支持自然语言或多参数重载）
chronology.eraToGregorian("汉建元二年");
// 或 chronology.eraToGregorian("建元", 2, "汉");
// => [ { gregorianYear: -139, dynastyName: '汉', eraName: '建元', eraYear: 2, ganzhi: '壬寅' } ]

// 3. 公历查朝代年号与干支（1644 年明清交替并存）
chronology.gregorianToEra(1644);
// => [
//   { dynastyName: '明', eraName: '崇祯', eraYear: 17, eraYearDisplay: '崇祯17年', gregorianYear: 1644, ganzhi: '甲申' },
//   { dynastyName: '清', eraName: '顺治', eraYear: 1, eraYearDisplay: '顺治元年', gregorianYear: 1644, ganzhi: '甲申' }
// ]

// 4. 三国与武周等复杂政权消歧
chronology.eraToGregorian("曹魏黄初元年");
// => [ { gregorianYear: 220, dynastyName: '三国魏', eraName: '黄初', eraYear: 1, ganzhi: '庚子' } ]

chronology.eraToGregorian("晋泰始元年"); // 全称单字自动关联西晋/东晋
// => [ { gregorianYear: 265, dynastyName: '西晋', eraName: '泰始', eraYear: 1, ganzhi: '乙酉' } ]

chronology.eraToGregorian("武周天授元年");
// => [ { gregorianYear: 690, dynastyName: '周', eraName: '天授', eraYear: 1, ganzhi: '庚寅' } ]

// 5. 古典文献数字解析（廿/卅）
chronology.eraToGregorian("乾隆廿五年"); // 自动解析为 25 年
// => [ { gregorianYear: 1760, dynastyName: '清', eraName: '乾隆', eraYear: 25, ganzhi: '庚辰' } ]

// 6. 干支跨度检索
chronology.ganzhiToGregorian("甲申", 1600, 1650);
// => [ 1644 ]

// 7. 单独使用干支换算
gregorianToGanzhi(1644); // "甲申"
gregorianToGanzhi(2024); // "甲辰"
```

### Java 17+

```java
import io.github.ecloud.chronology.Chronology;
import io.github.ecloud.chronology.model.EraMatchResult;
import io.github.ecloud.chronology.model.GregorianMatchResult;
import java.util.List;

// 1. 自然语言年号转公历（支持纯数字、中文数字与“元年”）
List<GregorianMatchResult> res1 = Chronology.eraToGregorian("明崇祯十七年");
// res1.get(0).gregorianYear() -> 1644
// res1.get(0).ganzhi()        -> "甲申"

// 2. 重名年号消歧
List<GregorianMatchResult> allJianyuan = Chronology.eraToGregorian("建元2年"); // 返回汉、东晋、前秦、南齐全部命中
List<GregorianMatchResult> hanJianyuan = Chronology.eraToGregorian("建元", 2, "汉"); // 精准锁定汉武帝建元二年 (-139年)

// 3. 公历年份反查朝代年号（1644 年明清交替并存）
List<EraMatchResult> era1644 = Chronology.gregorianToEra(1644);
// 包含：明崇祯17年、清顺治元年

// 4. 干支与公历双向互转
String ganzhi = Chronology.gregorianToGanzhi(1644); // "甲申"
List<Integer> years = Chronology.ganzhiToGregorian("甲申", 1600, 1650); // [1644]
```

## 历法与精度说明

- **公历整年宏观粒度**：本库基于中国历史学公认的标准宏观公历整年对照体系（如哈佛大学/中研院 CBDB 标准）。中国夏历岁首（正月初一）通常落在公历 1 月 21 日至 2 月 20 日之间，且民俗或命理干支存在立春与正月初一的不同岁首界定。本库干支计算遵循公历平年标准基准年份宏观映射，微观特定历史日期的日历对齐需参考专门的天文历书。
- **一岁多号与并立改元**：历史上同一年存在多次改元或不同政权并存（如 1644 年明崇祯十七年与清顺治元年；公元 684 年多次改元），本库 `gregorianToEra` 将返回该公历年所有有效年号列表。
- **历史无公元 0 年**：公元前 1 年之后即为公元 1 年，内部计算与入参均严格遵循无公元 0 年历史规范（查询 0 年将抛出非法参数异常）。

## 自定义数据集

若您有自己的年号数据集，也可以实例化 `ChronologyService`：

**TypeScript / JavaScript**:
```typescript
import { ChronologyService } from "china-chronology";
import type { ChronologyDataset } from "china-chronology";

const customService = new ChronologyService(myDataset);
```

**Java**:
```java
import io.github.ecloud.chronology.ChronologyService;
import io.github.ecloud.chronology.model.ChronologyDataset;

ChronologyService customService = new ChronologyService(myDataset);
```

## License

MIT
