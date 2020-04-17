const path = require("path");
const fs = require('fs');
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
                filename: `${templateDir}${templateDir === "" ? "" : "/"}${name}.${extension}`,
                template: path.resolve(__dirname, `src`, templateDir, `${name}.${extension}`),
                chunks: ["analytics", name],
                inject: true
            })
        }).concat(plugins);
    });
    return plugins;
}

const htmlPlugins = generateHtmlPlugins(["", "js"]);

// ------------------

module.exports = {
    context: path.resolve(__dirname, "src"),
    // режим по-умолчанию
    mode: "development",
    //cache: false,
    devtool: "source-map",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@img": path.resolve(__dirname, "src/img")
        }
    },
    optimization: {
        splitChunks: {
            // Если несколько точек входа, то не грузить общий код дважды, в к файле vendors-...
            // chunks: "all"
        }
    },
    entry: {
        // 3 точки входа
        index: "./js/index.js",
        analytics: "./js/analytics.js",
        contacts: "./js/contacts.js"
    },
    output: {
        // для каждой точки входа своя точка выхода
        filename: "./js/[name].[contenthash].js",
        // TBD: if is production => to folder "dist/release"
        path: path.resolve(__dirname, "dist/debug")
    },
    /*devServer: {
        port: 4000,
        writeToDisk: (fileName) => {
            return (/\.(html?|php)$/.test(fileName));
        },
        proxy: {
            "/": {
                target: "http://localhost:800/code/sandbox/webpack-test/dist/debug",
            }
        }
    },*/
    plugins: [
        // NASA plugin
        new DashboardPlugin({}),

        // not cleaned from memory for devServer
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false // очищать неиспользуемое при ребилде?
            //cleanAfterEveryBuildPatterns: ["!**/.htaccess"],
        }),
        /*new HTMLWebpackPlugin({
            filename: "index.php",
            template: "./index.php",
            chunks: ["analytics", "index"]
        }),
        new HTMLWebpackPlugin({
            filename: "contacts.php",
            template: "./contacts.php",
            chunks: ["analytics", "contacts"]
        }),*/
        new BrowserSyncPlugin({
            port: 3000,
            proxy: "http://localhost:800/code/sandbox/webpack-test/dist/debug"
        }),
        /*
        new CopyWebpackPlugin([
            {
                from: "./.htaccess",
                to: path.resolve(__dirname, "dist/debug")
            }
        ]),
        */
        new CopyWebpackPlugin([
            {
                from: "./img/**/*.*",
                to: path.resolve(__dirname, "dist/debug")
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
        })
    ].concat(htmlPlugins),
    // HTMLWebpackPlugin:
    // 1. Создаёт HTML на основе template
    // 2. Вставляет <script> в HTML
    module: {
        rules: [
            {
                test: /\.css$/i,
                // css-loader: возможность сделать так: import "../style/style.css" в js-коде
                // style-loader: добавляет css в head в HTML
                use: ["style-loader", "css-loader"]
            },
            /*{
                test: /\.(html?|php)$/i,
                // 1. Минимизирует HTML
                // 2. Ищет изображения в HTML и делает их импорт через JS: import img from "./image.png"
                // 3. Меняет путь до изображения в HTML
                use: [
                    {
                        loader: "html-loader",
                        options: {
                            preprocessor: (content, loaderContext) => {
                                return content;
                            }
                        }
                    }]
            },*/
            {
                test: /\.(png|jpe?g|gif|svg|webp)$/,
                use: [
                    {
                    // JS import и require теперь понимает как работать с картинками
                    // CSS и JS код меняют в коде названия файлов на те, что прописаны в options
                    // Копирует картинки c новыми именами в нужную папку
                    loader: 'file-loader',
                    options: {
                        name: "[name].[contenthash].[ext]",
                        outputPath: "img"

                    }
                }]
            }
        ]
    }
};
