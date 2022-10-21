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
		salt TEXT
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
	
	crypto.pbkdf2(password, row.salt, 1000, 32, "sha256", (err, hashed) => {
		if (err) return callback(err);
		if (row.hashed == hashed.toString("hex")) {
			return callback(null, row);
		}
		return callback(null, false, {message: "Incorrect username or password"});
	});
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

router.get("/", (req, res) => {
	res.render("index", {username: req.user?.username});
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
	let row = await db.get(
		`SELECT id FROM users WHERE username = ?;`,
		[req.body.username],
	);
	if (row) return res.render("sign-up", {message: "Username already in use"});
	else {				
		let salt = crypto.randomBytes(16).toString("hex");
		crypto.pbkdf2(req.body.password, salt, 1000, 32, "sha256", async (err, hashed) => {
			if (err) return next(err);
			let result = await db.run(
				`INSERT INTO users (username, hashed, salt) VALUES(?, ?, ?);`,
				[req.body.username, hashed.toString("hex"), salt],
			);
			if (result.id) { 
				let user = {
					id: result.id,
					username: req.body.username,
				}
				req.login(user, err => {
					if (err) return next(err);
					res.redirect("/");
				});
			}
		});
	}
});
router.post("/sign-out", (req, res, next) => {
	req.logout(err => {
		if (err) return next(err);
		res.redirect("/");
	});
});

module.exports = router;