const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
   mode: "production",
   entry: {
      background: path.resolve(__dirname, "..", "src", "background.ts"),
      "content_scripts/to_inject": path.resolve(__dirname, "..", "src", "content_scripts", "to_inject.ts"),
      "content_scripts/inject": path.resolve(__dirname, "..", "src", "content_scripts", "inject.ts"),
   },
   output: {
      path: path.join(__dirname, "../dist"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".js"],
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
           {from: "src/icons", to: "icons"},
           {from: "src/popup", to: "popup"},
           {from: "manifest.json", to: "manifest.json"}
         ]
      }),
   ],
};
