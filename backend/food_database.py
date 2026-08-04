"""
NutriAI Food Database - 食物营养估算模块

提供常见食物的营养数据（每份）。
用于自然语言饮食记录时快速估算营养摄入。
"""

import logging

logger = logging.getLogger("nutriai.food_db")


# ============================================================
# 常见食物营养数据库（每份）
# ============================================================

FOOD_DATABASE = {
    # ---- 饮品 ----
    "奶茶": {"calories": 350, "protein": 5, "carbs": 55, "fat": 10, "emoji": "🧋", "unit": "杯"},
    "牛奶": {"calories": 150, "protein": 8, "carbs": 12, "fat": 8, "emoji": "🥛", "unit": "杯"},
    "豆浆": {"calories": 80, "protein": 7, "carbs": 4, "fat": 4, "emoji": "🥛", "unit": "杯"},
    "咖啡": {"calories": 5, "protein": 0, "carbs": 1, "fat": 0, "emoji": "☕", "unit": "杯"},
    "拿铁": {"calories": 190, "protein": 10, "carbs": 18, "fat": 7, "emoji": "☕", "unit": "杯"},
    "果汁": {"calories": 120, "protein": 1, "carbs": 28, "fat": 0, "emoji": "🧃", "unit": "杯"},
    "可乐": {"calories": 180, "protein": 0, "carbs": 45, "fat": 0, "emoji": "🥤", "unit": "罐"},
    "啤酒": {"calories": 150, "protein": 2, "carbs": 13, "fat": 0, "emoji": "🍺", "unit": "瓶"},
    "酸奶": {"calories": 150, "protein": 15, "carbs": 12, "fat": 3, "emoji": "🥛", "unit": "杯"},
    "绿茶": {"calories": 2, "protein": 0, "carbs": 0, "fat": 0, "emoji": "🍵", "unit": "杯"},
    "柠檬水": {"calories": 15, "protein": 0, "carbs": 4, "fat": 0, "emoji": "🍋", "unit": "杯"},

    # ---- 主食 ----
    "米饭": {"calories": 200, "protein": 4, "carbs": 44, "fat": 0, "emoji": "🍚", "unit": "碗"},
    "面条": {"calories": 280, "protein": 9, "carbs": 55, "fat": 2, "emoji": "🍜", "unit": "碗"},
    "面包": {"calories": 250, "protein": 8, "carbs": 45, "fat": 4, "emoji": "🍞", "unit": "片"},
    "馒头": {"calories": 220, "protein": 7, "carbs": 47, "fat": 1, "emoji": "🥖", "unit": "个"},
    "包子": {"calories": 230, "protein": 8, "carbs": 40, "fat": 5, "emoji": "🥟", "unit": "个"},
    "饺子": {"calories": 250, "protein": 10, "carbs": 35, "fat": 8, "emoji": "🥟", "unit": "份"},
    "粥": {"calories": 100, "protein": 2, "carbs": 22, "fat": 0, "emoji": "🥣", "unit": "碗"},
    "燕麦": {"calories": 150, "protein": 6, "carbs": 27, "fat": 3, "emoji": "🥣", "unit": "碗"},
    "玉米": {"calories": 110, "protein": 4, "carbs": 24, "fat": 1, "emoji": "🌽", "unit": "根"},
    "红薯": {"calories": 130, "protein": 2, "carbs": 30, "fat": 0, "emoji": "🍠", "unit": "个"},
    "意面": {"calories": 350, "protein": 12, "carbs": 65, "fat": 3, "emoji": "🍝", "unit": "份"},
    "炒饭": {"calories": 400, "protein": 10, "carbs": 60, "fat": 12, "emoji": "🍚", "unit": "份"},
    "寿司": {"calories": 200, "protein": 8, "carbs": 38, "fat": 2, "emoji": "🍣", "unit": "份"},

    # ---- 肉类 ----
    "鸡胸肉": {"calories": 220, "protein": 40, "carbs": 0, "fat": 5, "emoji": "🍗", "unit": "份"},
    "鸡腿": {"calories": 280, "protein": 25, "carbs": 0, "fat": 18, "emoji": "🍗", "unit": "个"},
    "牛排": {"calories": 350, "protein": 40, "carbs": 0, "fat": 20, "emoji": "🥩", "unit": "份"},
    "猪排": {"calories": 400, "protein": 30, "carbs": 5, "fat": 28, "emoji": "🥩", "unit": "份"},
    "火腿": {"calories": 150, "protein": 20, "carbs": 2, "fat": 7, "emoji": "🍖", "unit": "片"},
    "培根": {"calories": 90, "protein": 5, "carbs": 0, "fat": 8, "emoji": "🥓", "unit": "片"},
    "炸鸡": {"calories": 450, "protein": 25, "carbs": 20, "fat": 30, "emoji": "🍗", "unit": "份"},
    "烤肉": {"calories": 380, "protein": 30, "carbs": 5, "fat": 25, "emoji": "🍖", "unit": "份"},
    "汉堡": {"calories": 550, "protein": 25, "carbs": 45, "fat": 30, "emoji": "🍔", "unit": "个"},
    "热狗": {"calories": 290, "protein": 10, "carbs": 25, "fat": 17, "emoji": "🌭", "unit": "个"},

    # ---- 海鲜 ----
    "三文鱼": {"calories": 280, "protein": 25, "carbs": 0, "fat": 18, "emoji": "🐟", "unit": "份"},
    "虾仁": {"calories": 100, "protein": 24, "carbs": 0, "fat": 1, "emoji": "🦐", "unit": "份"},
    "鱼": {"calories": 200, "protein": 30, "carbs": 0, "fat": 8, "emoji": "🐟", "unit": "份"},
    "螃蟹": {"calories": 150, "protein": 20, "carbs": 2, "fat": 6, "emoji": "🦀", "unit": "只"},
    "鱿鱼": {"calories": 175, "protein": 28, "carbs": 4, "fat": 5, "emoji": "🦑", "unit": "份"},

    # ---- 蛋类 ----
    "鸡蛋": {"calories": 70, "protein": 6, "carbs": 1, "fat": 5, "emoji": "🥚", "unit": "个"},
    "煎蛋": {"calories": 90, "protein": 6, "carbs": 1, "fat": 7, "emoji": "🍳", "unit": "个"},
    "蛋羹": {"calories": 120, "protein": 10, "carbs": 3, "fat": 7, "emoji": "🥚", "unit": "碗"},

    # ---- 蔬菜 ----
    "西兰花": {"calories": 55, "protein": 4, "carbs": 11, "fat": 1, "emoji": "🥦", "unit": "份"},
    "菠菜": {"calories": 30, "protein": 3, "carbs": 5, "fat": 0, "emoji": "🥬", "unit": "份"},
    "生菜": {"calories": 15, "protein": 1, "carbs": 3, "fat": 0, "emoji": "🥬", "unit": "份"},
    "番茄": {"calories": 25, "protein": 1, "carbs": 6, "fat": 0, "emoji": "🍅", "unit": "个"},
    "黄瓜": {"calories": 15, "protein": 1, "carbs": 3, "fat": 0, "emoji": "🥒", "unit": "根"},
    "胡萝卜": {"calories": 40, "protein": 1, "carbs": 10, "fat": 0, "emoji": "🥕", "unit": "根"},
    "沙拉": {"calories": 150, "protein": 5, "carbs": 15, "fat": 8, "emoji": "🥗", "unit": "份"},
    "土豆": {"calories": 160, "protein": 4, "carbs": 37, "fat": 0, "emoji": "🥔", "unit": "个"},

    # ---- 水果 ----
    "苹果": {"calories": 80, "protein": 0, "carbs": 21, "fat": 0, "emoji": "🍎", "unit": "个"},
    "香蕉": {"calories": 110, "protein": 1, "carbs": 28, "fat": 0, "emoji": "🍌", "unit": "根"},
    "橙子": {"calories": 70, "protein": 1, "carbs": 17, "fat": 0, "emoji": "🍊", "unit": "个"},
    "葡萄": {"calories": 70, "protein": 1, "carbs": 18, "fat": 0, "emoji": "🍇", "unit": "串"},
    "西瓜": {"calories": 30, "protein": 1, "carbs": 8, "fat": 0, "emoji": "🍉", "unit": "块"},
    "草莓": {"calories": 35, "protein": 1, "carbs": 8, "fat": 0, "emoji": "🍓", "unit": "份"},
    "芒果": {"calories": 100, "protein": 1, "carbs": 25, "fat": 1, "emoji": "🥭", "unit": "个"},
    "牛油果": {"calories": 240, "protein": 3, "carbs": 12, "fat": 22, "emoji": "🥑", "unit": "个"},

    # ---- 零食/甜品 ----
    "蛋糕": {"calories": 320, "protein": 5, "carbs": 45, "fat": 14, "emoji": "🍰", "unit": "块"},
    "巧克力": {"calories": 230, "protein": 3, "carbs": 28, "fat": 13, "emoji": "🍫", "unit": "块"},
    "饼干": {"calories": 200, "protein": 3, "carbs": 30, "fat": 9, "emoji": "🍪", "unit": "片"},
    "薯片": {"calories": 300, "protein": 4, "carbs": 32, "fat": 18, "emoji": "🍟", "unit": "包"},
    "冰淇淋": {"calories": 210, "protein": 4, "carbs": 28, "fat": 10, "emoji": "🍦", "unit": "份"},
    "坚果": {"calories": 180, "protein": 6, "carbs": 6, "fat": 16, "emoji": "🥜", "unit": "把"},
    "花生": {"calories": 160, "protein": 7, "carbs": 5, "fat": 14, "emoji": "🥜", "unit": "把"},
    "瓜子": {"calories": 170, "protein": 7, "carbs": 5, "fat": 15, "emoji": "🌻", "unit": "把"},

    # ---- 中餐 ----
    "宫保鸡丁": {"calories": 380, "protein": 25, "carbs": 25, "fat": 20, "emoji": "🍛", "unit": "份"},
    "番茄炒蛋": {"calories": 220, "protein": 12, "carbs": 10, "fat": 14, "emoji": "🍳", "unit": "份"},
    "红烧肉": {"calories": 480, "protein": 20, "carbs": 15, "fat": 38, "emoji": "🍖", "unit": "份"},
    "麻婆豆腐": {"calories": 250, "protein": 15, "carbs": 12, "fat": 16, "emoji": "🍛", "unit": "份"},
    "鱼香肉丝": {"calories": 350, "protein": 18, "carbs": 28, "fat": 18, "emoji": "🍛", "unit": "份"},
    "炒青菜": {"calories": 100, "protein": 3, "carbs": 8, "fat": 6, "emoji": "🥬", "unit": "份"},
    "蛋炒饭": {"calories": 380, "protein": 10, "carbs": 55, "fat": 12, "emoji": "🍚", "unit": "份"},
    "牛肉面": {"calories": 450, "protein": 20, "carbs": 60, "fat": 15, "emoji": "🍜", "unit": "碗"},
    "馄饨": {"calories": 260, "protein": 12, "carbs": 35, "fat": 7, "emoji": "🥟", "unit": "碗"},
    "火锅": {"calories": 600, "protein": 30, "carbs": 40, "fat": 35, "emoji": "🍲", "unit": "顿"},

    # ---- 西餐/快餐 ----
    "披萨": {"calories": 285, "protein": 12, "carbs": 36, "fat": 10, "emoji": "🍕", "unit": "片"},
    "炸薯条": {"calories": 365, "protein": 4, "carbs": 48, "fat": 17, "emoji": "🍟", "unit": "份"},
    "沙拉酱": {"calories": 90, "protein": 0, "carbs": 2, "fat": 10, "emoji": "🥗", "unit": "勺"},
}


