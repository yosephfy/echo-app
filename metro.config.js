const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const mobileRoot = path.join(projectRoot, "mobile");

// Create a Metro config using the mobile project as the base so Expo/EAS
// bundle the correct entry in a monorepo.
const config = getDefaultConfig(mobileRoot);

// Ensure md/markdown files are treated as assets so require('.../about.md') works
const resolver = config.resolver || {};
const assetExts = resolver.assetExts ? [...resolver.assetExts] : [];
const sourceExts = resolver.sourceExts ? [...resolver.sourceExts] : [];

if (!assetExts.includes("md")) assetExts.push("md");
if (!assetExts.includes("markdown")) assetExts.push("markdown");
if (!sourceExts.includes("cjs")) sourceExts.push("cjs");

// Watch the repo root and mobile workspace so changes are picked up.
config.watchFolders = [
  path.resolve(projectRoot),
  path.resolve(mobileRoot),
  path.resolve(projectRoot, "node_modules"),
];

// Prefer node_modules at the repo root first, then mobile's node_modules.
config.resolver = {
  ...(config.resolver || {}),
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(mobileRoot, "node_modules"),
  ],
  assetExts,
  sourceExts: Array.from(new Set(sourceExts)),
};

// Ensure Metro's projectRoot is the mobile workspace (Expo expects the app root)
config.projectRoot = mobileRoot;

module.exports = config;
