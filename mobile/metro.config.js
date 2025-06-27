// mobile/metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");
const config = getDefaultConfig(__dirname);

const { assetExts, sourceExts } = config.resolver;

// Add "md" to the list of file extensions Metro will bundle as assets:
config.resolver.assetExts.push("md");

config.resolver.assetExts = assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...sourceExts, "svg"];

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};
module.exports = config;
