const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const webpack = require("webpack");

console.log(__dirname);
let common_config = {
    node: {
        // __dirname: true
        __dirname: false,  // testing
        __filename: false
    },
    mode: process.env.ENV || 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/,
                    path.resolve(__dirname, "src/ui")
                ]
            },
            {
                test: /\.exec\.js$/,
                use: ['raw-loader']
            },
            // {
            //     test: /\.html$/,
            //     exclude: /node_modules/,
            //     use: 'raw-loader'
            // },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                use: {
                    loader: 'html-loader'
                }
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.html']
    },
    resolveLoader: {
        extensions: ['raw-loader']
    },
    externals: {
        knockout: 'ko',
        // google: 'google',
        'ko.observableDicitonary': 'ko',
    },
    // plugins: [
    //     new SentryWebpackPlugin({
    //         // sentry-cli configuration - can also be done directly through sentry-cli
    //         // see https://docs.sentry.io/product/cli/configuration/ for details
    //         authToken: process.env.SENTRY_AUTH_TOKEN,
    //         org: "einsatzmonitor",
    //         project: "einsatzmonitor",
    //         release: process.env.npm_package_version,
    //
    //         // other SentryWebpackPlugin configuration
    //         include: ".",
    //         ignore: ["node_modules", "webpack.config.js", "webpack.electron.config.js"],
    //     }),
    // ],
};

module.exports = [
    Object.assign({}, common_config, {
        devtool: 'source-map',
        target: 'electron-main',
        entry: {
            renderrer: './src/main/index.ts',
        },
        output: {
            filename: '[name]-bundle.js',
            path: path.resolve(__dirname, 'src/main/dist')
        },
    }),
    Object.assign({}, common_config, {
        devtool: 'source-map',
        target: 'electron-renderer',
        entry: {
            ui: './src/renderer/index.ts',
        },
        output: {
            filename: '[name]-bundle.js',
            path: path.resolve(__dirname, 'src/renderer/dist'),
            publicPath: '/',
        },
        devServer: {
            host: '127.0.0.1',
            allowedHosts: 'all',
            hot: true,
            devMiddleware: {
                writeToDisk: true,
                publicPath: '/',
            },
            client: {
                webSocketURL: {
                    hostname: '127.0.0.1',
                    pathname: '/ws',
                    port: 8080,
                    protocol: 'ws',
                }
            },
        }
    }),

    // Object.assign({}, common_config, {
    //     target: 'electron-renderer',
    //     entry: {
    //         "knockout": [
    //             // Inside file below there is 'require("knockout")'
    //             // invocation which webpack cannot resolve.
    //             // We need to tell webpack to not to resolve that
    //             // and leave 'require("knockout")' whithout any changes.
    //             // By that this code will be resolved on runtime
    //             // which means that we need to attach script to
    //             // knockout somewhere in project.
    //             "./src/renderer/static/js/knockout-3.5.1.js",
    //         ]
    //     },
    //     output: {
    //         filename: "./dist/[name].js"
    //     },
    //     plugins: [
    //         // This tells to webpack: if you'll find
    //         // somewhere in code 'require("knockout")'
    //         // don't try to resolve that. Leave it as is.
    //         new webpack.IgnorePlugin(/^knockout$/),
    //     ]
    // })
]
