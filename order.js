const db = require("./db");
const cart = require("./cart");

db.run(
	`CREATE TABLE IF NOT EXISTS orders (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT,
		orderId TEXT,
		json TEXT
	);`
);

async function save(stripe, session) {
	let checkout = await cart.checkout(session, true);
	let order = await db.get(`SELECT id FROM orders WHERE orderId = ?;`, [stripe.id]);
	if (order) {
		return {result: "exists", orderId: order.id};
	}
	
	try {
		let result = await db.run(
			`INSERT INTO orders (email, orderId, json) VALUES (?, ?, ?);`,
			[stripe.customer_details.email, stripe.id, JSON.stringify(checkout)],
		);
		session.cart = {};
		return {result: "saved", orderId: result.id};
	} catch (err) {
		return {result: "error"};
	}
}

async function list() {
	let orders = await db.all(`SELECT * FROM orders;`);
	return orders;
}

module.exports = {
	save,
	list,
}