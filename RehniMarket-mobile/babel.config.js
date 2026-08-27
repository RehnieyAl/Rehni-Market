// Metro no lee `compilerOptions.paths` de tsconfig.json por sí solo -
// module-resolver es lo que hace que el alias `@/*` (→ src/*, mismo
// alias que ya usa RehniMarket-frontend) funcione en tiempo de ejecución,
// no solo para el chequeo de tipos.
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
          },
        },
      ],
    ],
  };
};
