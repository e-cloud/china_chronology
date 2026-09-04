package io.github.ecloud.chronology.util;

import java.util.HashMap;
import java.util.Map;

/**
 * 中文数字与纪年年份解析工具类
 */
public final class ChineseNumberUtil {

    private static final Map<Character, Integer> CN_NUM_MAP = new HashMap<>();

    static {
        CN_NUM_MAP.put('零', 0);
        CN_NUM_MAP.put('一', 1);
        CN_NUM_MAP.put('二', 2);
        CN_NUM_MAP.put('两', 2);
        CN_NUM_MAP.put('三', 3);
        CN_NUM_MAP.put('四', 4);
        CN_NUM_MAP.put('五', 5);
        CN_NUM_MAP.put('六', 6);
        CN_NUM_MAP.put('七', 7);
        CN_NUM_MAP.put('八', 8);
        CN_NUM_MAP.put('九', 9);
    }

    private ChineseNumberUtil() {
    }

    /**
     * 将中文纪年数字或阿拉伯数字解析为正整数
     *
     * @param yearStr 待解析字符串
     * @return 解析后的年份整数
     * @throws IllegalArgumentException 当字符串无法识别时抛出
     */
    public static int parseEraYearNumber(String yearStr) {
        if (yearStr == null) {
            throw new IllegalArgumentException("无法识别年份数字: null");
        }

        String trimmed = yearStr.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("无法识别年份数字: \"\"");
        }

        if (trimmed.matches("^\\d+$")) {
            int val = Integer.parseInt(trimmed);
            if (val <= 0) {
                throw new IllegalArgumentException("非法的年号年份: \"" + yearStr + "\"");
            }
            return val;
        }

        if ("元".equals(trimmed)) {
            return 1;
        }

        if ("零".equals(trimmed)) {
            throw new IllegalArgumentException("非法的年号年份: \"" + yearStr + "\"");
        }

        // 支持古典文献中的 "廿" (20) 与 "卅" (30)
        if ("廿".equals(trimmed)) {
            return 20;
        }
        if (trimmed.startsWith("廿") && trimmed.length() == 2) {
            Integer ones = CN_NUM_MAP.get(trimmed.charAt(1));
            if (ones != null && ones > 0) {
                return 20 + ones;
            }
        }

        if ("卅".equals(trimmed)) {
            return 30;
        }
        if (trimmed.startsWith("卅") && trimmed.length() == 2) {
            Integer ones = CN_NUM_MAP.get(trimmed.charAt(1));
            if (ones != null && ones > 0) {
                return 30 + ones;
            }
        }

        if ("十".equals(trimmed)) {
            return 10;
        }

        if (trimmed.contains("十")) {
            String[] parts = trimmed.split("十", -1);
            if (parts.length == 2) {
                String tensPart = parts[0];
                String onesPart = parts[1];

                int tens = 1;
                if (!tensPart.isEmpty()) {
                    if (tensPart.length() != 1 || !CN_NUM_MAP.containsKey(tensPart.charAt(0))) {
                        throw new IllegalArgumentException("无法识别年份数字: \"" + yearStr + "\"");
                    }
                    tens = CN_NUM_MAP.get(tensPart.charAt(0));
                }

                int ones = 0;
                if (!onesPart.isEmpty()) {
                    if (onesPart.length() != 1 || !CN_NUM_MAP.containsKey(onesPart.charAt(0))) {
                        throw new IllegalArgumentException("无法识别年份数字: \"" + yearStr + "\"");
                    }
                    ones = CN_NUM_MAP.get(onesPart.charAt(0));
                }

                if (tens >= 0 && ones >= 0) {
                    return tens * 10 + ones;
                }
            }
            throw new IllegalArgumentException("无法识别年份数字: \"" + yearStr + "\"");
        }

        if (trimmed.length() == 1) {
            Integer single = CN_NUM_MAP.get(trimmed.charAt(0));
            if (single != null && single > 0) {
                return single;
            }
        }

        throw new IllegalArgumentException("无法识别年份数字: \"" + yearStr + "\"");
    }
}
