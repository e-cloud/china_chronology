package io.github.ecloud.chronology;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.ecloud.chronology.model.ChronologyDataset;
import io.github.ecloud.chronology.model.Dynasty;
import io.github.ecloud.chronology.model.Era;
import io.github.ecloud.chronology.model.EraMatchResult;
import io.github.ecloud.chronology.model.GregorianMatchResult;
import io.github.ecloud.chronology.model.ParsedEraQuery;
import io.github.ecloud.chronology.util.ChineseNumberUtil;
import io.github.ecloud.chronology.util.GanzhiUtil;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 中国历代纪年核心服务
 */
public class ChronologyService {

    private static final String DEFAULT_DATA_PATH = "/data/chronology_data.json";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final Pattern PATTERN_WITH_YEAR = Pattern.compile("^(.*?)(\\d+|[一二两三四五六七八九十廿卅]+|元)年$");
    private static final Pattern PATTERN_WITHOUT_YEAR = Pattern.compile("^(.*?)(\\d+|[一二两三四五六七八九十廿卅]+|元)$");

    /**
     * 朝代同义等价表（双向对等，表示同一政权的不同称呼）
     */
    public static final Map<String, List<String>> DYNASTY_EQUIVALENTS;

    /**
     * 朝代父子层级包含树（单向继承：父朝代向下包含各分期/政权，子朝代不可逆向匹配父代或兄弟代）
     */
    public static final Map<String, List<String>> DYNASTY_CHILDREN;

    /**
     * 朝代别名与分期归一化映射（兼容向后暴露）
     */
    public static final Map<String, List<String>> DYNASTY_ALIASES;

    static {
        Map<String, List<String>> eq = new LinkedHashMap<>();
        eq.put("民国", List.of("中华民国", "民国"));
        eq.put("中华民国", List.of("中华民国", "民国"));
        eq.put("曹魏", List.of("三国魏", "曹魏"));
        eq.put("三国魏", List.of("三国魏", "曹魏"));
        eq.put("蜀汉", List.of("三国蜀", "蜀汉"));
        eq.put("三国蜀", List.of("三国蜀", "蜀汉"));
        eq.put("孙吴", List.of("三国吴", "孙吴", "东吴"));
        eq.put("东吴", List.of("三国吴", "孙吴", "东吴"));
        eq.put("三国吴", List.of("三国吴", "孙吴", "东吴"));
        eq.put("武周", List.of("周", "武周"));
        eq.put("刘宋", List.of("刘宋", "宋(刘)", "宋（刘）"));
        eq.put("宋(刘)", List.of("刘宋", "宋(刘)", "宋（刘）"));
        eq.put("宋（刘）", List.of("刘宋", "宋(刘)", "宋（刘）"));
        eq.put("杨吴", List.of("杨吴", "吴(杨)", "吴（杨）"));
        eq.put("吴(杨)", List.of("杨吴", "吴(杨)", "吴（杨）"));
        eq.put("吴（杨）", List.of("杨吴", "吴(杨)", "吴（杨）"));
        eq.put("马楚", List.of("马楚", "楚(马)", "楚（马）"));
        eq.put("楚(马)", List.of("马楚", "楚(马)", "楚（马）"));
        eq.put("楚（马）", List.of("马楚", "楚(马)", "楚（马）"));
        DYNASTY_EQUIVALENTS = Collections.unmodifiableMap(eq);

        Map<String, List<String>> ch = new LinkedHashMap<>();
        ch.put("汉", List.of("西汉", "东汉"));
        ch.put("晋", List.of("西晋", "东晋"));
        ch.put("齐", List.of("南齐", "北齐"));
        ch.put("宋", List.of("北宋", "南宋"));
        ch.put("魏", List.of("三国魏", "曹魏", "北魏", "西魏", "东魏"));
        ch.put("蜀", List.of("三国蜀", "蜀汉"));
        ch.put("吴", List.of("三国吴", "孙吴", "东吴"));
        ch.put("周", List.of("周", "武周", "北周", "后周"));
        ch.put("秦", List.of("嬴秦", "前秦", "后秦", "西秦"));
        ch.put("赵", List.of("前赵", "后赵"));
        ch.put("燕", List.of("前燕", "后燕", "南燕", "北燕", "西燕"));
        ch.put("凉", List.of("前凉", "后凉", "西凉", "北凉", "南凉"));
        DYNASTY_CHILDREN = Collections.unmodifiableMap(ch);

        Map<String, List<String>> aliases = new LinkedHashMap<>(eq);
        for (Map.Entry<String, List<String>> entry : ch.entrySet()) {
            java.util.Set<String> set =
                    new java.util.LinkedHashSet<>(aliases.getOrDefault(entry.getKey(), List.of(entry.getKey())));
            set.addAll(entry.getValue());
            aliases.put(entry.getKey(), List.copyOf(set));
        }
        DYNASTY_ALIASES = Collections.unmodifiableMap(aliases);
    }

