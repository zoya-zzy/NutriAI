"""
NutriAI 视觉模型调用模块

支持多模态视觉模型接口，默认使用 Qwen-VL-Plus (DashScope SDK)。
可降级至 Mock 模式用于开发测试。
"""

import os
import json
import base64
import random
import logging
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Optional

logger = logging.getLogger("nutriai.model")


@dataclass
class FoodRecognitionResult:
    """食物识别结果数据结构"""
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    confidence: float
    emoji: str = ""
    recognized_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


# ============================================================
# Mock 数据 - 用于降级
# ============================================================

FOOD_DATABASE = [
    {"name": "Chicken Breast", "emoji": "🍗", "calories": 220, "protein": 40, "carbs": 0, "fat": 5},
    {"name": "Steak", "emoji": "🥩", "calories": 542, "protein": 52, "carbs": 0, "fat": 36},
    {"name": "Salmon Fillet", "emoji": "🐟", "calories": 208, "protein": 20, "carbs": 0, "fat": 13},
    {"name": "Caesar Salad", "emoji": "🥗", "calories": 180, "protein": 6, "carbs": 8, "fat": 15},
    {"name": "Pasta with Tomato Sauce", "emoji": "🍝", "calories": 320, "protein": 11, "carbs": 58, "fat": 5},
    {"name": "Fried Rice", "emoji": "🍚", "calories": 350, "protein": 8, "carbs": 55, "fat": 12},
    {"name": "Sushi Roll", "emoji": "🍣", "calories": 280, "protein": 10, "carbs": 42, "fat": 6},
    {"name": "Pizza", "emoji": "🍕", "calories": 450, "protein": 18, "carbs": 60, "fat": 14},
    {"name": "Burger", "emoji": "🍔", "calories": 540, "protein": 25, "carbs": 45, "fat": 28},
    {"name": "Sandwich", "emoji": "🥪", "calories": 320, "protein": 14, "carbs": 38, "fat": 11},
    {"name": "Omelette", "emoji": "🍳", "calories": 215, "protein": 15, "carbs": 2, "fat": 16},
    {"name": "Pancakes", "emoji": "🥞", "calories": 340, "protein": 10, "carbs": 55, "fat": 9},
    {"name": "Toast with Avocado", "emoji": "🥑", "calories": 290, "protein": 8, "carbs": 35, "fat": 14},
    {"name": "Greek Yogurt", "emoji": "🥛", "calories": 100, "protein": 17, "carbs": 6, "fat": 0.4},
    {"name": "Banana", "emoji": "🍌", "calories": 105, "protein": 1.3, "carbs": 27, "fat": 0.4},
    {"name": "Apple", "emoji": "🍎", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3},
    {"name": "Orange", "emoji": "🍊", "calories": 62, "protein": 1.2, "carbs": 15, "fat": 0.2},
    {"name": "Mixed Berries", "emoji": "🫐", "calories": 85, "protein": 1.1, "carbs": 21, "fat": 0.5},
    {"name": "Green Tea", "emoji": "🍵", "calories": 2, "protein": 0, "carbs": 0, "fat": 0},
    {"name": "Coffee with Cream", "emoji": "☕", "calories": 52, "protein": 0.8, "carbs": 0.5, "fat": 5.4},
]


def recognize_food_mock(image_bytes: bytes) -> FoodRecognitionResult:
    """Mock 食物识别 - 从预设食物库随机返回结果。"""
    food = random.choice(FOOD_DATABASE)
    variance = 0.9 + random.random() * 0.2
    confidence = round(0.90 + random.random() * 0.10, 2)
    
    return FoodRecognitionResult(
        food_name=food["name"],
        calories=round(food["calories"] * variance),
        protein=round(food["protein"] * variance),
        carbs=round(food["carbs"] * variance),
        fat=round(food["fat"] * variance),
        confidence=confidence,
        emoji=food["emoji"],
        recognized_at=datetime.now().isoformat()
    )


# ============================================================
# Qwen-VL-Plus 真实模型调用 (DashScope SDK)
# ============================================================

