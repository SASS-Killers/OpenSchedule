#!/usr/bin/env bash
# Render each scene as a separate video file for manual assembly.
# Usage: bash render-scenes.sh
# Output: out/scene-01.mp4 ... out/scene-12.mp4

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
mkdir -p out

# Scene frame ranges (from OpenScheduleDemo.tsx scene offsets)
# S5=150, S4=120, S3=90
SCENES=(
  "01-booking-widget:0-149"
  "02-booking-confirmation:150-269"
  "03-login:270-389"
  "04-host-dashboard:390-539"
  "05-schedule-editor:540-659"
  "06-exceptions:660-779"
  "07-event-types:780-899"
  "08-admin-dashboard:900-1049"
  "09-easy-install:1050-1199"
  "10-hosting-stack:1200-1319"
  "11-features:1320-1409"
  "12-outro:1410-1499"
)

for scene in "${SCENES[@]}"; do
  name="${scene%%:*}"
  frames="${scene##*:}"
  echo "Rendering $name (frames $frames)..."
  npx remotion render OpenScheduleDemo "out/${name}.mp4" --frames="$frames"
done

echo ""
echo "All scenes rendered to out/"
ls -lh out/
