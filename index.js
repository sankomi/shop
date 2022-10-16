const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const session = require("express-session");
app.use(session({
	secret: "terces",
	resave: false,
	saveUninitialized: false,
}));

app.set("view engine", "ejs");

app.use("/", require("./auth"));

app.listen(port, () => console.log(`listening to port ${port}`));