async function start() {
    return await Promise.resolve("async working");
}

start().then(console.log);

class Util {
    static id = Date.now();
}

let unused = 42;

console.log("Util ID: ", Util.id);

// Динамический импорт сторонней библиотеки
import("lodash").then( _ => {
    console.log("Lodash: ", _.random(0, 100, true));
})