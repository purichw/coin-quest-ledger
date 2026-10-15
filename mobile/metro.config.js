const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Native uses the same checked-in illustrations and finance canon as the web.
config.watchFolders = [path.resolve(__dirname, '../assets'), path.resolve(__dirname, '../shared')];

module.exports = config;
