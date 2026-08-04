"""
NutriAI Nutrition Agent - 智能营养助手

根据用户健康画像、今日饮食记录、营养摄入状态，
调用 LLM 生成个性化饮食建议。

使用 DashScope SDK 调用 qwen-plus 文本模型。
API Key 缺失或调用失败时降级至 Mock 建议。
"""

import os
import json
import logging
from dataclasses import dataclass, asdict
from typing import Optional

from agent_tools import parse_user_intent
from food_database import estimate_nutrition

logger = logging.getLogger("nutriai.agent")


# ============================================================
# 数据结构
# ============================================================

@dataclass
class AdviceResult:
    """营养建议结果"""
    summary: str = ""
    analysis: str = ""
    warning: str = ""
    recommendation: str = ""
    source: str = "mock"  # "qwen-plus" | "mock"

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ChatResult:
    """聊天处理结果"""
    action: str = "chat"          # add_food | remove_food | query_nutrition | nutrition_advice | chat
    reply: str = ""               # AI 回复文本
    food_data: Optional[dict] = None  # add_food 时附带的营养数据
    advice: Optional[dict] = None     # nutrition_advice 时附带的建议
    nutrition: Optional[dict] = None  # query_nutrition 时附带的营养状态
    source: str = "mock"              # "qwen-plus" | "mock"

    def to_dict(self) -> dict:
        d = asdict(self)
        return d


# ============================================================
# Prompt 设计
# ============================================================

NUTRITIONIST_SYSTEM_PROMPT = """你是一名专业AI营养师，拥有丰富的临床营养学经验。

你的任务是根据用户的健康画像、今日饮食记录和营养摄入情况，提供个性化饮食建议。

请严格按照以下JSON格式返回（不要包含markdown代码块标记）：

{
  "summary": "一句话总结今日饮食状况",
  "analysis": "营养摄入分析，包括热量/蛋白质/碳水/脂肪的达标情况",
  "warning": "营养不足或过量的提醒，没有则为空字符串",
  "recommendation": "下一餐的具体推荐，包括建议食物和理由"
}

要求：
1. 语气温暖、专业、有陪伴感
2. 建议具体可执行，不要泛泛而谈
3. 考虑用户的健康目标（减重/增肌/维持/健康）
4. 如果热量缺口过大，提醒用户不要节食
5. 如果蛋白质不足，推荐高蛋白食物
6. 回复使用中文
"""


def build_user_prompt(user_profile: dict, diary: dict, nutrition_status: dict) -> str:
    """构造用户输入 Prompt"""
    meals = diary.get("meals", [])
    meals_text = "\n".join(
        f"  - {m.get('foodName', '未知')} | {m.get('calories', 0)} kcal | "
        f"蛋白质 {m.get('protein', 0)}g | 碳水 {m.get('carbs', 0)}g | "
        f"脂肪 {m.get('fat', 0)}g | 餐段: {m.get('mealType', '未知')} | 时间: {m.get('time', '未知')}"
        for m in meals
    ) if meals else "  （今日暂无饮食记录）"

    # 营养摄入情况
    def fmt_nutrient(key: str, label: str) -> str:
        n = nutrition_status.get(key, {})
        current = n.get("current", 0)
        target = n.get("target", 0)
        pct = f"{current / target * 100:.0f}%" if target > 0 else "N/A"
        return f"  {label}: {current} / {target} ({pct})"

    prompt = f"""请根据以下信息生成个性化饮食建议：

【用户健康画像】
  性别: {user_profile.get('gender', '未知')}
  年龄: {user_profile.get('age', '未知')}
  身高: {user_profile.get('height', '未知')} cm
  体重: {user_profile.get('weight', '未知')} kg
  目标: {user_profile.get('goal', '未知')}
  活动水平: {user_profile.get('activityLevel', '未知')}

【今日饮食记录】
{meals_text}

【今日营养摄入】
{fmt_nutrient('calories', '热量(kcal)')}
{fmt_nutrient('protein', '蛋白质(g)')}
{fmt_nutrient('carbs', '碳水(g)')}
{fmt_nutrient('fat', '脂肪(g)')}

请生成个性化饮食建议。"""

    return prompt


# ============================================================
# Mock 建议
# ============================================================

