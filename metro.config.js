const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Habilitar la importación de archivos SQL
config.resolver.sourceExts.push('sql');

module.exports = config;