QWEN_VL_PROMPT = """请识别图片中的食物，并返回JSON格式：
{
    "foodName": "食物英文名称",
    "calories": 卡路里数量,
    "protein": 蛋白质克数,
    "carbs": 碳水化合物克数,
    "fat": 脂肪克数,
    "confidence": 置信度(0-1)
}
如果无法确定，请返回最可能结果。只返回JSON，不要其他内容。"""


def recognize_food_qwen_vl_plus(image_bytes: bytes, api_key: str) -> FoodRecognitionResult:
    """
    使用 DashScope SDK 调用 qwen-vl-plus 多模态视觉模型进行食物识别。
    
    文档: https://help.aliyun.com/zh/model-studio/developer-reference/multimodal-generation
    """
    try:
        import dashscope
    except ImportError:
        raise RuntimeError("未安装 dashscope SDK，请运行: pip install dashscope")
    
    if not api_key:
        raise RuntimeError("DASHSCOPE_API_KEY 未配置")
    
    logger.info("[QWEN-VL-PLUS] 设置 API Key, 长度=%d", len(api_key))
    dashscope.api_key = api_key
    
    # 将图片编码为 base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    image_url = f"data:image/jpeg;base64,{image_b64}"
    logger.info("[QWEN-VL-PLUS] 图片 base64 编码完成, 大小=%d bytes", len(image_bytes))
    
    # 构造多模态消息
    messages = [
        {
            "role": "user",
            "content": [
                {"image": image_url},
                {"text": QWEN_VL_PROMPT}
            ]
        }
    ]
    
    # 调用 qwen-vl-plus 模型 (DashScope SDK MultiModalConversation)
    logger.info("[QWEN-VL-PLUS] 正在调用 dashscope.MultiModalConversation.call(model=qwen-vl-plus)...")
    response = dashscope.MultiModalConversation.call(
        model='qwen-vl-plus',
        messages=messages
    )
    logger.info("[QWEN-VL-PLUS] 收到响应: status_code=%s", response.status_code)
    
    # 处理响应
    if response.status_code != 200:
        logger.error("[QWEN-VL-PLUS] 模型调用失败: status=%s, message=%s", response.status_code, response.message)
        raise RuntimeError(f"模型调用失败: HTTP {response.status_code} - {response.message}")
    
    # 提取模型回复文本
    try:
        content = response.output.choices[0].message.content[0]['text']
        logger.info("[QWEN-VL-PLUS] 模型原始回复: %s", content[:300])
    except (IndexError, KeyError, TypeError) as e:
        logger.error("[QWEN-VL-PLUS] 无法提取回复文本: %s", e)
        raise RuntimeError(f"无法解析模型响应: {e}")
    
    # 解析 JSON
    result = _parse_model_json(content)
    
    # 如果 JSON 解析失败（返回默认值），说明模型返回了自然语言
    if result.get("foodName") == "Unknown Food" and result.get("confidence") == 0.3:
        logger.warning("[QWEN-VL-PLUS] 模型未返回JSON格式，返回自然语言描述")
        # 将模型回复作为 foodName，让用户知道模型说了什么
        return FoodRecognitionResult(
            food_name=content[:50] + "..." if len(content) > 50 else content,
            calories=0,
            protein=0,
            carbs=0,
            fat=0,
            confidence=0.1,
            emoji="❓",
            recognized_at=datetime.now().isoformat()
        )
    
    food_name = result.get("foodName", result.get("food_name", "Unknown Food"))
    logger.info("[QWEN-VL-PLUS] 识别成功: %s, calories=%s", food_name, result.get("calories"))
    
    return FoodRecognitionResult(
        food_name=food_name,
        calories=float(result.get("calories", 0)),
        protein=float(result.get("protein", 0)),
        carbs=float(result.get("carbs", 0)),
        fat=float(result.get("fat", 0)),
        confidence=float(result.get("confidence", 0.5)),
        emoji="🍽️",
        recognized_at=datetime.now().isoformat()
    )


# ============================================================
# HTTP API 方式 (备用，无需 SDK 时使用)
# ============================================================

