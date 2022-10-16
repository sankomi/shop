const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./sanko-shop.db");

function run(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function(err) { //"this" is needed so arrow function not used here
			if (err) reject(err);
			else resolve({id: this.lastID});
		});
	});
}
function get(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

module.exports = {
	run,
	get,
}