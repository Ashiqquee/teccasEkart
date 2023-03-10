const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/teccas");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const nocache = require("nocache");
const morgan = require('morgan');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan("tiny"));



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
app.listen(1212, () => {
  console.log("Server running...");
});
