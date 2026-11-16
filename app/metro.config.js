const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// La base du dictionnaire est embarquée dans l'APK (assets/db/*.db).
if (!config.resolver.assetExts.includes('db')) {
  config.resolver.assetExts.push('db');
}

// expo-sqlite utilise WebAssembly sur le web : Metro doit empaqueter le .wasm
// et le navigateur a besoin de SharedArrayBuffer (en-têtes COOP/COEP).
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhancedMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, metroServer)
    : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhancedMiddleware(req, res, next);
  };
};

module.exports = config;
