const express = require("express");
const user_route = express();

const session = require("express-session");

const config = require("../config/config");

user_route.use(
  session({
    secret: config.sessionSecret,
    saveUninitialized: true,
    resave: false,
    cookie: {
      maxAge: 500000,
    },
  })
);

const auth = require("../middleware/auth");

user_route.set("views", "./views/users");

const userController = require("../controllers/userController");

user_route.get("/signup", auth.isLogout, userController.loadRegister);

user_route.post("/signup", userController.insertUser);

user_route.get("/login", auth.isLogout, userController.loginLoad);

user_route.post("/login", userController.verifyLogin);

user_route.get("/", userController.loadHome);

user_route.get("/logout", auth.isLogin, userController.userLogout);

user_route.post("/verifyOtp", userController.otpVerify);



module.exports = user_route;
