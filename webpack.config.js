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
    main: "./src/main.ts",
  },

  devtool: "source-map",
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    // extensions: ["", ".webpack.js", ".ts"],
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
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      { test: /\.tsx?$/, loader: "ts-loader" },

      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },

  devServer: {
    host: "0.0.0.0",
  },
};
