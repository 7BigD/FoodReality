import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import member, queue, glasses, store, product, sample, game, dashboard

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 启动时自动灌入种子数据（Render 等平台重启后 SQLite 丢失，需要自动恢复）
from .seed import seed as _seed_data
_seed_data()

app = FastAPI(title="店小乖 API", version="1.0.0", description="店小乖一体化解决方案后端接口")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(member.router)
app.include_router(queue.router)
app.include_router(glasses.router)
app.include_router(store.router)
app.include_router(product.router)
app.include_router(sample.router)
app.include_router(game.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "店小乖 API 运行中", "docs": "/docs"}