def recognize_food_qwen_vl_http(image_bytes: bytes, api_key: str, model: str = "qwen-vl-max") -> FoodRecognitionResult:
    """
    使用 HTTP API 调用阿里云百炼视觉模型。
    
    文档: https://help.aliyun.com/zh/model-studio/developer-reference/vision
    """
    try:
        import requests
    except ImportError:
        raise RuntimeError("请安装 requests: pip install requests")
    
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    
    prompt = QWEN_VL_PROMPT
    
    url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"image": f"data:image/jpeg;base64,{image_b64}"},
                        {"text": prompt}
                    ]
                }
            ]
        }
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    
    content = data.get("output", {}).get("choices", [{}])[0].get("message", {}).get("content", "")
    result = _parse_model_json(content)
    
    return FoodRecognitionResult(
        food_name=result.get("foodName", result.get("food_name", "Unknown Food")),
        calories=float(result.get("calories", 0)),
        protein=float(result.get("protein", 0)),
        carbs=float(result.get("carbs", 0)),
        fat=float(result.get("fat", 0)),
        confidence=float(result.get("confidence", 0.5)),
        emoji="🍽️",
        recognized_at=datetime.now().isoformat()
    )


# ============================================================
# 工具函数
# ============================================================

def _parse_model_json(content: str) -> dict:
    """从模型输出中提取并解析 JSON。"""
    json_str = content.strip()
    
    # 处理 markdown 代码块
    if "```json" in json_str:
        json_str = json_str.split("```json")[1].split("```")[0].strip()
    elif "```" in json_str:
        json_str = json_str.split("```")[1].split("```")[0].strip()
    
    # 尝试直接解析
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    # 尝试提取第一个 { 到最后一个 }
    start = json_str.find('{')
    end = json_str.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(json_str[start:end+1])
        except json.JSONDecodeError:
            pass
    
    # 最后手段：返回默认值
    logger.warning(f"无法解析模型输出为 JSON: {content[:200]}")
    return {
        "foodName": "Unknown Food",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "confidence": 0.3
    }


# ============================================================
# 统一入口
# ============================================================

def recognize_food(image_bytes: bytes) -> FoodRecognitionResult:
    """
    统一食物识别入口。
    
    根据环境变量 NUTRI_AI_MODEL 选择模型后端：
    - mock            : Mock 数据（默认，用于开发测试）
    - qwen-vl-plus    : DashScope SDK 调用 qwen-vl-plus
    - qwen-vl-max     : HTTP API 调用 qwen-vl-max
    - qwen-vl         : 别名，同 qwen-vl-max
    
    注意：配置为真实模型时，调用失败会抛出异常（不再静默降级到 Mock）。
    """
    model_type = os.environ.get("NUTRI_AI_MODEL", "mock").lower()
    api_key = os.environ.get("DASHSCOPE_API_KEY", "")
    
    logger.info("[MODEL] ===== 识别流程开始 =====")
    logger.info("[MODEL] 配置模型: %s", model_type)
    logger.info("[MODEL] API Key: %s", '已配置' if api_key else '未配置')
    
    if model_type == "mock":
        logger.info("[MODEL] 进入 Mock 分支")
        result = recognize_food_mock(image_bytes)
        logger.info("[MODEL] 结果来源: Mock 数据库")
        return result
    
    if not api_key:
        logger.error("[MODEL] DASHSCOPE_API_KEY 未配置，无法调用真实模型")
        raise RuntimeError("DASHSCOPE_API_KEY 未配置，无法使用真实模型。请在 backend/.env 中设置。")
    
    if model_type == "qwen-vl-plus":
        logger.info("[MODEL] 进入 qwen-vl-plus 分支 (DashScope SDK)")
        result = recognize_food_qwen_vl_plus(image_bytes, api_key)
        logger.info("[MODEL] 结果来源: Qwen-VL-Plus 真实模型")
        logger.info("[MODEL] ===== 识别流程结束 =====")
        return result
    
    elif model_type in ("qwen-vl", "qwen-vl-max"):
        logger.info("[MODEL] 进入 qwen-vl-max 分支 (HTTP API)")
        result = recognize_food_qwen_vl_http(image_bytes, api_key, model="qwen-vl-max")
        logger.info("[MODEL] 结果来源: Qwen-VL-Max 真实模型")
        logger.info("[MODEL] ===== 识别流程结束 =====")
        return result
    
    else:
        logger.error("[MODEL] 未知模型类型: %s", model_type)
        raise RuntimeError(f"未知模型类型: {model_type}。可选: mock / qwen-vl-plus / qwen-vl-max")