    private final List<Dynasty> dynasties;
    private final List<Era> eras;
    private final List<String> ganzhiList;
    private final Set<String> eraNamesSet;
    private final List<String> sortedDynasties;

    /**
     * 基于给定的基准数据集构造服务
     *
     * @param data 纪年全量数据集
     */
    public ChronologyService(ChronologyDataset data) {
        Objects.requireNonNull(data, "纪年数据集不能为空");
        this.dynasties = data.dynasties() != null ? List.copyOf(data.dynasties()) : List.of();
        this.eras = data.eras() != null ? List.copyOf(data.eras()) : List.of();

        // 建立年号快速索引集合
        Set<String> eraSet = new HashSet<>();
        for (Era era : this.eras) {
            eraSet.add(era.name());
        }
        this.eraNamesSet = Collections.unmodifiableSet(eraSet);

        // 收集所有朝代名、原始朝代名及别名，按长度降序排列
        Set<String> allDynastyNames = new HashSet<>();
        for (Dynasty d : this.dynasties) {
            if (d.name() != null && !d.name().isEmpty()) {
                allDynastyNames.add(d.name());
            }
        }
        for (Era e : this.eras) {
            if (e.dynastyName() != null && !e.dynastyName().isEmpty()) {
                allDynastyNames.add(e.dynastyName());
            }
            if (e.rawDynastyName() != null && !e.rawDynastyName().isEmpty()) {
                allDynastyNames.add(e.rawDynastyName());
            }
        }
        for (Map.Entry<String, List<String>> entry : DYNASTY_ALIASES.entrySet()) {
            allDynastyNames.add(entry.getKey());
            allDynastyNames.addAll(entry.getValue());
        }

        List<String> sortedList = new ArrayList<>(allDynastyNames);
        sortedList.sort(Comparator.comparingInt(String::length).reversed());
        this.sortedDynasties = Collections.unmodifiableList(sortedList);

        // 60 干支列表初始化
        if (data.ganzhi() != null && data.ganzhi().size() == 60) {
            List<String> gz = new ArrayList<>(60);
            for (var item : data.ganzhi()) {
                gz.add(item.name());
            }
            this.ganzhiList = Collections.unmodifiableList(gz);
        } else {
            this.ganzhiList = GanzhiUtil.DEFAULT_GANZHI_LIST;
        }
    }

    /**
     * 从类路径默认位置加载全量基准数据集并构造实例
     *
     * @return ChronologyService 实例
     */
    public static ChronologyService createDefault() {
        try (InputStream is = ChronologyService.class.getResourceAsStream(DEFAULT_DATA_PATH)) {
            if (is == null) {
                throw new IllegalStateException("未能从 Classpath 加载默认纪年数据集: " + DEFAULT_DATA_PATH);
            }
            ChronologyDataset dataset = OBJECT_MAPPER.readValue(is, ChronologyDataset.class);
            return new ChronologyService(dataset);
        } catch (IOException e) {
            throw new IllegalStateException("读取默认纪年数据文件失败", e);
        }
    }

    /**
     * 判断目标朝代与年号记录所属朝代是否匹配（支持别名）
     */
    private static boolean matchDynasty(String target, String eraDynasty, String eraRawDynasty) {
        if (Objects.equals(target, eraDynasty) || (eraRawDynasty != null && Objects.equals(target, eraRawDynasty))) {
            return true;
        }

        // 1. 同义别名匹配（双向等价，如“曹魏”<=>“三国魏”、“民国”<=>“中华民国”）
        List<String> equiv = DYNASTY_EQUIVALENTS.get(target);
        if (equiv != null) {
            if (equiv.contains(eraDynasty) || (eraRawDynasty != null && equiv.contains(eraRawDynasty))) {
                return true;
            }
        }

        // 2. 父朝代向子朝代单向匹配（如 target="汉"，可匹配归属于西汉、东汉的年号）
        List<String> children = DYNASTY_CHILDREN.get(target);
        if (children != null) {
            if (children.contains(eraDynasty) || (eraRawDynasty != null && children.contains(eraRawDynasty))) {
                return true;
            }
        }

        return false;
    }

