const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
module.exports = {
    // Transmission serves this tree under /transmission/web/, not /.
    publicPath: './',
    transpileDependencies: ['@vue/reactivity'],
    productionSourceMap: false,
    configureWebpack: {
        resolve: {
            alias: {
                // simple-sha1's browser file needs crypto.subtle or a blob worker.
                'simple-sha1': path.resolve(__dirname, 'shims/simple-sha1.js')
            }
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.PACKAGE_VERSION': '"' + version + '"'
            }),
            new NodePolyfillPlugin()
        ]
    }
}