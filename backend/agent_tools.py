"""
NutriAI Agent Tools - 意图识别模块

解析用户自然语言，识别饮食相关意图：
- add_food:       新增饮食记录
- remove_food:    删除饮食记录
- query_nutrition: 查询营养摄入
- nutrition_advice: 请求营养建议
- chat:           普通聊天

使用 LLM 进行意图识别，API Key 不可用时使用规则匹配降级。
"""

import os
import re
import json
import logging
from dataclasses import dataclass, asdict
from typing import Optional

logger = logging.getLogger("nutriai.tools")


# ============================================================
# 意图识别 Prompt
# ============================================================

INTENT_SYSTEM_PROMPT = """你是一个饮食记录助手的意图识别模块。

根据用户消息，识别用户意图并返回 JSON。

支持的 action：
- add_food: 用户想记录/添加吃了什么食物
- remove_food: 用户想删除/取消某条饮食记录
- query_nutrition: 用户想查询今天的营养摄入情况
- nutrition_advice: 用户想要饮食建议/分析
- chat: 普通聊天，不属于以上任何意图

返回 JSON 格式（不要 markdown 标记）：
{
  "action": "add_food",
  "foodName": "奶茶",
  "amount": "1杯",
  "confidence": 0.95
}

规则：
1. foodName 只在 add_food / remove_food 时有值
2. amount 提取数量和单位（如 "1杯"、"2个"、"半碗"），无法确定时为空字符串
3. confidence: 0-1 的浮点数，表示识别置信度
4. 只返回 JSON，不要其他文字
"""

# ============================================================
# 规则匹配（降级方案）
# ============================================================

# 添加食物关键词
ADD_KEYWORDS = [
    "吃了", "喝了", "刚刚", "刚才", "记录", "添加", "记一下", "帮我记",
    "吃了点", "喝了点", "加个", "加一份", "来了一", "来了个",
    "吃了1", "吃了2", "吃了一个", "喝了一杯",
]

# 删除食物关键词
REMOVE_KEYWORDS = [
    "删除", "取消", "去掉", "移除", "删掉", "不要了", "撤销",
    "删一下", "取消记录", "去掉那个",
]

# 查询营养关键词
QUERY_KEYWORDS = [
    "营养", "摄入", "达标", "多少", "热量", "蛋白质",
    "碳水", "脂肪", "今天吃了多少", "还剩多少",
    "还差多少", "卡路里", "查询", "查看",
]

# 建议关键词
ADVICE_KEYWORDS = [
    "建议", "分析", "推荐", "下一餐", "吃什么",
    "怎么样", "好不好", "可以吗", "评价", "帮我看",
]


def _extract_food_name(message: str) -> str:
    """从消息中提取食物名称"""
    # 尝试匹配 "吃了XX" / "喝了XX" 后面的食物
    patterns = [
        r'(?:吃了|喝了|吃了点|喝了点|来了一|来了个|吃了个|喝了个|加个|加一份|记录一下|记一下|帮我记)\s*(?:一|半|两|三|四|五|六|七|八|九|十)?\s*(?:个|杯|碗|份|块|根|片|把|串|盘|瓶|罐|顿)?(.{1,10})',
    ]
    for p in patterns:
        m = re.search(p, message)
        if m:
            food = m.group(1).strip()
            # 清理尾部
            food = re.sub(r'[，。！？的了去着过]', '', food).strip()
            if food:
                return food

    # 尝试匹配引号内的内容
    m = re.search(r'[「"\'"](.+?)[」"\'"]', message)
    if m:
        return m.group(1).strip()

    return ""


def _extract_amount(message: str) -> str:
    """从消息中提取数量"""
    patterns = [
        r'(\d+[个杯碗份块根片把串盘瓶罐顿]+)',
        r'(半[个杯碗份块根片把])',
        r'(一两|二两|三两|半斤|一斤)',
        r'(\d+)\s*(份|碗|杯|个|块|根)',
    ]
    for p in patterns:
        m = re.search(p, message)
        if m:
            return m.group(1) if m.lastindex else m.group(0)
    return ""


def parse_user_intent_rule(message: str) -> dict:
    """规则匹配识别意图（降级方案）"""
    msg = message.lower().strip()

    # 检查删除意图
    for kw in REMOVE_KEYWORDS:
        if kw in msg:
            food = _extract_food_name(message)
            return {
                "action": "remove_food",
                "foodName": food,
                "amount": "",
                "confidence": 0.7,
            }

    # 检查查询营养意图
    for kw in QUERY_KEYWORDS:
        if kw in msg:
            return {
                "action": "query_nutrition",
                "foodName": "",
                "amount": "",
                "confidence": 0.75,
            }

    # 检查建议意图
    for kw in ADVICE_KEYWORDS:
        if kw in msg:
            return {
                "action": "nutrition_advice",
                "foodName": "",
                "amount": "",
                "confidence": 0.75,
            }

    # 检查添加食物意图
    for kw in ADD_KEYWORDS:
        if kw in msg:
            food = _extract_food_name(message)
            amount = _extract_amount(message)
            return {
                "action": "add_food",
                "foodName": food,
                "amount": amount,
                "confidence": 0.8,
            }

    # 默认: 普通聊天
    return {
        "action": "chat",
        "foodName": "",
        "amount": "",
        "confidence": 0.5,
    }


def parse_user_intent_llm(message: str, api_key: str, model: str = "qwen-plus") -> dict:
    """使用 LLM 识别意图"""
    try:
        import dashscope
    except ImportError:
        raise RuntimeError("dashscope SDK 未安装")

    dashscope.api_key = api_key

    messages = [
        {"role": "system", "content": INTENT_SYSTEM_PROMPT},
        {"role": "user", "content": f"用户消息: {message}"},
    ]

    response = dashscope.Generation.call(
        model=model,
        messages=messages,
        result_format="message",
    )

    if response.status_code != 200:
        raise RuntimeError(f"LLM 调用失败: {response.status_code} - {response.message}")

    content = response.output.choices[0].message.content
    logger.info("[INTENT] LLM 原始回复: %s", content[:200])

    # 解析 JSON
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # 尝试提取 JSON 块
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            return json.loads(match.group(0))
        raise


# ============================================================
# 公开 API
# ============================================================

def parse_user_intent(message: str) -> dict:
    """
    解析用户意图

    Args:
        message: 用户自然语言消息

    Returns:
        { action, foodName, amount, confidence }
        action: add_food | remove_food | query_nutrition | nutrition_advice | chat
    """
    api_key = os.environ.get("DASHSCOPE_API_KEY", "")

    logger.info("[INTENT] 解析消息: %s", message)

    # 尝试 LLM 识别
    if api_key:
        try:
            result = parse_user_intent_llm(message, api_key)
            logger.info("[INTENT] LLM 识别结果: action=%s, foodName=%s, confidence=%s",
                        result.get("action"), result.get("foodName"), result.get("confidence"))
            return result
        except Exception as e:
            logger.warning("[INTENT] LLM 识别失败: %s，降级至规则匹配", str(e))

    # 降级至规则匹配
    result = parse_user_intent_rule(message)
    logger.info("[INTENT] 规则匹配结果: action=%s, foodName=%s, confidence=%s",
                result["action"], result["foodName"], result["confidence"])
    return result
