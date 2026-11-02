const fs = require('fs');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// Worktrees can share installed dependencies through a symlink. Metro must
// watch the real dependency directory, without watching another app source tree.
const dependencies = fs.realpathSync(path.join(__dirname, 'node_modules'));
const config = {
  watchFolders: [dependencies],
  resolver: { nodeModulesPaths: [dependencies] },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
