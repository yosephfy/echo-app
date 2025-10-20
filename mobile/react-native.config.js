// Ensure React Native autolinking and Gradle resolve RN from the monorepo root
const path = require('path');

module.exports = {
  project: {
    android: {
      // Helps Gradle tasks resolve paths during prebuild/compile
      sourceDir: 'android',
    },
    ios: {
      sourceDir: 'ios',
    },
  },
  // Point react-native CLI to the monorepo's react-native installation
  reactNativePath: path.resolve(__dirname, '../../node_modules/react-native'),
};
