import path from "path"
import {fileURLToPath} from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import CopyPlugin from "copy-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"

import sveltePreprocess from "svelte-preprocess"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

export default {
  mode: "production",
  entry: {
    background: path.resolve(__dirname, "..", "src", "background.ts"),
    "content_scripts/to_inject": path.resolve(__dirname, "..", "src", "content_scripts", "to_inject.ts"),
    "content_scripts/inject": path.resolve(__dirname, "..", "src", "content_scripts", "inject.ts"),
    "popup/app": path.resolve(__dirname, "..", "src", "popup", "main.js"),
  },
  devtool: "inline-source-map",
  output: {
    path: path.join(__dirname, "../dist"),
    filename: "[name].js",
  },
  resolve: {
    alias: {
			svelte: path.dirname(require.resolve('svelte/package.json'))
		},
    extensions: [".ts", ".js", ".mjs", ".svelte"],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  module: {
    rules: [
      {
        test: /utils.ts$/,
        loader: 'string-replace-loader',
        options: {
          search: '__VERSION__',
          replace: process.env.npm_package_version
        }
      },
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(html|svelte)$/,
        include: path.resolve(__dirname, '../src'),
        use: {
          loader: 'svelte-loader',
          options: {
            emitCss: true,
            preprocess: sveltePreprocess({
              postcss: {
                plugins: [tailwindcss, autoprefixer]
              }
            })
          }
        },
      },
      {
        // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false, // necessary if you use url('/path/to/some/asset.png|jpg|gif')
            }
          }
        ]
      },
      {test: /\.json$/, loader: 'json-loader'},
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {from: "src/icons", to: "icons"},
        //{from: "src/popup", to: "popup"},
        {from: "src/manifest.json", to: "manifest.json"},
        {from: "src/popup/app.html", to: "popup/app.html"}
      ]
    }),
    new MiniCssExtractPlugin({filename: '[name].css'})
  ],
};