# ============================================================
# 别名映射（口语化 -> 标准名）
# ============================================================

ALIAS_MAP = {
    "波霸": "奶茶",
    "珍珠奶茶": "奶茶",
    "拿铁咖啡": "拿铁",
    "美式": "咖啡",
    "白米饭": "米饭",
    "白粥": "粥",
    "皮蛋瘦肉粥": "粥",
    "小米粥": "粥",
    "吐司": "面包",
    "烤面包": "面包",
    "鸡排": "炸鸡",
    "炸鸡翅": "炸鸡",
    "鸡块": "炸鸡",
    "青菜": "炒青菜",
    "白菜": "炒青菜",
    "土豆丝": "土豆",
    "薯条": "炸薯条",
    " fries": "炸薯条",
    "egg": "鸡蛋",
    "chicken": "鸡胸肉",
    "rice": "米饭",
    "noodle": "面条",
    "bread": "面包",
    "apple": "苹果",
    "banana": "香蕉",
    "coffee": "咖啡",
    "milk": "牛奶",
    "tea": "绿茶",
    "burger": "汉堡",
    "pizza": "披萨",
    "cake": "蛋糕",
}


def estimate_nutrition(food_name: str) -> dict:
    """
    根据食物名称估算营养数据

    Args:
        food_name: 食物名称（支持别名）

    Returns:
        { foodName, calories, protein, carbs, fat, emoji, unit, source }
    """
    name = food_name.strip()

    # 查别名
    resolved = ALIAS_MAP.get(name, name)

    # 精确匹配
    if resolved in FOOD_DATABASE:
        data = FOOD_DATABASE[resolved]
        logger.info("[FOOD_DB] 精确匹配: %s -> %s", food_name, resolved)
        return {
            "foodName": resolved,
            "calories": data["calories"],
            "protein": data["protein"],
            "carbs": data["carbs"],
            "fat": data["fat"],
            "emoji": data["emoji"],
            "unit": data["unit"],
            "source": "database",
        }

    # 模糊匹配
    for key, data in FOOD_DATABASE.items():
        if key in resolved or resolved in key:
            logger.info("[FOOD_DB] 模糊匹配: %s -> %s", food_name, key)
            return {
                "foodName": key,
                "calories": data["calories"],
                "protein": data["protein"],
                "carbs": data["carbs"],
                "fat": data["fat"],
                "emoji": data["emoji"],
                "unit": data["unit"],
                "source": "database_fuzzy",
            }

    # 未找到 - 返回默认估算值
    logger.info("[FOOD_DB] 未找到 %s，使用默认估算", food_name)
    return {
        "foodName": name,
        "calories": 200,
        "protein": 10,
        "carbs": 25,
        "fat": 7,
        "emoji": "🍽️",
        "unit": "份",
        "source": "estimated",
    }
