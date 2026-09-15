"""
NutriAI 阿里云函数计算 FC - 入口 Handler

阿里云 FC HTTP 触发器 Custom Runtime 说明：
- FC 会在启动时执行 bootstrap 脚本或入口命令
- HTTP 请求会被转发到内部端口 9000
- 此 handler 启动 uvicorn 监听 0.0.0.0:9000

两种运行方式：
1) 自定义运行时 Custom Runtime:
   入口命令:  python3 handler.py
   代码包根目录包含: handler.py main.py model.py nutrition_agent.py agent_tools.py food_database.py ... + 所有依赖包

2) 标准 Python Runtime + HTTP 触发器（不推荐，更简单的方式用 Custom Runtime）
"""

import os
import sys

# ---- FC 运行时路径修正 ----
# FC 把代码解压到 /code 目录，FC LAYER 放到 /opt/python
_code_dir = os.path.dirname(os.path.abspath(__file__))
if _code_dir not in sys.path:
    sys.path.insert(0, _code_dir)

# LAYER 默认挂载目录
_opt_python = "/opt/python"
if os.path.isdir(_opt_python) and _opt_python not in sys.path:
    sys.path.insert(0, _opt_python)


def main():
    """启动 FastAPI 服务（Custom Runtime 模式）"""
    # FC HTTP 触发器转发到 9000 端口
    port = int(os.environ.get("FC_SERVER_PORT", "9000"))
    host = "0.0.0.0"

    # 生产环境：不开启 auto-reload
    try:
        import uvicorn
    except ImportError as e:
        print(f"[FATAL] 缺少依赖: {e}")
        sys.exit(1)

    print(f"[FC Handler] 启动 NutriAI FastAPI: {host}:{port}")
    print(f"[FC Handler] 代码目录: {_code_dir}")
    print(f"[FC Handler] Python: {sys.version}")

    uvicorn.run(
        "main:app",
        app_dir=_code_dir,
        host=host,
        port=port,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
