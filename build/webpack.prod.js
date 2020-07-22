/*
 * @Descripttion: prodocution.config
 * @Author: asyncnode
 * @Date: 2020-03-23 12:08:30
 * @LastEditors: all
 * @LastEditTime: 2020-07-17 11:37:22
 * @note: happypack/thread-loader 只用一个就可以 && TerserPlugin/HardSourceWebpackPlugin 同样
 */

// node内置path 模块
const path = require('path');
const glob = require('glob');
// webpack config合并模块
const merge = require('webpack-merge');
// copy静态文件插件
// const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// 友好报错插件模块
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
// 清除文件
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// https://webpack.docschina.org/plugins/terser-webpack-plugin/
const TerserPlugin = require('terser-webpack-plugin');
// 基础配置
const baseWebpackConfig = require('./webpack.base');
// 全局配置
const config = require('../config');
// PWA
const WorkboxPlugin = require('workbox-webpack-plugin');
// 获取cssloader
const cssLoader = require('./loaders/cssLoader');

// tree-sheaking css
const PurgecssPlugin = require('purgecss-webpack-plugin');
// 常用工具方法
const utils = require('./utils');
// 硬盘缓存
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
// 多进程加速
const HappyPack = require('happypack');

// const PATHS = {
//   src: path.join(__dirname, 'src')
// }

// 正式环境 webpack 配置
const webpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  output: {
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash:8].js'),
    chunkFilename: utils.assetsPath('js/[name].[chunkhash:8].js')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, '../src'),
        use: [
          // 'happypack/loader'
          'thread-loader',
          'cache-loader',
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true
            }
          },
          'eslint-loader'
        ]
      }
    ]
  },
  // 编译信息
  stats: {
    // 增加资源信息
    assets: true,
    // 添加缓存（但未构建）模块的信息
    cached: true,
    // 显示缓存的资源（将其设置为 `false` 则仅显示输出的文件）
    cachedAssets: true,
    // 添加 children 信息
    children: false,
    // 添加 chunk 信息（设置为 `false` 能允许较少的冗长输出）
    chunks: true,
    // 将构建模块信息添加到 chunk 信息
    // chunkModules: true,
    // chunkOrigins: true,
    chunkGroups: true,
    // `webpack --colors` 等同于
    colors: true,
    // 添加 --env information
    env: false,
    // 添加错误信息
    errors: true,
    // 添加错误的详细信息（就像解析日志一样）
    errorDetails: true,
    // 添加 compilation 的哈希值
    hash: false,
    // 添加构建模块信息
    modules: true,
    // 当文件大小超过 `performance.maxAssetSize` 时显示性能提示
    performance: true,
    // 添加时间信息
    timings: true,
    // 添加警告
    warnings: true
  },
  module: {
    rules: [].concat(
      cssLoader.styleLoaders({
        cssSourceMap: config.build.cssSourceMap,
        usePostCSS: true,
        extract: true
      })
    )
  },
  // 配置 js source-map
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  optimization: {
    runtimeChunk: {
      name: 'manifest'
    },
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        },
        vendor: {
          //第三方依赖
          priority: 1, //设置优先级，首先抽离第三方模块
          name: 'vendor',
          test: /node_modules/,
          chunks: 'initial',
          minSize: 0,
          minChunks: 1 //最少引入了1次
        },
        //缓存组
        common: {
          //公共模块
          chunks: 'initial',
          name: 'common',
          minSize: 100, //大小超过100个字节
          minChunks: 3 //最少引入了3次
        }
      }
    },
    minimizer: [
      new OptimizeCSSAssetsPlugin({
        assetNameRegExp: /\.css$/g,
        cssProcessor: require('cssnano')
      })
    ]
    // minimizer: [new OptimizeCSSAssetsPlugin({
    //   assetNameRegExp: /\.css$/g,
    //   cssProcessor: require('cssnano')
    // }), new TerserPlugin({
    //   include: /\.min\.js$/
    // })]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        cache: true,
        terserOptions: {
          compress: {
            warnings: false,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log']
          }
        }
      })
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new HardSourceWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: utils.assetsPath('css/[name].[contenthash:8].css'),
      chunkFilename: utils.assetsPath('css/[name].[contenthash:8].css')
    }),
    new OptimizeCSSAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano')
    }),
    // 坑太多了
    // new PurgecssPlugin({
    //   paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true })
    //   // content: [`./public/**/*.html`, `./src/**/*.vue`],
    // }),
    // new WorkboxPlugin.GenerateSW({
    //   clientsClaim: true,
    //   skipWaiting: true
    // }),
    new FriendlyErrorsPlugin(),
    function() {
      this.hooks.done.tap('done', (stats) => {
        if (
          stats.compilation.errors &&
          stats.compilation.errors.length &&
          process.argv.indexOf('--watch') == -1
        ) {
          console.log('build error');
          process.exit(1);
        }
      });
    }
    // new HappyPack({
    //   loaders: ['babel-loader?cacheDirectory=true']
    // }),
    // new HardSourceWebpackPlugin()
  ]
});

module.exports = webpackConfig;
