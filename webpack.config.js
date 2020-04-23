/* --------------- modules & plugins --------------------------- */

const path = require("path");
const fs = require("fs");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ImageminPlugin = require("imagemin-webpack-plugin").default;
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminWebp = require("imagemin-webp");
const DashboardPlugin = require("webpack-dashboard/plugin");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const OptimizeCssAssetsWebpackPlugin = require("optimize-css-assets-webpack-plugin");
const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer");


/* --------------- const ------------------------------------- */

const isDev = process.env.NODE_ENV === "development";
const distPath = isDev ? path.resolve(__dirname, "dist/debug") : path.resolve(__dirname, "dist/release");

/* --------------- functions --------------------------------- */

const optimization = () => {
    const config = {
        splitChunks: {
            // Если несколько точек входа, то не грузить общий код дважды, в к файле vendors-...
            chunks: "all"
        }
    }

    if (!isDev) {
        config.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(), // optimize & minimize CSS
            new TerserWebpackPlugin() // optimize & minimize JS
        ]
    }

    return config;
}

const fileName = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`;

function generateHtmlPlugins(templateDirs) {
    let plugins = [];
    if (templateDirs === "" || templateDirs === []) return [];
    if (!Array.isArray(templateDirs)) templateDirs = [templateDirs];

    templateDirs.forEach(templateDir => {
        let templateFiles;
        try {
            templateFiles = fs.readdirSync(path.resolve(__dirname, "src", templateDir));
        } catch (e) {
            if (e.errno === -4058) return []; // directory not found
        }

        // filter needed extensions
        templateFiles = templateFiles.filter((item) => {
            const parts = item.split('.');
            const extension = parts[1];
            return ["php", "html", "htm"].includes(extension);
        });

        plugins = templateFiles.map(item => {
            const parts = item.split('.');
            const name = parts[0];
            const extension = parts[1];
            return new HTMLWebpackPlugin({
                /*filename: `${templateDir}${templateDir === "" ? "" : "/"}${name}.${extension}`,
                template: path.resolve(__dirname, `src`, templateDir, `${name}.${extension}`),*/
                filename: path.join(templateDir, `${name}.${extension}`),
                template: path.join(templateDir, `${name}.${extension}`),
                chunks: ["analytics", name],
                inject: true,
                collapseWhiteSpace: !isDev // minify HTML in production
            })
        }).concat(plugins);
    });
    return plugins;
}

const cssLoaders = extra => {
    const loaders = [
        {
            loader: MiniCssExtractPlugin.loader,
            options: {
                hmr: isDev,
                reloadAll: true,
                publicPath: (resourcePath, context) => {
                    // publicPath is the relative path of the resource to the context
                    // e.g. for ./css/admin/main.css the publicPath will be ../../
                    // while for ./css/main.css the publicPath will be ../
                    return path.relative(path.dirname(resourcePath), context) + '/';
                }
            }
        },
        "css-loader",
        {
            loader: 'postcss-loader',
            options: {
                ident: 'postcss',
                plugins: [
                    require('autoprefixer')({ grid: "autoplace" })
                ]
            }
        }
    ];

    if (extra) {
        loaders.push(extra);
    }

    return loaders;
}

const babelOptions = preset => {
    let options = {
        presets: [
            "@babel/preset-env"
        ],
        plugins: [
            "@babel/plugin-proposal-class-properties"
        ]
    }

    if (preset)
        options.presets.push(preset);

    return options;
}

const jsLoaders = () => {
    const loaders = [{
        loader: "babel-loader",
        options: babelOptions()
    }];

    if (isDev) {
        loaders.push("eslint-loader");
    }

    return loaders;
}

const plugins = () => {
    let base = [
        // NASA plugin
        //new DashboardPlugin({}),

        // not cleaned from memory for devServer
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false // очищать неиспользуемое при ребилде?
            //cleanAfterEveryBuildPatterns: ["!**/.htaccess"],
        }),
        // new HTMLWebpackPlugin({
        //     filename: "index.php",
        //     template: "./index.php",
        //     chunks: ["analytics", "index"]
        // }),
        // new HTMLWebpackPlugin({
        //     filename: "contacts.php",
        //     template: "./contacts.php",
        //     chunks: ["analytics", "contacts"]
        // }),
        // new HTMLWebpackPlugin({
        //     filename: "admin/index.php",
        //     template: "admin/index.php",
        //     chunks: ["analytics", "index"]
        // }),
        new BrowserSyncPlugin({
            port: 3000,
            proxy: "http://localhost:800/code/sandbox/webpack-test/dist/debug"
        }),
        // new CopyWebpackPlugin([
        //     {
        //         from: "./.htaccess",
        //         to: path.resolve(__dirname, "dist/debug")
        //     }
        // ]),
        new CopyWebpackPlugin([
            {
                from: "./img/**/*.*",
                to: distPath
            }
        ]),
        new ImageminPlugin({
            disable: process.env.NODE_ENV !== 'production', // Disable during development
            test: /\.(jpe?g|png|gif|svg|webp)$/i,
            plugins: [
                imageminMozjpeg({
                    quality: 20,
                    progressive: true
                }),
                imageminWebp({
                    quality: 50
                })
            ]
        }),
        new MiniCssExtractPlugin({
            filename: "css/" + fileName("css"),
            path: distPath
        })
    ];

    base = base.concat(
        generateHtmlPlugins(["", "admin"])
    );

    return base;
}

/* ---------------- module.exports ------------------------ */

module.exports = {
    context: path.resolve(__dirname, "src"),
    // режим по-умолчанию
    mode: isDev ? "development" : "production",
    //cache: false,
    devtool: isDev ? "source-map": "",
    resolve: {
        alias: {
            "@models": path.resolve(__dirname, "src/js/models"),
            "@js": path.resolve(__dirname, "src/js"),
            "@style": path.resolve(__dirname, "src/style"),
            "@img":path.resolve(__dirname, "src/img"),
            "@": path.resolve(__dirname, "src")
        }
    },
    optimization: optimization(),
    entry: {
        // 3 точки входа
        index: ["@babel/polyfill", "./js/index.js"],
        indexReact: ["@babel/polyfill", "./js/index.jsx"],
        analytics: "./js/analytics.js",
        contacts: "./js/contacts.js"
    },
    output: {
        // для каждой точки входа своя точка выхода
        filename: "./js/" + fileName("js"),
        // TBD: if is production => to folder "dist/release"
        path: path.resolve(__dirname, "dist", isDev ? "debug" : "release")
    },
    // devServer: {
    //     port: 4000,
    //     /*writeToDisk: (fileName) => {
    //         return (/\.(html?|php)$/.test(fileName));
    //     },*/
    //     writeToDisk: true,
    //     historyApiFallback: true,
    //     hot: isDev,
    //     proxy: {
    //         "/": {
    //             target: "http://localhost:800/code/sandbox/webpack-test/dist/debug"
    //         }
    //     }
    // },
    plugins: plugins(),
    // HTMLWebpackPlugin:
    // 1. Создаёт HTML на основе template
    // 2. Вставляет <script> в HTML
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: jsLoaders()
            },
            {
                test: /\.jsx$/,
                exclude: /node_modules/,
                loader: {
                    loader: "babel-loader",
                    options: babelOptions("@babel/preset-react")
                }
            },
            {
                test: /\.css$/i,
                // css-loader: возможность сделать так: import "../style/style.css" в js-коде
                // style-loader: добавляет css в head в HTML
                // MiniCssExtractPlugin.loader - позволяет выносить CSS в отдельный файл
                use: cssLoaders()
            },
            {
                test: /\.(less)$/i,
                use: cssLoaders("less-loader")
            },
            {
                test: /\.(s[ac]ss)$/i,
                use: cssLoaders("sass-loader")
            },
            // {
            //     test: /\.(html?|php)$/i,
            //     // 1. Минимизирует HTML
            //     // 2. Ищет изображения в HTML и делает их импорт через JS: import img from "./image.png"
            //     // 3. Меняет путь до изображения в HTML
            //     // 4. Возможность сделать так: import "../page.html в js-коде
            //     use: [{
            //         loader: "html-loader"
            //     }],
            //
            // },
            {
                test: /\.(png|jpe?g|gif|svg|webp)$/,
                use: [/*{
                    loader: path.resolve(__dirname, "src/js/custom-loaders", "img-src-loader.js")
                },*/
                    {
                        // JS import и require теперь понимает как работать с картинками
                        // CSS и JS код меняют в коде названия файлов на те, что прописаны в options
                        // Копирует картинки c новыми именами в нужную папку
                        loader: 'file-loader',
                        options: {
                            name: fileName("[ext]"),
                            outputPath: "./img",
                        }
                    }]
            }
        ]
    }
};
