const express = require("express");
const router = express.Router();

const passport = require("passport");
router.use(passport.initialize());
router.use(passport.session());

router.use((req, res, next) => {
	if (!req.user?.manager) return res.redirect("/sign-in/");
	next();
});

const product = require("./product");

router.get("/add/", async (req, res) => {
	res.render("admin/product-add");
});
router.post("/add/", async (req, res) => {
	let title = req.body.title;
	let description = req.body.description;
	let image = req.body.image;
	let price = +req.body.price;
	let salePrice = +req.body.salePrice;
	let stock = 100000;
	let categoryId = +req.body.category;
	await product.add(title, description, image, price, salePrice, stock, categoryId);
	res.render("admin/product-add");
});

router.get("/edit/", async (req, res) => {
	let single = await product.single(+req.query.id);
	res.render("admin/product-edit", {product: single});
});
router.post("/edit/", async (req, res) => {
	let id = +req.query.id;
	let title = req.body.title;
	let description = req.body.description;
	let image = req.body.image;
	let price = +req.body.price;
	let salePrice = +req.body.salePrice;
	let stock = 100000;
	let categoryId = +req.body.category;
	await product.update(id, title, description, image, price, salePrice, stock, categoryId);
	res.render("admin/product-edit", {product: {id, title, description, image, price, salePrice, stock, categoryId}});
});

router.get("/products/", async (req, res) => {
	let products = await product.list();
	res.render("admin/product-list", {products});
});

const user = require("./user");

router.get("/users/", async (req, res) => {
	let users = await user.list();
	res.render("admin/user-list", {users});
});

router.get("/", (req, res) => {
	res.render("admin/admin");
});

module.exports = router;