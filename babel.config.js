module.exports = function (api) {
  api.cache(true);
  return {
    // Expo Router resolves the "@/*" path alias from tsconfig.json natively,
    // so no extra module-resolver plugin is required.
    presets: ['babel-preset-expo'],
  };
};
