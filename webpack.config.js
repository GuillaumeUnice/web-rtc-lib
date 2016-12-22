var webpack = require('webpack'),
    path = require('path'),
    yargs = require('yargs');

var TransferWebpackPlugin = require('transfer-webpack-plugin');
 

var libraryName = 'WebRtcCDN',
    plugins = [ 
      // new TransferWebpackPlugin([
      //       { from: 'kaazing-enterprise-client', to: '/kaazing-enterprise-client' },
      //       { from: 'ws-jms-lib-echyzen', to: '/ws-jms-lib-echyzen' },
      //   ], path.join(__dirname, '/node_modules/'))
    ],
    outputFile;

if (yargs.argv.p) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }));
  outputFile = libraryName + '.min.js';
} else {
  outputFile = libraryName + '.js';
}

var config = {
  entry: [
    __dirname + '/src/index.ts',
  ],
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, '/dist/CDN'),
    filename: outputFile,
    library: libraryName
  },
  module: {
    preLoaders: [
      { test: /\.tsx?$/, loader: 'tslint', exclude: /node_modules/ }
    ],
    loaders: [
      { test: /\.tsx?$/, loader: 'ts', exclude: /node_modules/ }
    ]
  },
  resolve: {
    root: path.resolve('./src'),
    extensions: [ '', '.js', '.ts', '.jsx', '.tsx' ]
  },
  plugins: plugins,

  // Individual Plugin Options
  tslint: {
    emitErrors: true,
    failOnHint: true
  }
};

module.exports = config;
