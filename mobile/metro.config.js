const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for monorepo structure
config.watchFolders = [
  path.resolve(__dirname),
  path.resolve(__dirname, 'node_modules'),
];

// Prevent watching parent directory
config.resolver.blockList = [
  new RegExp(`^${path.resolve(__dirname, '..')}/node_modules/.*$`),
];

module.exports = config;