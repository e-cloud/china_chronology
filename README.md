# china-chronology

中国历代纪年、公历年份与天干地支双向互转库。基于哈佛大学、台湾中研院与北京大学联合主持的 **CBDB（中国历代人物传记资料库）** 权威 SQLite 数据抽取清洗，支持规范简体中文输入、重名年号消歧、自然语言解析及历史无公元 0 年修正。

- **现代化构建**: 基于 Vite 8 构建，开箱即用支持 ESM 与 CommonJS 双模块产物。
- **纯同步零 IO**: 内置清洗后的历代年号与干支全量数据集，前端浏览器与 Node.js 服务端均可瞬间同步初始化。
- **智能消歧与解析**: 支持中文纪年（“元”、“十七”、“六十一”）、朝代名称识别（支持全称与简称，如“汉”/“西汉”）、重名年号消歧。

## 安装

```bash
npm install china-chronology
# 或
pnpm add china-chronology
```

## 快速使用

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

## 历法与精度说明

- **公历整年粒度**：本库基于中国历史学公认的标准宏观公历整年换算。中国夏历岁首（正月初一）通常落在公历 1 月 21 日至 2 月 20 日之间，故公历 1 月份在严格农历日历上往往属于前一年末（如公历 1644 年 1 月实为明崇祯十六年癸未年十二月），在微观特定日期考证时需注意此自然岁首漂移。
- **一岁多号与并立改元**：历史上同一年存在多次改元或不同政权并存（如 1644 年明崇祯十七年与清顺治元年；公元 684 年多次改元），本库 `gregorianToEra` 将返回该公历年所有有效年号列表。

## 自定义数据集

若您有自己的年号数据集，也可以实例化 `ChronologyService`：

```typescript
import { ChronologyService } from "china-chronology";
import type { ChronologyDataset } from "china-chronology";

const customService = new ChronologyService(myDataset);
```

## License

MIT
