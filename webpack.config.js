const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  // mode: "production",
  mode: "development",

  context: path.resolve(__dirname, "./"),

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  entry: {
    main: "./src/main.js",
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "./src/images/favicon.ico",
          to: "favicon.ico",
        },

        {
          from: "./src/data/stations/",
          to: "data/stations/",
        },
        {
          from: "./src/data/audio/",
          to: "data/audio/",
        },

        {
          from: "./src/index.html",
          to: "index.html",
        },
      ],
    }),
  ],

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};
