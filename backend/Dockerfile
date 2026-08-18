# LUMEN 后端生产镜像（⑪ 部署方案 A：全容器化，含 CPU Embedding）
# 构建：docker build -f backend/Dockerfile -t lumen-backend .
# 运行：docker compose -f docker/docker-compose.prod.yml up -d（推荐，含 PG/前端）

# Python 3.14 与本机 venv 一致（docs/05-tech-spec.md §1 运行基线）
FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Embedding 网络约束：huggingface_hub 默认 Xet 协议绕过 HTTP 代理，必须禁用
    HF_HUB_DISABLE_XET=1 \
    # 生产强制 PG 仓储 + fail-fast（backend/main.py lifespan 护栏）
    LUMEN_ENV=production

WORKDIR /app

# 系统依赖：sentence-transformers/torch 需要的 libgomp（OpenMP）
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 先装 torch CPU 版（默认 pip 拉 CUDA 体积过大），再装其余依赖
COPY backend/requirements.txt /app/requirements.txt
RUN pip install torch==2.13.0+cpu --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r /app/requirements.txt

COPY . /app

# 默认 8000（compose 映射外部端口）；绑定 0.0.0.0 供容器外访问
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
