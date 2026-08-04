"""
NutriAI 后端服务 - FastAPI 入口

提供食物识别 API 接口，支持跨域访问。

启动方式:
    python main.py
    或
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import io
import logging
import pathlib
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 加载 .env 环境变量（显式指定路径，避免 CWD 问题）
_env_path = pathlib.Path(__file__).resolve().parent / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=str(_env_path), override=True)
except ImportError:
    pass

from model import recognize_food, FoodRecognitionResult
from nutrition_agent import NutritionAgent, ChatResult

# 日志配置
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
logger = logging.getLogger("nutriai")

# ============================================================
# 应用初始化
# ============================================================

app = FastAPI(
    title="NutriAI API",
    description="NutriAI 智能饮食管理后端服务 - 食物识别 & 营养分析",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 配置 - 允许前端开发服务器跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 响应模型
# ============================================================

class FoodRecognitionResponse(BaseModel):
    success: bool = True
    foodName: str = ""
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    confidence: float = 0
    emoji: str = ""
    recognizedAt: str = ""
    message: str = ""
    error: Optional[str] = None


class HealthCheckResponse(BaseModel):
    status: str = "ok"
    model: str = ""
    timestamp: str = ""


# ---- 营养建议请求/响应模型 ----

class NutritionAdviceRequest(BaseModel):
    userProfile: dict
    diary: dict
    nutrition: dict


class AdviceData(BaseModel):
    summary: str = ""
    analysis: str = ""
    warning: str = ""
    recommendation: str = ""


class NutritionAdviceResponse(BaseModel):
    success: bool = True
    data: Optional[AdviceData] = None
    source: str = ""
    message: str = ""
    error: Optional[str] = None


# ---- 聊天请求/响应模型 ----

class ChatRequest(BaseModel):
    message: str
    userProfile: dict = {}
    diary: dict = {}
    nutrition: dict = {}


class ChatResponse(BaseModel):
    success: bool = True
    action: str = "chat"
    reply: str = ""
    foodData: Optional[dict] = None
    advice: Optional[dict] = None
    nutrition: Optional[dict] = None
    source: str = ""
    message: str = ""
    error: Optional[str] = None


# ============================================================
# API 路由
# ============================================================

@app.get("/api/health", response_model=HealthCheckResponse)
async def health_check():
    """健康检查接口"""
    model_type = os.environ.get("NUTRI_AI_MODEL", "mock")
    return HealthCheckResponse(
        status="ok",
        model=model_type,
        timestamp=datetime.now().isoformat()
    )


# ---- 营养 Agent 实例（全局单例） ----
_nutrition_agent = None

def get_agent() -> NutritionAgent:
    global _nutrition_agent
    if _nutrition_agent is None:
        _nutrition_agent = NutritionAgent()
    return _nutrition_agent


@app.post("/api/nutrition-advice", response_model=NutritionAdviceResponse)
async def nutrition_advice(request: NutritionAdviceRequest):
    """
    AI 营养建议接口

    接收用户健康画像、今日饮食记录、营养摄入情况，
    调用 LLM 生成个性化饮食建议。

    - **userProfile**: 用户健康画像 { gender, age, height, weight, goal, activityLevel }
    - **diary**: 今日饮食记录 { meals: [...] }
    - **nutrition**: 营养摄入 { calories: {current, target}, protein: {...}, ... }

    返回：
    - summary: 今日饮食评价
    - analysis: 营养摄入分析
    - warning: 不足/过量提醒
    - recommendation: 下一餐推荐
    """
    agent_model = os.environ.get("NUTRI_AI_AGENT_MODEL", "qwen-plus")
    api_key = os.environ.get("DASHSCOPE_API_KEY", "")

    logger.info("=" * 60)
    logger.info("[ADVICE] 收到营养建议请求")
    logger.info("[ADVICE] Agent 模型: %s", agent_model)
    logger.info("[ADVICE] API Key: %s", '已配置' if api_key else '未配置')
    logger.info("[ADVICE] 用户目标: %s", request.userProfile.get("goal", "未知"))
    logger.info("[ADVICE] 饮食记录: %d 条", len(request.diary.get("meals", [])))

    try:
        agent = get_agent()
        result = agent.generate_advice(
            user_profile=request.userProfile,
            diary=request.diary,
            nutrition_status=request.nutrition,
        )

        logger.info("[ADVICE] 建议生成完成, 来源: %s", result.source)
        logger.info("[ADVICE] summary: %s", result.summary[:80])
        logger.info("=" * 60)

        return NutritionAdviceResponse(
            success=True,
            data=AdviceData(
                summary=result.summary,
                analysis=result.analysis,
                warning=result.warning,
                recommendation=result.recommendation,
            ),
            source=result.source,
            message="建议生成成功",
        )

    except Exception as e:
        logger.error("[ADVICE] 建议生成失败: %s", str(e))
        logger.info("=" * 60)
        return NutritionAdviceResponse(
            success=False,
            message="AI service unavailable",
            error=str(e),
        )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 聊天接口

    接收用户自然语言消息，自动识别意图并执行对应操作：
    - add_food: 识别食物 + 估算营养 → 返回食物数据
    - remove_food: 查找匹配记录 → 返回删除目标
    - query_nutrition: 返回今日营养摄入
    - nutrition_advice: 调用 LLM 生成建议
    - chat: 普通聊天回复
    """
    logger.info("=" * 60)
    logger.info("[CHAT] 收到消息: %s", request.message)
    logger.info("[CHAT] 饮食记录: %d 条", len(request.diary.get("meals", [])))

    try:
        agent = get_agent()
        result = agent.process_message(
            message=request.message,
            user_profile=request.userProfile,
            diary=request.diary,
            nutrition_status=request.nutrition,
        )

        logger.info("[CHAT] 处理完成: action=%s, source=%s", result.action, result.source)
        logger.info("[CHAT] 回复: %s", result.reply[:80])
        logger.info("=" * 60)

        return ChatResponse(
            success=True,
            action=result.action,
            reply=result.reply,
            foodData=result.food_data,
            advice=result.advice,
            nutrition=result.nutrition,
            source=result.source,
            message="处理成功",
        )

    except Exception as e:
        logger.error("[CHAT] 处理失败: %s", str(e))
        logger.info("=" * 60)
        return ChatResponse(
            success=False,
            message="AI service unavailable",
            error=str(e),
        )


