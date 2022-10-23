const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.SECRET_KEY);
const db = require("./db");
const cart = require("./cart");

router.get("/", async (req, res) => {
	let products = await cart.checkout(req.session);
	if (!products.length) return res.redirect("/checkout/");
	
	let lineItems = products.map(product => {
		return {
			price_data: {
				currency: "aud",
				product_data: {
					name: product.title,
				},
				unit_amount: product.salePrice || Math.min(product.salePrice, product.price),
			},
			quantity: product.quantity,
		};
	});
	
	const session = await stripe.checkout.sessions.create({
		line_items: lineItems,
		mode: "payment",
		success_url: "http://127.0.0.1:3000/payment/success/",
		cancel_url: "http://127.0.0.1:3000/payment/cancel/",
	});
	
	res.redirect(303, session.url);
});

router.get("/success/", (req, res) => {
	res.render("payment/success");
});
router.get("/cancel/", (req, res) => {
	res.render("payment/cancel");
});

module.exports = router;