    // --- 1. 基础数据查询 ---

    public List<Dynasty> getDynasties() {
        return this.dynasties;
    }

    public List<Era> getEras() {
        return this.eras;
    }

    public List<Era> getEras(String dynastyName) {
        if (dynastyName == null || dynastyName.isEmpty()) {
            return this.eras;
        }
        List<Era> matched = new ArrayList<>();
        for (Era era : this.eras) {
            if (matchDynasty(dynastyName, era.dynastyName(), era.rawDynastyName())) {
                matched.add(era);
            }
        }
        return Collections.unmodifiableList(matched);
    }

    public List<String> getGanzhiList() {
        return this.ganzhiList;
    }

    // --- 2. 文本解析辅助函数 ---

    /**
     * 解析自然语言纪年字符串（如 "崇祯17年"、"明崇祯十七年"、"贞观元年"、"乾隆廿五年"）
     *
     * @param input 输入字符串
     * @return 解析后的年号查询结构
     * @throws IllegalArgumentException 当无法解析或格式不合法时抛出
     */
    public ParsedEraQuery parseEraString(String input) {
        if (input == null) {
            throw new IllegalArgumentException("无法匹配年号格式: \"null\"");
        }
        String trimmed = input.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("无法匹配年号格式: \"" + input + "\"");
        }

        // 若用户直接输入了纯年号或朝代+年号且无年份数字（含带'年'字），抛出明确异常，防止误吞
        String withoutNian = trimmed.endsWith("年")
                ? trimmed.substring(0, trimmed.length() - 1).trim()
                : trimmed;
        if (this.eraNamesSet.contains(trimmed) || this.eraNamesSet.contains(withoutNian)) {
            throw new IllegalArgumentException("输入缺少有效的年份数字: \"" + input + "\"");
        }
        for (String dName : this.sortedDynasties) {
            if (trimmed.startsWith(dName)) {
                String remaining = trimmed.substring(dName.length()).trim();
                if (this.eraNamesSet.contains(remaining)) {
                    throw new IllegalArgumentException("输入缺少有效的年份数字: \"" + input + "\"");
                }
            }
            if (withoutNian.startsWith(dName)) {
                String remaining = withoutNian.substring(dName.length()).trim();
                if (this.eraNamesSet.contains(remaining)) {
                    throw new IllegalArgumentException("输入缺少有效的年份数字: \"" + input + "\"");
                }
            }
        }

        // 正则切分：末尾带“年”或纯阿拉伯/中文数字
        Matcher matcher;
        if (trimmed.endsWith("年")) {
            matcher = PATTERN_WITH_YEAR.matcher(trimmed);
        } else {
            matcher = PATTERN_WITHOUT_YEAR.matcher(trimmed);
        }

        if (!matcher.matches()) {
            throw new IllegalArgumentException("无法匹配年号格式: \"" + input + "\"");
        }

        String prefix = matcher.group(1).trim();
        String yearStr = matcher.group(2);
        int eraYear = ChineseNumberUtil.parseEraYearNumber(yearStr);

        if (prefix.isEmpty()) {
            throw new IllegalArgumentException("输入缺少有效的年号名称: \"" + input + "\"");
        }

        // 情况 A: 前缀即为年号（如 "崇祯", "开元"）
        if (this.eraNamesSet.contains(prefix)) {
            return new ParsedEraQuery(null, prefix, eraYear);
        }

        // 情况 B: 前缀包含朝代（如 "明崇祯"、"曹魏黄初"、"晋泰始"、"武周天授"）
        for (String dName : this.sortedDynasties) {
            if (prefix.startsWith(dName)) {
                String remaining = prefix.substring(dName.length()).trim();
                if (this.eraNamesSet.contains(remaining)) {
                    return new ParsedEraQuery(dName, remaining, eraYear);
                }
            }
        }

