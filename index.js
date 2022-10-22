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
	res.render("product-add");
});
app.post("/add", async (req, res) => {
	let title = req.body.title;
	let description = req.body.description;
	let image = req.body.image;
	let price = +req.body.price;
	let salePrice = +req.body.salePrice;
	let stock = 100000;
	let categoryId = +req.body.category;
	await product.add(title, description, image, price, salePrice, stock, categoryId);
	res.render("product-add");
});
app.get("/edit/:id?", async (req, res) => {
	let single = await product.single(+req.params.id);
	res.render("product-edit", {product: single});
});
app.post("/edit/:id?", async (req, res) => {
	let id = +req.params.id;
	let title = req.body.title;
	let description = req.body.description;
	let image = req.body.image;
	let price = +req.body.price;
	let salePrice = +req.body.salePrice;
	let stock = 100000;
	let categoryId = +req.body.category;
	await product.update(id, title, description, image, price, salePrice, stock, categoryId);
	res.render("product-edit", {product: {id, title, description, image, price, salePrice, stock, categoryId}});
});
app.get("/product/:id?", async (req, res) => {
	let single = await product.single(+req.params.id);
	res.render("product-single", {product: single});
});
app.get("/products/:category?", async (req, res) => {
	let filter = {
		category: +req.params.category,
	};
	let products = await product.list(filter);
	res.render("product-list", {products});
});

let cart = require("./cart");
app.post("/cart-add", async (req, res) => {
	cart.add(req.session, req.body.id, req.body.quantity);
	res.sendStatus(200);
});

app.get("/cart", (req, res) => {
	cart.add(req.session, Math.floor(Math.random() * 5), 1);
	res.sendStatus(200);
});
app.get("/remove", (req, res) => {
	cart.remove(req.session, Math.floor(Math.random() * 5), 1);
	res.sendStatus(200);
});
app.get("/checkout", async (req, res) => {
	let products = await cart.checkout(req.session);
	res.render("checkout", {products});
});

app.use("/", require("./auth"));

app.listen(port, () => console.log(`listening to port ${port}`));