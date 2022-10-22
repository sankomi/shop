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

//always add trailing slash so relative urls don't stuff up
app.use((req, res, next) => {
	if (req.path.substr(-1) !== "/") {
		return res.redirect(301, req.baseUrl + req.url + "/");
	}
	next();
});

//if signed in and manager not defined check manager
const passport = require("passport");
app.use(passport.initialize());
app.use(passport.session());
const db = require("./db");
app.use(async (req, res, next) => {
	if (!req.user) return next();
	if (req.user.manager === undefined) {
		let result = await db.get(
			`SELECT manager FROM users WHERE id = ?;`,
			[req.user.id],
		);
		req.user.manager = !!result.manager; //convert number to boolean
	}
	next();
});

const product = require("./product");
app.get("/product/", async (req, res) => {
	let single = await product.single(+req.query.id);
	res.render("product-single", {product: single});
});
app.get("/products/", async (req, res) => {
	let filter = {
		category: +req.query.category,
	};
	let products = await product.list(filter);
	res.render("product-list", {products});
});

let cart = require("./cart");
app.post("/cart-add/", async (req, res) => {
	cart.add(req.session, req.body.id, req.body.quantity);
	res.sendStatus(200);
});

app.get("/cart/", (req, res) => {
	cart.add(req.session, Math.floor(Math.random() * 5), 1);
	res.sendStatus(200);
});
app.get("/remove/", (req, res) => {
	cart.remove(req.session, Math.floor(Math.random() * 5), 1);
	res.sendStatus(200);
});
app.get("/checkout", async (req, res) => {
	let products = await cart.checkout(req.session);
	res.render("checkout", {products});
});

app.use("/admin", require("./admin"));
app.use("/", require("./user").router);

app.listen(port, () => console.log(`listening to port ${port}`));