const path = require('path');

module.exports = {
    mode: "development",
    entry: "./main.js",
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Compiles Sass to CSS
            "sass-loader",
          ],
        },
      ],
    },
  };
  