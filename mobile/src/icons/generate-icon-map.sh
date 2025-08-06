#!/bin/bash

# Directory containing source SVGs and target TypeScript file
SVG_SOURCE_DIR="../../assets/icons"
TS_OUTPUT_PATH="./icons.ts"

# Ensure output directory exists
mkdir -p "$(dirname "$TS_OUTPUT_PATH")"

# Write file header
{
  echo "// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY."
  echo "import { SvgProps } from 'react-native-svg';"
} > "$TS_OUTPUT_PATH"

# Prepare accumulators for import statements and the icon map body
imports_section=""
icon_map_body="const iconMap: Record<IconName, React.FC<SvgProps>> = {\n"

# Loop through each SVG file, build import and map entries
for svg_file in "$SVG_SOURCE_DIR"/*.svg; do
  file_basename=$(basename "$svg_file" .svg)                           # e.g., myicon-outlined
  sanitized_name=$(echo "$file_basename" | sed 's/[^a-zA-Z0-9]/_/g')   # e.g., myicon_outlined

  imports_section+="import $sanitized_name from '$SVG_SOURCE_DIR/$file_basename.svg';\n"
  icon_map_body+="  \"$file_basename\": $sanitized_name,\n"
done

icon_map_body+="} as const;\n\n"

# Build the union type for icon names
type_definition="export type IconName ="
for svg_file in "$SVG_SOURCE_DIR"/*.svg; do
  file_basename=$(basename "$svg_file" .svg)
  type_definition+=" | \"$file_basename\""
done
type_definition+="\n\nexport default iconMap;\n"

# Combine all parts into the output file
{
  echo -e "$imports_section"
  echo -e "$icon_map_body"
  echo -e "$type_definition"
} >> "$TS_OUTPUT_PATH"

echo "✅ Generated icon map at $TS_OUTPUT_PATH"