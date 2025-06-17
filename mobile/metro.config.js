// mobile/metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");
const config = getDefaultConfig(__dirname);

// Add "md" to the list of file extensions Metro will bundle as assets:
config.resolver.assetExts.push("md");

module.exports = config;
