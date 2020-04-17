import Post from "@/js/Post";
import "@/style/style.css";
import Picture from "@img/2.jpg";
const post = new Post("Webpack title", Picture);
console.log("Post to string: ", post.toString());
