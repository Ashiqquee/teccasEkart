const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/teccas");
const path = require("path");
const express = require("express");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
const nocache = require("nocache");
const morgan = require('morgan');
const config = require("./config/config");
require("dotenv").config();
const PORT= process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan("tiny"));

app.use(
  session({
    secret: config.sessionSecret,
    saveUninitialized: true,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 24 * 10,
    },
  })
);


app.use(nocache());

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

/////////////////for user routes///////////////

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

/////////////////for admin routes//////////////

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

////////////PORT/////////////////////////
app.listen(PORT, () => {
  console.log("Server running...");
});