        // 兜底返回前缀作为年号
        return new ParsedEraQuery(null, prefix, eraYear);
    }

    // --- 3. 公历与干支互转 ---

    public String gregorianToGanzhi(int year) {
        return GanzhiUtil.gregorianToGanzhi(year, this.ganzhiList);
    }

    public List<Integer> ganzhiToGregorian(String ganzhi, int startYear, int endYear) {
        return GanzhiUtil.ganzhiToGregorian(ganzhi, startYear, endYear, this.ganzhiList);
    }

    // --- 4. 公历与朝代年号互转 ---

    /**
     * 公历年查询朝代年号（同一年可能存在多个政权或改元并立）
     *
     * @param year 公历年份（无公元 0 年）
     * @return 匹配的年号列表
     */
    public List<EraMatchResult> gregorianToEra(int year) {
        if (year == 0) {
            throw new IllegalArgumentException("历史上无公元 0 年");
        }

        String ganzhi = this.gregorianToGanzhi(year);
        List<EraMatchResult> matches = new ArrayList<>();

        for (Era era : this.eras) {
            if (year >= era.startYear() && year <= era.endYear()) {
                int eraYearNum;
                // 跨公元前后无 0 年修正
                if (era.startYear() < 0 && year > 0) {
                    eraYearNum = year - era.startYear();
                } else {
                    eraYearNum = year - era.startYear() + 1;
                }

                String displayStr = eraYearNum == 1 ? "元" : String.valueOf(eraYearNum);

                matches.add(new EraMatchResult(
                        era.dynastyName(), era.name(), eraYearNum, era.name() + displayStr + "年", year, ganzhi));
            }
        }

        return Collections.unmodifiableList(matches);
    }

    /**
     * 自然语言年号转公历年份（如 "崇祯17年"、"明崇祯十七年"）
     *
     * @param input 自然语言字符串
     * @return 匹配结果列表
     */
    public List<GregorianMatchResult> eraToGregorian(String input) {
        ParsedEraQuery parsed = parseEraString(input);
        return eraToGregorian(parsed.eraName(), parsed.eraYear(), parsed.dynastyName());
    }

    /**
     * 年号转公历年
     *
     * @param eraName 年号名称
     * @param eraYear 年号第几年
     * @return 匹配结果列表
     */
    public List<GregorianMatchResult> eraToGregorian(String eraName, int eraYear) {
        return eraToGregorian(eraName, eraYear, null);
    }

    /**
     * 年号转公历年（带中文数字年份字符串双参数重载）
     *
     * @param eraName    年号名称
     * @param eraYearStr 年号第几年字符串（如 "二"、"元"、"十七"）
     * @return 匹配结果列表
     */
    public List<GregorianMatchResult> eraToGregorian(String eraName, String eraYearStr) {
        return eraToGregorian(eraName, eraYearStr, null);
    }

    /**
     * 年号转公历年（带中文数字年份字符串重载）
     *
     * @param eraName    年号名称
     * @param eraYearStr 年号第几年字符串（如 "二"、"元"）
     * @param dynastyName 朝代名称（可选）
     * @return 匹配结果列表
     */
    public List<GregorianMatchResult> eraToGregorian(String eraName, String eraYearStr, String dynastyName) {
        int eraYear = ChineseNumberUtil.parseEraYearNumber(eraYearStr);
        return eraToGregorian(eraName, eraYear, dynastyName);
    }

    /**
     * 年号转公历年（指定朝代消歧）
     *
     * @param eraName     年号名称
     * @param eraYear     年号第几年
     * @param dynastyName 朝代名称（可选）
     * @return 匹配结果列表
     */
    public List<GregorianMatchResult> eraToGregorian(String eraName, int eraYear, String dynastyName) {
        if (eraYear <= 0) {
            throw new IllegalArgumentException("非法的年号年份: " + eraYear);
        }

        List<Era> candidates = new ArrayList<>();
        for (Era era : this.eras) {
            if (era.name().equals(eraName)) {
                if (dynastyName == null || matchDynasty(dynastyName, era.dynastyName(), era.rawDynastyName())) {
                    candidates.add(era);
                }
            }
        }

        List<GregorianMatchResult> results = new ArrayList<>();
        for (Era era : candidates) {
            int calcYear = era.startYear() + eraYear - 1;

            // 跨越公元无 0 年修正
            if (era.startYear() < 0 && calcYear >= 0) {
                calcYear += 1;
            }

            if (calcYear <= era.endYear()) {
                results.add(new GregorianMatchResult(
                        calcYear, era.dynastyName(), era.name(), eraYear, this.gregorianToGanzhi(calcYear)));
            }
        }

        return Collections.unmodifiableList(results);
    }
}
