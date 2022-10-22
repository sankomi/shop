const express = require("express");
const router = express.Router();

const passport = require("passport");
const LocalStrategy = require("passport-local");
const crypto = require("crypto");

const db = require("./db.js");
db.run(
	`CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT,
		hashed TEXT,
		salt TEXT,
		manager INTEGER
	);`
);

router.use(passport.initialize());
router.use(passport.session());

passport.use(new LocalStrategy(async (username, password, callback) => {
	let row = await db.get(
		`SELECT id, username, hashed, salt FROM users WHERE username = ?;`,
		[username],
	);
	if (!row) return callback(null, false, {message: "Incorrect username or password"});
	
	try {
		let hashed = await crypto.pbkdf2Sync(password, row.salt, 1000, 32, "sha256");
		if (row.hashed == hashed.toString("hex")) {
			return callback(null, row);
		}
		return callback(null, false, {message: "Incorrect username or password"});
	} catch (err) {
		return callback(err);
	}
}));
passport.serializeUser((user, callback) => {
	process.nextTick(() => {
		callback(null, {id: user.id, username: user.username});
	});
});
passport.deserializeUser((user, callback) => {
	process.nextTick(() => {
		callback(null, user);
	});
});

router.get("/sign-in", (req, res) => {
	res.render("sign-in");
});
router.post("/sign-in", (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) return next(err);
		if (user) {
			req.login(user, err => {
				if (err) return next(err);
				res.redirect("/");
			});
		} else {
			res.render("sign-in", {message: info.message});
		}
	})(req, res, next);
});
router.get("/sign-up", (req, res) => {
	res.render("sign-up");
});
router.post("/sign-up", async (req, res, next) => {
	let numUsers = await db.get(`SELECT COUNT(*) AS count FROM users;`);
	let firstUser = numUsers.count === 0;
	
	let row = await db.get(
		`SELECT id FROM users WHERE username = ?;`,
		[req.body.username],
	);
	if (row) return res.render("sign-up", {message: "Username already in use"});
	else {
		try {
			let salt = await crypto.randomBytes(16).toString("hex");
			let hashed = await crypto.pbkdf2Sync(req.body.password, salt, 1000, 32, "sha256");
			let result = await db.run(
				`INSERT INTO users (username, hashed, salt) VALUES(?, ?, ?);`,
				[req.body.username, hashed.toString("hex"), salt],
			);
			if (result.id) {
				//if first user sign up make them manager
				if (firstUser) {
					await db.run(
						`UPDATE users SET manager = 1 WHERE id = ?`,
						[result.id],
					);
				}
				
				let user = {
					id: result.id,
					username: req.body.username,
				}
				req.login(user, err => {
					if (err) return next(err);
					res.redirect("/");
				});
			}
		} catch (err) {
			return next(err);
		}
	}
});
router.get("/sign-out", (req, res, next) => {
	req.logout(err => {
		if (err) return next(err);
		res.redirect("/");
	});
});
router.get("/change-password", (req, res) => {
	if (!req.user) return res.redirect("/sign-in");
	res.render("change-password");
});
router.post("/change-password", async (req, res) => {
	if (!req.user) return res.redirect("/sign-in");
	let username = req.user.username;
	let currentPassword = req.body.currentPassword;
	let newPassword = req.body.newPassword;
	if (!currentPassword || !newPassword) return res.render("change-password", {message: "Passwords cannot be emtpy"});
	
	let row = await db.get(
		`SELECT id, username, hashed, salt FROM users WHERE username = ?;`,
		[username],
	);
	if (!row) return res.render("change-password", {message: "User does not exist"});
	
	try {
		let hashed = await crypto.pbkdf2Sync(currentPassword, row.salt, 1000, 32, "sha256");
		if (row.hashed == hashed.toString("hex")) {
			let newHashed = await crypto.pbkdf2Sync(newPassword, row.salt, 1000, 32, "sha256");
			await db.run(
				`UPDATE users SET hashed = ? WHERE username = ?;`,
				[newHashed.toString("hex"), username],
			);
			return res.render("change-password", {message: "Password changed"});
		} else {
			return res.render("change-password", {message: "Incorrect password"});
		}
	} catch (err) {
		return res.render("change-password", {message: "Error"});
	}
});

async function list() {
	let list = await db.all(`SELECT * FROM users;`);
	return list;
}

module.exports = {
	router,
	list,
}