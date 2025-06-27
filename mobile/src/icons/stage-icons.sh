#!/bin/bash

ICON_DIR="../../assets/icons"
RENAMED=0
UPDATED=0

echo "🔧 Starting icon staging in: $ICON_DIR"

for FILE in "$ICON_DIR"/*.svg; do
  BASENAME=$(basename "$FILE")
  DIRNAME=$(dirname "$FILE")

  # Remove -svgrepo-com
  CLEANED_NAME="${BASENAME/-svgrepo-com/}"

  # Remove any -123 before the .svg extension
  CLEANED_NAME=$(echo "$CLEANED_NAME" | sed -E 's/-[0-9]+\.svg$/.svg/')

  # Only rename if changed
  if [[ "$BASENAME" != "$CLEANED_NAME" ]]; then
    SRC="$DIRNAME/$BASENAME"
    DST="$DIRNAME/$CLEANED_NAME"
    mv "$SRC" "$DST"
    echo "Renamed: $BASENAME → $CLEANED_NAME"
    RENAMED=$((RENAMED + 1))
  fi
done

# Replace fills with currentColor
# Replace fills and strokes with currentColor unless explicitly set to "none"
for FILE in "$ICON_DIR"/*.svg; do
  sed -i '' -E '/fill=["'\'']none["'\'']/! s/fill=["'\'']#[0-9a-fA-F]+["'\'']/fill="currentColor"/g' "$FILE"
  sed -i '' -E '/fill=["'\'']none["'\'']/! s/fill=["'\''][a-zA-Z]+["'\'']/fill="currentColor"/g' "$FILE"
  sed -i '' -E '/stroke=["'\'']none["'\'']/! s/stroke=["'\'']#[0-9a-fA-F]+["'\'']/stroke="currentColor"/g' "$FILE"
  sed -i '' -E '/stroke=["'\'']none["'\'']/! s/stroke=["'\''][a-zA-Z]+["'\'']/stroke="currentColor"/g' "$FILE"
  UPDATED=$((UPDATED + 1))
done

echo "✅ $RENAMED icons renamed, $UPDATED icons updated with currentColor fill."