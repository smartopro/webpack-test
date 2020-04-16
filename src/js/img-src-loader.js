/*export default function(source) {
    return source;
}*/

module.exports = function (source) {
    /*let relativePath = path.relative(loaderContext.context, path.join(__dirname, "src"));
    if (relativePath !== "") relativePath += "/";
    //console.log("\""+relativePath+"\"");

    const dom = new JSDOM(content);
    //console.log(dom.window.document.getElementsByTagName("img").length);
    Array.from(dom.window.document.getElementsByTagName("img")).forEach((item, index) => {
        item.setAttribute("src", relativePath + item.getAttribute("src"));
    });

    content = dom.serialize();
    console.log(content);

    return content;*/

    console.log(source);
    return source;
}
