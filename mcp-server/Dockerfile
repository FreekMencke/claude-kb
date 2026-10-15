# claude-kb's MCP server. Built from the repo root (`docker build -f mcp-server/Dockerfile .`) because it also needs
# scripts/check_kb.py. Holds the server and its dependencies only: never KB content (topics/ and the rest arrive at
# run time through the git-sync sidecar) and never secrets. Dockerfile.dockerignore keeps everything else out of the
# build context.
FROM python:3.13.16-slim@sha256:70729b46c69b4f1e97c4822c1af3df53a1476cf5ddc6c087c0c10bc3a5678c2f

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Exact versions with hashes: an unpinned dependency can break the server on a rebuild
COPY mcp-server/requirements.txt ./
RUN pip install --no-cache-dir --require-hashes -r requirements.txt

COPY mcp-server/server.py mcp-server/kb_tools.py mcp-server/kb_index.py mcp-server/logs.py mcp-server/metrics.py scripts/check_kb.py ./
# The server's icon (ICON_FILES in server.py)
COPY assets/logo.png assets/logo.svg ./assets/

# The app, and /metrics (metrics.py)
EXPOSE 8000 9090

# The UID that owns the OAuth state volume's directory on the host (FreekMencke/home-cluster
# cluster/claude-kb/volumes.yaml): a hostPath volume ignores fsGroup
USER 10001:10001

CMD ["python", "server.py"]
