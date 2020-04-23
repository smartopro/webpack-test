import Post from "@models/Post.js";
import "@style/style.css";
import "@style/less.less";
//import "@style/scss.scss";
import Picture from "@img/2.jpg";
import * as $ from "jquery";
import "@/js/babel.js";
import React from "react";
import {render} from "react-dom";

const post = new Post("Webpack title", Picture);
console.log("Post to string: ", post.toString());

const App = () => (
    <div className="container">
        <a href="./contacts.php">Контакты</a>
        <a href="./admin/index.php">Index in JS folder</a>
        <h1>Webpack course</h1>
        <div>
        </div>
        <img src="img/1.webp" height="300" alt="1.jpg"/>
        <div className="box">
            <h2>LESS</h2>
        </div>
        <div className="card">
            <h2>SCSS</h2>
        </div>
    </div>
);
render(<App/>, document.getElementById("app"));