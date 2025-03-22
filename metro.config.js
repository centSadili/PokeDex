const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add custom extensions and assets
defaultConfig.resolver = {
  ...defaultConfig.resolver,
  sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs', 'mjs'],
  assetExts: [...defaultConfig.resolver.assetExts, 'glb', 'gltf', 'png', 'jpg'],
};

module.exports = defaultConfig;
