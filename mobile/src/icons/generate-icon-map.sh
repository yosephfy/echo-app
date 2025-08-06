#!/bin/bash

ICON_DIR="../../assets/icons"
OUTPUT_FILE="./icons.ts"

mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY." > "$OUTPUT_FILE"
echo "import { SvgProps } from 'react-native-svg';" >> "$OUTPUT_FILE"

IMPORTS=""
MAP="const iconMap: Record<string, React.FC<SvgProps>> = {\n"

for FILE in "$ICON_DIR"/*.svg; do
  BASENAME=$(basename "$FILE" .svg)                         # e.g., myicon-outlined
  IMPORT_NAME=$(echo "$BASENAME" | sed 's/[^a-zA-Z0-9]/_/g') # myicon_outlined
  IMPORTS+="import $IMPORT_NAME from '../../assets/icons/$BASENAME.svg';\n"
  MAP+="  \"$BASENAME\": $IMPORT_NAME,\n"
done

MAP+="} as const;\n\n"

ICON_TYPE="export type IconName = "

for FILE in "$ICON_DIR"/*.svg; do
  BASENAME=$(basename "$FILE" .svg)                         # e.g., myicon-outlined
  ICON_TYPE+="| \"$BASENAME\""
done

ICON_TYPE+="\n\nexport default iconMap;\n"
# Combine imports and map
echo -e "$IMPORTS\n$MAP\n$ICON_TYPE" >> "$OUTPUT_FILE"

echo "✅ Generated icon map at $OUTPUT_FILE"