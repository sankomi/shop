require('dotenv').config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
app.use(session({
	store: new SQLiteStore({db: "sessions.db"}),
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

//always pass user info to views
app.use((req, res, next) => {
	if (!req.user) return next();
	res.locals.id = req.user.id;
	res.locals.username = req.user.username;
	res.locals.manager = req.user.manager;
	next();
});

const product = require("./product");
app.get("/product/", async (req, res) => {
	let single = await product.single(+req.query.id);
	res.render("product/single", {product: single});
});
app.get("/products/", async (req, res) => {
	let filter = {
		category: +req.query.category,
	};
	let products = await product.list(filter);
	res.render("product/list", {products});
});

let cart = require("./cart");
app.post("/product/", async (req, res) => {
	cart.add(req.session, req.body.id, req.body.quantity);
	let single = await product.single(req.body.id);
	res.render("product/single", {product: single, added: true});
});

app.get("/checkout", async (req, res) => {
	let products = await cart.checkout(req.session);
	res.render("checkout", {products});
});

app.use("/payment", require("./payment"));
app.use("/admin", require("./admin"));
app.use("/", require("./user").router);

app.get("/", async (req, res) => {
	let random = await product.random();
	res.render("index", {product: random});
});

app.listen(port, () => console.log(`listening to port ${port}`));