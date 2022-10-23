const db = require("./db");

class Cart {
	static add(cart, id, quantity) {
		if (+quantity <= 0) return;
		if (cart[id]) {
			cart[id] += +quantity;
		} else {
			cart[id] = +quantity;
		}
	}
	static remove(cart, id, quantity) {
		if (+quantity <= 0) return;
		if (cart[id]) {
			if (quantity) {
				cart[id] -= +quantity;
			}
			if (cart[id] <= 0) {
				delete cart[id];
			}
		}
	}
	static log(cart) {
		let array = [];
		for (const [key, value] of Object.entries(cart)) {
			array.push(`productId ${key} x${value}`);
		}
		return array.join("\n");
	}
}

function add(session, id, quantity) {
	if (!session.cart) session.cart = {};
	Cart.add(session.cart, id, quantity);
}

function remove(session, id, quantity) {
	if (!session.cart) session.cart = {};
	Cart.remove(session.cart, id, quantity);
}

async function checkout(session) {
	if (!session.cart) return [];
	let productIds = Object.keys(session.cart);
	let products = await db.all(
		`SELECT * FROM products
		WHERE id IN (${productIds.map((element) => "?").join(", ")});`,
		productIds
	);
	for (const product of products) {
		product.quantity = session.cart[product.id];
	}
	
	return products;
}

module.exports = {
	Cart,
	add,
	remove,
	checkout,
};