def generate_mock_advice(user_profile: dict, diary: dict, nutrition_status: dict) -> AdviceResult:
    """生成 Mock 建议（API Key 不可用时降级使用）"""
    meals = diary.get("meals", [])
    cal = nutrition_status.get("calories", {})
    pro = nutrition_status.get("protein", {})
    cal_current = cal.get("current", 0)
    cal_target = cal.get("target", 1600)
    pro_current = pro.get("current", 0)
    pro_target = pro.get("target", 90)
    goal = user_profile.get("goal", "healthy")

    # 热量分析
    if cal_current < cal_target * 0.5:
        summary = f"今日热量摄入偏低，仅完成 {cal_current}/{cal_target} kcal"
        warning = "热量摄入不足，长期可能导致代谢下降，建议适当增加健康碳水摄入"
    elif cal_current > cal_target * 1.1:
        summary = f"今日热量摄入偏高，已达 {cal_current}/{cal_target} kcal"
        warning = f"热量超出目标，建议下一餐选择低热量高蛋白食物"
    else:
        summary = f"今日热量摄入合理，{cal_current}/{cal_target} kcal"
        warning = ""

    # 蛋白质分析
    pro_pct = f"{pro_current / pro_target * 100:.0f}%" if pro_target > 0 else "N/A"
    analysis = f"蛋白质摄入 {pro_current}g/{pro_target}g ({pro_pct})，"

    if pro_current < pro_target * 0.7:
        analysis += "蛋白质不足，建议补充鸡胸肉、鸡蛋或豆制品"
    elif pro_current >= pro_target:
        analysis += "蛋白质达标，肌肉修复良好"
    else:
        analysis += "蛋白质接近目标，可适当补充"

    # 下一餐推荐
    if goal == "weight_loss":
        recommendation = "下一餐建议：一份水煮鸡胸肉沙拉 + 半个牛油果，约 350 kcal，高蛋白低脂"
    elif goal == "muscle_gain":
        recommendation = "下一餐建议：糙米饭 + 煎三文鱼 + 西兰花，约 500 kcal，高蛋白优质脂肪"
    elif goal == "maintenance":
        recommendation = "下一餐建议：全麦意面 + 番茄牛肉酱 + 蔬菜汤，约 450 kcal，营养均衡"
    else:
        recommendation = "下一餐建议：杂粮饭 + 清蒸鱼 + 凉拌菠菜，约 400 kcal，清淡健康"

    return AdviceResult(
        summary=summary,
        analysis=analysis,
        warning=warning,
        recommendation=recommendation,
        source="mock",
    )


# ============================================================
# Nutrition Agent
# ============================================================

