const path = require("path");

const { DefinePlugin, ProgressPlugin } = require("webpack");
const {
  WebpackEnvRepleacePlugin
} = require("./lib/plugin/WebpackEnvRepleacePlugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

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
    new ProgressPlugin(),

    new DefinePlugin({
      "process.env.ID2": "'cjfff2'"
    }),

    new HtmlWebpackPlugin({
      template: "./public/index.html",
      inject: "body",
      minify: {
        removeComments: false,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        collapseWhitespace: true,
        keepClosingSlash: true
      }
    }),

    new WebpackEnvRepleacePlugin()
  ]
};
