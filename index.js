const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const session = require("express-session");
app.use(session({
	secret: "terces",
	resave: false,
	saveUninitialized: false,
}));

app.set("view engine", "ejs");

const product = require("./product");
app.get("/add", async (req, res) => {
	let title = Math.random().toString();
	let description = "desc";
	let image = "aaa.jpg";
	let price = 1000;
	let salePrice = 1000;
	let quantity = 100;
	let categoryId = 1;
	await product.add(title, description, image, price, salePrice, quantity, categoryId);
	res.json({ok: "ok"});
});
app.get("/single:?", async (req, res) => {
	res.json(await product.single(req.query.id));
});
app.get("/list:?", async (req, res) => {
	let filter = {
		category: +req.query.category,
	};
	res.json(await product.list(filter));
});

let cart = require("./cart");
app.get("/cart", (req, res) => {
	cart.add(req.session, Math.floor(Math.random() * 5), 1);
	res.sendStatus(200);
});
app.get("/remove", (req, res) => {
	cart.remove(req.session, Math.floor(Math.random() * 5), 1);
	res.sendStatus(200);
});
app.get("/checkout", async (req, res) => {
	res.json(await cart.checkout(req.session));
});

app.use("/", require("./auth"));

app.listen(port, () => console.log(`listening to port ${port}`));