class NutritionAgent:
    """智能营养助手 Agent"""

    def __init__(self):
        self.api_key = os.environ.get("DASHSCOPE_API_KEY", "")
        self.model = os.environ.get("NUTRI_AI_AGENT_MODEL", "qwen-plus")
        logger.info("[AGENT] NutritionAgent 初始化")
        logger.info("[AGENT] 模型: %s", self.model)
        logger.info("[AGENT] API Key: %s", '已配置' if self.api_key else '未配置')

    def generate_advice(self, user_profile: dict, diary: dict, nutrition_status: dict) -> AdviceResult:
        """
        生成个性化饮食建议

        Args:
            user_profile: 用户健康画像 { gender, age, height, weight, goal, activityLevel }
            diary: 今日饮食记录 { meals: [...] }
            nutrition_status: 营养摄入 { calories: {current, target}, protein: {...}, ... }

        Returns:
            AdviceResult: { summary, analysis, warning, recommendation }
        """
        logger.info("[AGENT] ===== 生成建议开始 =====")
        logger.info("[AGENT] 用户目标: %s", user_profile.get("goal", "未知"))
        logger.info("[AGENT] 饮食记录: %d 条", len(diary.get("meals", [])))

        if not self.api_key:
            logger.warning("[AGENT] DASHSCOPE_API_KEY 未配置，使用 Mock 建议")
            result = generate_mock_advice(user_profile, diary, nutrition_status)
            logger.info("[AGENT] 结果来源: Mock")
            logger.info("[AGENT] ===== 生成建议结束 =====")
            return result

        try:
            result = self._call_qwen(user_profile, diary, nutrition_status)
            logger.info("[AGENT] 结果来源: Qwen-Plus 真实模型")
            logger.info("[AGENT] ===== 生成建议结束 =====")
            return result
        except Exception as e:
            logger.error("[AGENT] LLM 调用失败: %s，降级至 Mock", str(e))
            result = generate_mock_advice(user_profile, diary, nutrition_status)
            logger.info("[AGENT] 结果来源: Mock (降级)")
            logger.info("[AGENT] ===== 生成建议结束 =====")
            return result

    def _call_qwen(self, user_profile: dict, diary: dict, nutrition_status: dict) -> AdviceResult:
        """调用 DashScope qwen-plus 文本模型"""
        try:
            import dashscope
        except ImportError:
            raise RuntimeError("未安装 dashscope SDK")

        dashscope.api_key = self.api_key

        user_prompt = build_user_prompt(user_profile, diary, nutrition_status)
        logger.info("[AGENT] Prompt 构造完成, 长度=%d 字符", len(user_prompt))

        messages = [
            {"role": "system", "content": NUTRITIONIST_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

        logger.info("[AGENT] 正在调用 dashscope.Generation.call(model=%s)...", self.model)
        response = dashscope.Generation.call(
            model=self.model,
            messages=messages,
            result_format="message",
        )

        logger.info("[AGENT] 收到响应: status_code=%s", response.status_code)

        if response.status_code != 200:
            raise RuntimeError(f"模型调用失败: HTTP {response.status_code} - {response.message}")

        # 提取回复文本
        try:
            content = response.output.choices[0].message.content
            logger.info("[AGENT] 模型原始回复: %s", content[:300])
        except (IndexError, KeyError, TypeError) as e:
            raise RuntimeError(f"无法解析模型响应: {e}")

        # 解析 JSON
        result = self._parse_response(content)

        return AdviceResult(
            summary=result.get("summary", ""),
            analysis=result.get("analysis", ""),
            warning=result.get("warning", ""),
            recommendation=result.get("recommendation", ""),
            source="qwen-plus",
        )

    def _parse_response(self, content: str) -> dict:
        """解析 LLM 返回的 JSON"""
        # 尝试直接解析
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        # 尝试提取 ```json ... ``` 代码块
        import re
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # 尝试提取 { ... } 块
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        logger.warning("[AGENT] JSON 解析失败，返回空结果")
        return {
            "summary": content[:100],
            "analysis": "",
            "warning": "",
            "recommendation": "",
        }

    # ============================================================
    # 自然语言处理 - 意图识别 + 工具调用
    # ============================================================

    def process_message(self, message: str, user_profile: dict, diary: dict, nutrition_status: dict) -> ChatResult:
        """
        处理用户自然语言消息

        1. 识别用户意图
        2. 执行对应操作
        3. 返回结构化结果

        Args:
            message: 用户消息
            user_profile: 用户画像
            diary: 今日饮食记录
            nutrition_status: 营养摄入

        Returns:
            ChatResult { action, reply, food_data, advice, nutrition, source }
        """
        logger.info("[AGENT] ===== 处理聊天消息 =====")
        logger.info("[AGENT] 消息: %s", message)

        # 1. 意图识别
        intent = parse_user_intent(message)
        action = intent.get("action", "chat")
        food_name = intent.get("foodName", "")
        amount = intent.get("amount", "")
        confidence = intent.get("confidence", 0)

        logger.info("[AGENT] 意图: action=%s, foodName=%s, amount=%s, confidence=%s",
                    action, food_name, amount, confidence)

        # 2. 根据意图执行操作
        if action == "add_food" and food_name:
            return self._handle_add_food(food_name, amount)

        elif action == "remove_food":
            return self._handle_remove_food(food_name, diary)

        elif action == "query_nutrition":
            return self._handle_query_nutrition(nutrition_status)

        elif action == "nutrition_advice":
            return self._handle_advice(user_profile, diary, nutrition_status)

        else:
            return self._handle_chat(message)

    def _handle_add_food(self, food_name: str, amount: str) -> ChatResult:
        """处理添加食物"""
        logger.info("[AGENT] 工具: estimate_nutrition(%s)", food_name)
        food_data = estimate_nutrition(food_name)

        amount_text = f"（{amount}）" if amount else ""
        reply = (
            f"已识别到食物：{food_data['emoji']} {food_data['foodName']}{amount_text}\n\n"
            f"营养估算：\n"
            f"  🔥 热量: {food_data['calories']} kcal\n"
            f"  💪 蛋白质: {food_data['protein']}g\n"
            f"  🌾 碳水: {food_data['carbs']}g\n"
            f"  🧈 脂肪: {food_data['fat']}g\n\n"
            f"已添加到今日饮食记录 ✅"
        )

        logger.info("[AGENT] 食物估算结果: %s, calories=%s", food_data["foodName"], food_data["calories"])

        return ChatResult(
            action="add_food",
            reply=reply,
            food_data=food_data,
            source="database",
        )

    def _handle_remove_food(self, food_name: str, diary: dict) -> ChatResult:
        """处理删除食物"""
        meals = diary.get("meals", [])
        if not meals:
            return ChatResult(
                action="remove_food",
                reply="今日还没有饮食记录，无需删除哦～",
            )

        # 查找匹配的食物
        matched = [m for m in meals if food_name and food_name in m.get("foodName", "")]
        if not matched:
            meal_list = "\n".join(f"  - {m['foodName']} ({m.get('time', '')})" for m in meals)
            return ChatResult(
                action="remove_food",
                reply=f"没有找到包含「{food_name}」的记录。\n\n今日记录：\n{meal_list}",
            )

        target = matched[-1]  # 删除最近一条
        reply = f"已找到：{target['foodName']}（{target.get('time', '')}）\n请确认是否删除这条记录。"

        return ChatResult(
            action="remove_food",
            reply=reply,
            food_data={"id": target.get("id"), "foodName": target.get("foodName")},
        )

    def _handle_query_nutrition(self, nutrition_status: dict) -> ChatResult:
        """处理查询营养"""
        cal = nutrition_status.get("calories", {})
        pro = nutrition_status.get("protein", {})
        carbs = nutrition_status.get("carbs", {})
        fat = nutrition_status.get("fat", {})

        def pct(current, target):
            if not target:
                return "N/A"
            return f"{current / target * 100:.0f}%"

        reply = (
            f"📊 今日营养摄入情况：\n\n"
            f"  🔥 热量: {cal.get('current', 0)} / {cal.get('target', 0)} kcal ({pct(cal.get('current', 0), cal.get('target', 0))})\n"
            f"  💪 蛋白质: {pro.get('current', 0)} / {pro.get('target', 0)} g ({pct(pro.get('current', 0), pro.get('target', 0))})\n"
            f"  🌾 碳水: {carbs.get('current', 0)} / {carbs.get('target', 0)} g ({pct(carbs.get('current', 0), carbs.get('target', 0))})\n"
            f"  🧈 脂肪: {fat.get('current', 0)} / {fat.get('target', 0)} g ({pct(fat.get('current', 0), fat.get('target', 0))})"
        )

        return ChatResult(
            action="query_nutrition",
            reply=reply,
            nutrition=nutrition_status,
        )

    def _handle_advice(self, user_profile: dict, diary: dict, nutrition_status: dict) -> ChatResult:
        """处理营养建议"""
        advice = self.generate_advice(user_profile, diary, nutrition_status)
        reply = (
            f"📋 今日总结\n{advice.summary}\n\n"
            f"📊 营养分析\n{advice.analysis}\n\n"
        )
        if advice.warning:
            reply += f"⚠️ 注意事项\n{advice.warning}\n\n"
        reply += f"🍽️ 下一餐建议\n{advice.recommendation}"

        return ChatResult(
            action="nutrition_advice",
            reply=reply,
            advice=advice.to_dict(),
            source=advice.source,
        )

    def _handle_chat(self, message: str) -> ChatResult:
        """处理普通聊天"""
        return ChatResult(
            action="chat",
            reply=(
                "我是 NutriAI 营养师 🥗\n\n"
                "你可以试试：\n"
                "• \"刚刚喝了一杯奶茶\"\n"
                "• \"今天营养达标了吗？\"\n"
                "• \"帮我分析一下今天的饮食\"\n"
                "• \"删除刚才的记录\""
            ),
        )
