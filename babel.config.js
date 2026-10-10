module.exports = function configureBabel(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: process.env.NODE_ENV === 'production'
      ? ['transform-remove-console']
      : [],
  };
};
