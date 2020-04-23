import Post from "@models/Post.js";
import "@style/style.css";
import "@style/less.less";
//import "@style/scss.scss";
import Picture from "@img/2.jpg";
import * as $ from "jquery";
import "@js/babel.js";

const post = new Post("Webpack title", Picture);
console.log("Post to string: ", post.toString());
