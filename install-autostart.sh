#!/bin/bash

# 현재 스크립트의 디렉토리 경로 얻기
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing LangConnect auto-startup service..."
echo "Project directory: $SCRIPT_DIR"

# LaunchAgents 디렉토리 생성
mkdir -p ~/Library/LaunchAgents

# plist 파일에서 PROJECT_PATH를 실제 경로로 치환
sed "s|PROJECT_PATH|$SCRIPT_DIR|g" "$SCRIPT_DIR/com.langconnect.startup.plist" > ~/Library/LaunchAgents/com.langconnect.startup.plist

# 시작 스크립트에 실행 권한 부여
chmod +x "$SCRIPT_DIR/start-langconnect.sh"

# LaunchAgent 로드
launchctl load ~/Library/LaunchAgents/com.langconnect.startup.plist

echo "✅ Auto-startup service installed successfully!"
echo "📌 The service will start automatically on system boot."
echo ""
echo "To test the service manually:"
echo "  launchctl start com.langconnect.startup"
echo ""
echo "To remove the auto-startup service:"
echo "  launchctl unload ~/Library/LaunchAgents/com.langconnect.startup.plist"
echo "  rm ~/Library/LaunchAgents/com.langconnect.startup.plist"