module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);

  // Jest roda em Node puro, fora do Metro — babel-preset-expo referencia
  // módulos virtuais do Metro (ex.: expo/virtual/env.js) que não existem
  // nesse contexto. Testes usam um preset simples; o bundle do app (Metro/
  // Expo) continua usando babel-preset-expo normalmente.
  if (api.env("test")) {
    return {
      presets: ["@babel/preset-env", "@babel/preset-typescript"],
    };
  }

  return {
    presets: ["babel-preset-expo"],
  };
};
