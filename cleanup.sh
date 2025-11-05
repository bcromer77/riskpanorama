#!/bin/bash
set -e

echo "Starting RiskPanorama cleanup..."

# 1. Create backup
BACKUP_DIR="../riskpanorama-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR"
echo "Backup created at $BACKUP_DIR"

# 2. Remove duplicate directories
if [ -d "src/app" ]; then
  rm -rf src/app
  echo "Removed src/app"
fi
if [ -d "src" ] && [ -z "$(ls -A src)" ]; then
  rm -rf src
  echo "Removed empty src/"
fi

# 3. Remove temp files
rm -rf tmp_ocr/ temp/
rm -f lib/vector.ts.save
rm -f public/*.pdf
echo "Temporary files removed"

# 4. Clean node_modules and reinstall
rm -rf node_modules
npm ci

# 5. Verify
echo "✅ Cleanup complete. Run 'npm run dev' to test locally."

