const { resolve } = require("path");
const environment = "production";
const distDir = resolve(__dirname, "./dist");

module.exports = {
  mode: environment,
  target: ["web", "es5"],
  resolve: {
    extensions: [".js", ".ts"],
  },
  entry: {
    index: "./src/index.ts",
  },
  output: {
    path: distDir,
    filename: "[name].min.js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: [/node_modules/, /test\.ts$/, /testutil/],
      },
    ],
  },
};
