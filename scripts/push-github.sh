#!/bin/bash
set -euo pipefail

# Chạy sau khi đã chấp nhận Xcode license:
#   sudo xcodebuild -license accept
#
# Cách dùng:
#   chmod +x scripts/push-github.sh
#   ./scripts/push-github.sh YOUR_GITHUB_USERNAME EduFlow

GITHUB_USER="${1:-}"
REPO_NAME="${2:-EduFlow}"

if [[ -z "$GITHUB_USER" ]]; then
  echo "Usage: ./scripts/push-github.sh <github-username> [repo-name]"
  exit 1
fi

cd "$(dirname "$0")/.."

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init -b main
fi

git add .
git status

if git diff --cached --quiet; then
  echo "Không có thay đổi để commit."
else
  git commit -m "$(cat <<'EOF'
Add EduFlow learning platform with backend, online classes, and attendance.

Includes Prisma API, teacher/student dashboards, schedule, video sessions, and chat.
EOF
)"
fi

REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
fi

echo ""
echo "Tạo repo trên GitHub (nếu chưa có): https://github.com/new"
echo "  - Repository name: ${REPO_NAME}"
echo "  - Không tick 'Add a README' nếu repo mới trống"
echo ""
read -r -p "Đã tạo repo trên GitHub? Nhấn Enter để push..."

git push -u origin main

echo "Done: https://github.com/${GITHUB_USER}/${REPO_NAME}"
