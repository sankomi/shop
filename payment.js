const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.SECRET_KEY);
const db = require("./db");
const cart = require("./cart");

router.get("/", async (req, res) => {
	let products = await cart.checkout(req.session);
	if (!products.length) {
		let products = await cart.checkout(req.session);
		return res.render("checkout", {products, message: "Cart is empty"});
	}
	
	let total = 0;
	
	let lineItems = products.map(product => {
		let price = product.salePrice || Math.min(product.salePrice, product.price) || product.price;
		total += price * product.quantity;
		
		return {
			price_data: {
				currency: "aud",
				product_data: {
					name: product.title,
				},
				unit_amount: price,
			},
			quantity: product.quantity,
		};
	});
	
	if (total > 99999999) {
		let products = await cart.checkout(req.session);
		return res.render("checkout", {products, message: "Total amount must be less than $999999.99"});
	}
	
	const session = await stripe.checkout.sessions.create({
		line_items: lineItems,
		mode: "payment",
		success_url: process.env.URL + "/payment/success/?session_id={CHECKOUT_SESSION_ID}",
		cancel_url: process.env.URL + "/payment/cancel/",
	});
	
	res.redirect(303, session.url);
});

const order = require("./order");

router.get("/success/", async (req, res) => {
	let stripeSession;
	try {
		stripeSession = await stripe.checkout.sessions.retrieve(req.query.session_id);		
		if (stripeSession.payment_status === "paid" && stripeSession.status === "complete") {
			let result = await order.save(stripeSession, req.session);
			if (result.result === "error") {
				throw new Error("Error while saving order details");
			} else if (result.result === "exists") {
				res.render("payment/success", {success: false, message: "Payment was already made.", orderId: result.orderId});
			} else {
				res.render("payment/success", {success: true, orderId: result.orderId});
			}
		} else {
			throw new Error("Payment failed");
		}
	} catch (err) {
		res.render("payment/success", {success: false, message: "Something went wrong."});
	}
});
router.get("/cancel/", (req, res) => {
	res.render("payment/cancel");
});

module.exports = router;