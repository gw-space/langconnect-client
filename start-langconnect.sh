#!/bin/bash

# 작업 디렉토리로 이동
cd "$(dirname "$0")"

# Docker 서비스가 실행 중인지 확인
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Starting Docker..."
    open -a Docker
    # Docker가 완전히 시작될 때까지 대기
    while ! docker info > /dev/null 2>&1; do
        sleep 1
    done
fi

# 기존 컨테이너 정리 및 서비스 시작
docker compose down
docker compose up --remove-orphans -d

echo "LangConnect services started successfully!"