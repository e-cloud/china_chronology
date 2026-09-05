# Changelog

# 0.1.0 (2026-09-05)


### Bug Fixes

* 补全南朝消歧继承树、加固防篡改浅拷贝与跨环境确定性排序 ([81852d5](https://github.com/e-cloud/china_chronology/commit/81852d538e3be228cd9f4e25e34621cc4cda29fc))
* 完善两宋与魏朝等别名映射、修复开元年防误吞算法并强化非法0年拦截 ([f0f37b9](https://github.com/e-cloud/china_chronology/commit/f0f37b912db8fa3b553c5fe91f0ef7b1f650083c))
* 修复朝代消歧穿透、民国截断及跨语言鲁棒性问题 ([f1f9e6d](https://github.com/e-cloud/china_chronology/commit/f1f9e6d72434c358035b70d931d8b9c326d43538))
* **data:** 修复朝代推导式解包数据损坏与漏网繁体字清洗 ([db35973](https://github.com/e-cloud/china_chronology/commit/db35973e5c99cf9c310efc17c3b2122ba5e0a340))
* **data:** 修正秦国姓嬴秦正字、归一化刘宋/杨吴/马楚带括号朝代名称 ([7feed27](https://github.com/e-cloud/china_chronology/commit/7feed27ae55cc283b3d137925af74eabf2d0ec11))
* **ts:** 修复 d.ts 类型声明生成路径错乱、补全 npm 发布文档与清理孤儿 lockfile ([613e71c](https://github.com/e-cloud/china_chronology/commit/613e71c7bd0eb745227af609a6c15e02b373755a))


### Features

* **api:** 导出统一入口与开箱即用的默认 chronology 实例 ([d6f2164](https://github.com/e-cloud/china_chronology/commit/d6f2164aeb65761cc8f64eeb1f6fdd52d2dc5479))
* **core:** 实现 ChronologyService 核心类、纪年解析与公历干支消歧算法 ([37a4bfb](https://github.com/e-cloud/china_chronology/commit/37a4bfb64d0b8efd4c375629fa3e9e14f34a10fd))
* **core:** 支持全套朝代结构化别名体系、古籍数字廿卅与年号元字消歧 ([c584de6](https://github.com/e-cloud/china_chronology/commit/c584de669e439d31c7551cca5e315cc1f82fe1c7))
* **data:** 实现 CBDB SQLite 数据抽取清洗脚本与类型数据集 ([170a3b1](https://github.com/e-cloud/china_chronology/commit/170a3b10426e4e9de04f95546b8a87788b84f921))
* **java:** 实现 Java 17 核心模型、干支历法、解析器与 Chronology 门面及测试 ([3e253b4](https://github.com/e-cloud/china_chronology/commit/3e253b4f5ea1640a71a0d6ee787bfb74a6e18a26))
* **publish:** 支持 Sonatype Central Portal 与 NPM 双端发布，集成 Spotless 与 Checkstyle 门禁 ([9fdda1b](https://github.com/e-cloud/china_chronology/commit/9fdda1bc604fe3f2ba22e6ce9f121e4064cd3897))
* **utils:** 实现中文数字解析与天干地支双向换算（TDD驱动） ([9e1d191](https://github.com/e-cloud/china_chronology/commit/9e1d191dc9ec9b17df831af50017da8dcf2d91e7))
