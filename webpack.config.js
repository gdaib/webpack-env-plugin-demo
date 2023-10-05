const path = require("path");

const { DefinePlugin } = require("webpack");
const {
  WebpackEnvRepleacePlugin
} = require("./lib/plugin/WebpackEnvRepleacePlugin");
const CopyPlugin = require("copy-webpack-plugin");

const distPath = path.resolve(__dirname, "./dist");

module.exports = {
  entry: "./main.js",
  output: {
    filename: "bundle.js",
    path: distPath
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      "process.env.ID2": "'cjfff2'"
    }),

    new WebpackEnvRepleacePlugin(),

    new CopyPlugin({
      patterns: [
        {
          context: path.join(__dirname, "public"),
          from: "**/*",
          to: distPath
        }
      ]
    })
  ]
};
