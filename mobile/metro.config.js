const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Bundle the same portraits as the website without maintaining a second copy.
config.watchFolders = [path.resolve(__dirname, '../assets/rpg-portraits'), path.resolve(__dirname, '../assets/debt-dragons'), path.resolve(__dirname, '../shared')];

module.exports = config;
