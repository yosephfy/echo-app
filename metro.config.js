const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const mobileRoot = path.join(projectRoot, 'mobile');

// Create a Metro config using the mobile project as the base so Expo/EAS
// bundle the correct entry in a monorepo.
const config = getDefaultConfig(mobileRoot);

// Watch the repo root and mobile workspace so changes are picked up.
config.watchFolders = [
  path.resolve(projectRoot),
  path.resolve(mobileRoot),
  path.resolve(projectRoot, 'node_modules'),
];

// Prefer node_modules at the repo root first, then mobile's node_modules.
config.resolver = {
  ...(config.resolver || {}),
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(mobileRoot, 'node_modules'),
  ],
  sourceExts: Array.from(new Set([...(config.resolver?.sourceExts || []), 'cjs'])),
};

// Ensure Metro's projectRoot is the mobile workspace (Expo expects the app root)
config.projectRoot = mobileRoot;

module.exports = config;