@app.post("/api/recognize-food", response_model=FoodRecognitionResponse)
async def recognize_food_endpoint(
    image: UploadFile = File(..., description="食物图片文件"),
):
    """
    食物识别接口
    
    接收图片文件，调用视觉模型识别食物并返回营养信息。
    
    - **image**: 图片文件 (JPEG/PNG/WebP 等)
    
    返回：
    - foodName: 食物名称
    - calories: 卡路里
    - protein: 蛋白质 (g)
    - carbs: 碳水化合物 (g)
    - fat: 脂肪 (g)
    - confidence: 置信度 (0-1)
    """
    # ---- 诊断日志：请求信息 ----
    model_type = os.environ.get("NUTRI_AI_MODEL", "mock")
    api_key = os.environ.get("DASHSCOPE_API_KEY", "")
    logger.info("=" * 60)
    logger.info(f"[REQUEST] 收到识别请求: filename={image.filename}, content_type={image.content_type}")
    logger.info(f"[CONFIG]  NUTRI_AI_MODEL={model_type}")
    logger.info(f"[CONFIG]  DASHSCOPE_API_KEY={'已配置(len=' + str(len(api_key)) + ')' if api_key else '未配置'}")
    
    # 校验文件类型
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]
    if image.content_type and image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图片格式: {image.content_type}。请上传 JPEG/PNG/WebP 格式。"
        )
    
    # 限制文件大小 (最大 10MB)
    MAX_SIZE = 10 * 1024 * 1024
    contents = await image.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"图片文件过大 ({len(contents) / 1024 / 1024:.1f}MB)，最大支持 10MB。"
        )
    
    logger.info(f"[REQUEST] 图片大小: {len(contents)} bytes ({len(contents)/1024:.1f} KB)")
    
    try:
        # 调用模型进行识别
        result = recognize_food(contents)
        
        logger.info(
            f"[RESULT] 识别完成: foodName={result.food_name}, "
            f"calories={result.calories}, "
            f"confidence={result.confidence}"
        )
        logger.info("=" * 60)
        
        return FoodRecognitionResponse(
            success=True,
            foodName=result.food_name,
            calories=result.calories,
            protein=result.protein,
            carbs=result.carbs,
            fat=result.fat,
            confidence=result.confidence,
            emoji=result.emoji,
            recognizedAt=result.recognized_at,
            message="识别成功"
        )
        
    except Exception as e:
        logger.error(f"[ERROR] 识别失败: {str(e)}")
        logger.info("=" * 60)
        return FoodRecognitionResponse(
            success=False,
            message="AI service unavailable",
            error=str(e)
        )


# ============================================================
# 启动入口
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info("=" * 60)
    logger.info("NutriAI 后端服务启动")
    logger.info(f"  地址: http://{host}:{port}")
    logger.info(f"  NUTRI_AI_MODEL: {os.environ.get('NUTRI_AI_MODEL', 'mock')}")
    logger.info(f"  NUTRI_AI_AGENT_MODEL: {os.environ.get('NUTRI_AI_AGENT_MODEL', 'qwen-plus')}")
    _key = os.environ.get('DASHSCOPE_API_KEY', '')
    logger.info(f"  DASHSCOPE_API_KEY: {'已配置(len=' + str(len(_key)) + ')' if _key else '未配置'}")
    logger.info(f"  .env 路径: {_env_path}")
    logger.info("=" * 60)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )
