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
		success_url: "http://127.0.0.1:3000/payment/success/?session_id={CHECKOUT_SESSION_ID}",
		cancel_url: "http://127.0.0.1:3000/payment/cancel/",
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